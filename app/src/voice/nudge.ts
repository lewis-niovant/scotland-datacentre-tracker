import { trace } from './trace'

/* Timed visuals need the guide to speak when they land, not before.

   Without this, a thirty-second animation got narrated in one breath at the
   start and then played out in silence, and cards arrived while the guide was
   talking about something else. A visual can now nudge the session at the
   exact moment it appears, and the guide narrates it in its own words.

   Nudges are advisory and rate-limited: the guide is told what just happened
   on screen, never what to say verbatim. */

type Nudger = (text: string) => void
let nudger: Nudger | null = null
let lastAt = 0
const MIN_GAP_MS = 2600

export function registerNudger(fn: Nudger | null): void {
  nudger = fn
  lastAt = 0
}

/** Tell the guide something just appeared on screen, so it can react. */
export function nudge(text: string, opts?: { force?: boolean }): void {
  if (!nudger) return
  const now = performance.now()
  if (!opts?.force && now - lastAt < MIN_GAP_MS) {
    trace('note', 'nudge_skipped', text.slice(0, 80))
    return
  }
  lastAt = now
  trace('note', 'nudge', text.slice(0, 120))
  nudger(text)
}
