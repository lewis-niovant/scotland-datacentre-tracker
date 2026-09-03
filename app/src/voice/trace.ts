/* Session recorder. Every tool call, card, camera move and utterance lands
   here with a timestamp, so a conversation can be replayed and debugged as a
   timeline rather than guessed at from a final screenshot. Dev-only surface:
   window.__sdoTrace.timeline() prints it; .dump() returns raw JSON. */

export type TraceKind =
  | 'session' | 'tool_call' | 'tool_result' | 'tool_error'
  | 'card_in' | 'card_out' | 'camera' | 'speech' | 'fx' | 'note'

export interface TraceEvent {
  t: number
  kind: TraceKind
  name: string
  detail?: unknown
  ms?: number
}

const MAX = 800
let t0 = performance.now()
let events: TraceEvent[] = []

export function traceReset(): void {
  t0 = performance.now()
  events = []
}

export function trace(kind: TraceKind, name: string, detail?: unknown, ms?: number): void {
  events.push({ t: Math.round(performance.now() - t0), kind, name, detail, ms })
  if (events.length > MAX) events = events.slice(-MAX)
}

/** Wraps a tool execute so timing and failures are recorded automatically. */
export function tracedExecute<A, R>(
  name: string,
  fn: (args: A) => Promise<R>,
): (args: A) => Promise<R> {
  return async (args: A) => {
    const started = performance.now()
    trace('tool_call', name, args)
    try {
      const out = await fn(args)
      const ms = Math.round(performance.now() - started)
      trace('tool_result', name, typeof out === 'string' ? out.slice(0, 300) : out, ms)
      return out
    } catch (e) {
      const ms = Math.round(performance.now() - started)
      const msg = e instanceof Error ? e.message : String(e)
      trace('tool_error', name, msg, ms)
      throw e
    }
  }
}

function fmt(e: TraceEvent): string {
  const secs = (e.t / 1000).toFixed(1).padStart(6)
  const dur = e.ms != null ? ` (${e.ms}ms)` : ''
  let d = ''
  if (e.detail != null) {
    const s = typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail)
    d = ` ${s.length > 160 ? `${s.slice(0, 160)}…` : s}`
  }
  return `${secs}s  ${e.kind.padEnd(11)} ${e.name}${dur}${d}`
}

export function timeline(): string {
  return events.map(fmt).join('\n')
}

export function dump(): TraceEvent[] {
  return [...events]
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { __sdoTrace?: unknown }).__sdoTrace = { timeline, dump, reset: traceReset, trace }
}
