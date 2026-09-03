import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeItem, RealtimeSession } from '@openai/agents-realtime'
import type { Dataset } from '../lib/data'
import { buildInstructions } from './instructions'
import { overviewCards } from './overviewCards'
import { clearStage, presentCards } from './stage'
import { clearFx, spotlight } from './mapFx'
import { flagshipSite } from './queryEngine'
import { dashboard } from './commandBus'
import { trace, traceReset } from './trace'
import { registerNudger } from './nudge'
import { cancelShowcase, startShowcase } from './showcase'
import { cancelArtifactStreams } from './sidecar'
import { projectCoords } from '../lib/data'

/* Keep in sync with the default in vite-plugin-realtime-token.ts — the model
   is pinned server-side in the minted client secret; this is the client hint. */
export const REALTIME_MODEL = 'gpt-realtime-2.1-mini'

const TOKEN_URL = `${import.meta.env.BASE_URL}api/realtime-token`

export type VoiceStatus = 'checking' | 'unavailable' | 'idle' | 'connecting' | 'live' | 'error'

export interface VoiceGuide {
  status: VoiceStatus
  /** Latest agent utterance (transcript), for the caption strip. */
  caption: string
  speaking: boolean
  error: string
  start(): void
  stop(): void
}

/** How many turns came from the visitor rather than from us.

    Stage directions (the opening prompt, and every nudge fired by a timed
    visual) are delivered as user messages too, so a naive count treats the
    guide's own choreography as an interruption. Anything we sent is recorded
    in `own`; everything else — spoken audio, or text injected by the test
    harness — is a real person taking over. */
function visitorTurns(history: RealtimeItem[], own: Set<string>): number {
  let n = 0
  for (const item of history as Array<{
    type?: string; role?: string
    content?: Array<{ type?: string; transcript?: string | null; text?: string }>
  }>) {
    if (item.type !== 'message' || item.role !== 'user' || !Array.isArray(item.content)) continue
    for (const c of item.content) {
      if (c.type === 'input_audio' && (c.transcript ?? '').trim()) { n++; break }
      const text = (c.text ?? '').trim()
      if (text && !own.has(text)) { n++; break }
    }
  }
  return n
}

/** Latest assistant transcript out of the session history. */
function lastAssistantText(history: RealtimeItem[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i] as { type?: string; role?: string; content?: Array<{ type?: string; transcript?: string | null; text?: string }> }
    if (item.type !== 'message' || item.role !== 'assistant' || !Array.isArray(item.content)) continue
    for (const c of item.content) {
      const t = c.transcript ?? c.text
      if (t) return t
    }
  }
  return ''
}

