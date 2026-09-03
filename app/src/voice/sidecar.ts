import { finishArtifact, openArtifact, updateArtifact, type ArtifactKind } from './stage'
import { trace } from './trace'

/* The fast text model behind the voice. Two shapes: a whole answer, or a
   stream piped straight into an artifact card so the reader watches it being
   written instead of waiting at a spinner. */

const QUICK_URL = `${import.meta.env.BASE_URL}api/quick-llm`
const STREAM_URL = `${import.meta.env.BASE_URL}api/quick-llm-stream`

/* Artifact requests deliberately outlive the tool call that starts them, but
   they must not outlive the voice session (or the map route) that owns the
   stage. Keep each fetch abortable both by an optional caller signal and by
   the session-wide teardown in useVoiceGuide. */
const activeStreams = new Set<AbortController>()

export function cancelArtifactStreams(reason = 'voice session ended'): void {
  for (const ctrl of activeStreams) ctrl.abort(reason)
  activeStreams.clear()
}

export const ARTIFACT_FORMATS: Record<ArtifactKind, string> = {
  bullets: 'Output 3-5 lines. Each line is one bullet, under 14 words, no leading dash.',
  table: 'Output pipe-separated rows. FIRST line is the header. EXACTLY 2 columns. Keep every cell under 28 characters — short label on the left, short value on the right. 3-6 data rows. No markdown separator row.',
  flow: 'Output 3-5 lines, each one step in order. Format: "Step name | one clause of AT MOST 12 WORDS". Never exceed 12 words after the pipe. No numbering.',
  timeline: 'Output 3-6 lines, oldest first. Format: "Date or year | what happened in AT MOST 10 WORDS".',
}

export async function quickLlm(system: string, prompt: string, maxTokens = 220): Promise<string> {
  const ctrl = new AbortController()
  const t = window.setTimeout(() => ctrl.abort(), 12000)
  try {
    const r = await fetch(QUICK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system, prompt, max_tokens: maxTokens }),
      signal: ctrl.signal,
    })
    const j = await r.json().catch(() => null)
    if (!r.ok || !j?.text) throw new Error(j?.error ?? `sidecar returned ${r.status}`)
    return j.text as string
  } finally { window.clearTimeout(t) }
}

export async function streamIntoArtifact(
  cardId: number,
  system: string,
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const started = performance.now()
  const ctrl = new AbortController()
  const abort = () => ctrl.abort(signal?.reason ?? 'artifact stream cancelled')
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  activeStreams.add(ctrl)
  try {
    const r = await fetch(STREAM_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system, prompt, max_tokens: 420 }),
      signal: ctrl.signal,
    })
    if (!r.ok || !r.body) throw new Error(`stream failed (${r.status})`)
    const reader = r.body.getReader()
    const dec = new TextDecoder()
    let text = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      text += dec.decode(value, { stream: true })
      updateArtifact(cardId, text)
    }
    /* A trailing newline promotes the final partial line in the parser. */
    updateArtifact(cardId, `${text}\n`)
    finishArtifact(cardId, 'ready')
    trace('note', 'artifact_stream', { chars: text.length }, Math.round(performance.now() - started))
    return text
  } catch (e) {
    if (ctrl.signal.aborted) {
      trace('note', 'artifact_stream_cancelled')
      throw e
    }
    finishArtifact(cardId, 'failed')
    throw e
  } finally {
    activeStreams.delete(ctrl)
    signal?.removeEventListener('abort', abort)
  }
}

/** Opens an artifact and starts filling it, without waiting. */
export function beginArtifact(
  kind: ArtifactKind,
  title: string,
  system: string,
  prompt: string,
  source?: string,
  signal?: AbortSignal,
): number {
  const id = openArtifact(kind, title, source ?? 'written live by a fast model from observatory data')
  streamIntoArtifact(id, system, prompt, signal).catch(() => { /* failure is reflected on the card; cancellation is silent */ })
  return id
}