export function useVoiceGuide(ds: Dataset): VoiceGuide {
  const [status, setStatus] = useState<VoiceStatus>('checking')
  const [caption, setCaption] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const sessionRef = useRef<RealtimeSession | null>(null)
  const startingRef = useRef(false)
  const attemptRef = useRef(0)
  /* Set once a session is live; opens the mic after the welcome. */
  const openMicRef = useRef<(() => void) | null>(null)
  /* Sends a message to the session and records it as the guide's own. */
  const ownRef = useRef<((text: string) => void) | null>(null)
  /* Opening choreography is separate from showcase.ts, so it needs the same
     lifecycle ownership rather than a handful of fire-and-forget timers. */
  const timersRef = useRef<Set<number>>(new Set())

  const after = useCallback((fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, ms)
    timersRef.current.add(id)
    return id
  }, [])

  const teardown = useCallback((resetUi: boolean) => {
    attemptRef.current += 1
    startingRef.current = false

    const session = sessionRef.current
    /* Detach first so a close event cannot schedule fresh work while teardown
       is already in progress. */
    sessionRef.current = null
    openMicRef.current = null
    ownRef.current = null
    for (const timer of timersRef.current) window.clearTimeout(timer)
    timersRef.current.clear()

    cancelShowcase('session ended')
    registerNudger(null)
    cancelArtifactStreams('session ended')
    clearStage()
    clearFx()

    const debugWindow = window as unknown as { __sdoVoice?: RealtimeSession }
    if (debugWindow.__sdoVoice === session) delete debugWindow.__sdoVoice
    session?.close()

    if (!resetUi) return
    setSpeaking(false)
    setCaption('')
    setStatus((s) => (s === 'live' || s === 'connecting' || s === 'error' ? 'idle' : s))
  }, [])

  /* The token endpoint only exists under the dev server. On the deployed
     static site the probe 404s and the voice UI simply never renders. */
  useEffect(() => {
    let alive = true
    fetch(TOKEN_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setStatus(j?.available ? 'idle' : 'unavailable') })
      .catch(() => { if (alive) setStatus('unavailable') })
    return () => { alive = false }
  }, [])

  const stop = useCallback(() => {
    teardown(true)
  }, [teardown])

  const start = useCallback(async () => {
    if (startingRef.current || sessionRef.current) return
    const attempt = ++attemptRef.current
    startingRef.current = true
    setError('')
    setStatus('connecting')
    traceReset()
    trace('session', 'connect_start')
    let connectingSession: RealtimeSession | null = null
    try {
      const r = await fetch(TOKEN_URL, { method: 'POST' })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.value) {
        throw new Error(j?.error?.message ?? j?.error ?? `Token endpoint returned ${r.status}`)
      }
      if (attempt !== attemptRef.current) return
      const [{ RealtimeAgent, RealtimeSession }, { buildTools }] = await Promise.all([
        import('@openai/agents-realtime'),
        import('./tools'),
      ])
      if (attempt !== attemptRef.current) return
      const agent = new RealtimeAgent({
        name: 'Observatory guide',
        instructions: buildInstructions(ds),
        tools: buildTools(ds),
      })
      const session = new RealtimeSession(agent, { model: REALTIME_MODEL })
      connectingSession = session
      /* Make a connecting session reachable by Stop immediately. */
      sessionRef.current = session
      let lastSpoken = ''
      let userTurns = 0
      /* Everything the guide says to itself is recorded here, so its own
         stage directions are never mistaken for the visitor interrupting. */
      const own = new Set<string>()
      session.on('history_updated', (history) => {
        if (sessionRef.current !== session) return
        const t = lastAssistantText(history)
        setCaption(t)
        if (t && t !== lastSpoken) { lastSpoken = t; trace('speech', 'assistant', t.slice(0, 200)) }
        /* The moment the visitor says anything, the scripted walkthrough gets
           out of the way — it exists to start the conversation, not to hold
           the floor against them. */
        const turns = visitorTurns(history, own)
        if (turns > userTurns) {
          userTurns = turns
          trace('speech', 'user_spoke', { turns })
          cancelShowcase('user spoke')
        }
      })
      session.on('audio_start', () => {
        if (sessionRef.current !== session) return
        setSpeaking(true)
        trace('speech', 'audio_start')
      })
      session.on('audio_stopped', () => {
        if (sessionRef.current !== session) return
        setSpeaking(false)
        trace('speech', 'audio_stopped')
        /* The welcome has been delivered — safe to start listening. */
        after(() => openMicRef.current?.(), 400)
      })
      session.on('audio_interrupted', () => {
        if (sessionRef.current !== session) return
        setSpeaking(false)
        trace('speech', 'interrupted')
      })
      session.on('error', (e) => { trace('tool_error', 'session', String(e)); console.warn('[voice] session error', e) })
      await session.connect({ apiKey: j.value })
      if (attempt !== attemptRef.current || sessionRef.current !== session) {
        session.close()
        return
      }
      setStatus('live')
      trace('session', 'connected')
      const direct = (text: string) => {
        own.add(text.trim())
        try { session.sendMessage(text) } catch { /* closed */ }
      }
      ownRef.current = direct
      /* Timed visuals speak through the guide rather than appearing mutely. */
      registerNudger(direct)
      /* Dev/verification hook: lets Playwright (and us) drive the session by
         text without a microphone. */
      ;(window as unknown as { __sdoVoice?: RealtimeSession }).__sdoVoice = session
      /* The opening tableau rises, and the flagship site is ringed on the map,
         so the visitor sees the map answer to the guide immediately rather
         than facing a static screen while it talks. */
      presentCards(overviewCards(ds), { ttlMs: 30000 })
      const flag = flagshipSite(ds)
      const flagCoords = flag && projectCoords(flag)
      if (flag && flagCoords) {
        after(() => {
          if (sessionRef.current !== session) return
          try {
            const map = dashboard().getMap()
            if (map) {
              const token = spotlight(map, flagCoords, flag.project.display_name ?? flag.project.canonical_name)
              trace('fx', 'opening_spotlight', flag.project.slug)
              /* The ring is an invitation, not furniture — lift it once the
                 opening offer has landed, but only if nothing else has taken
                 the stage in the meantime. */
              after(() => clearFx(token), 20000)
            }
          } catch { /* map page not mounted */ }
        }, 900)
      }
      /* The opening was being cut in half by the visitor's own microphone:
         a cough, a room, a breath was enough for turn detection to treat the
         greeting as interruptible, so it stopped mid-sentence and then
         answered a phantom turn. Hold the mic closed until the welcome has
         been delivered, then open it and start listening properly. */
      session.mute(true)
      trace('session', 'mic_muted_for_greeting')
      after(() => {
        if (sessionRef.current !== session) return
        direct('WALKTHROUGH BEAT 1 of 6. The visitor has just arrived and knows nothing yet. On screen: the whole of Scotland, the headline figures, and one site ringed. Say ONE sentence on what this map is, then ONE sentence saying you will take them to a real example — warm, no jargon, no questions yet. Call nothing; the walkthrough moves itself.')
        trace('session', 'greeting_sent')
      }, 600)
      /* The scripted opening route starts once the welcome has been said. */
      after(() => { if (sessionRef.current === session) startShowcase(ds) }, 9000)
      /* Open the mic once the welcome has had time to land (or as soon as it
         finishes, whichever comes first — tracked by the audio_stopped hook). */
      openMicRef.current = () => {
        if (sessionRef.current !== session || !session.muted) return
        session.mute(false)
        trace('session', 'mic_opened')
      }
      after(() => openMicRef.current?.(), 13000)
    } catch (e) {
      connectingSession?.close()
      if (sessionRef.current === connectingSession) sessionRef.current = null
      if (attempt !== attemptRef.current) return
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    } finally {
      if (attempt === attemptRef.current) startingRef.current = false
    }
  }, [after, ds])

  /* StrictMode-safe teardown. */
  useEffect(() => () => teardown(false), [teardown])

  return { status, caption, speaking, error, start, stop }
}
