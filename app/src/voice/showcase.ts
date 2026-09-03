import type { Dataset } from '../lib/data'
import { developersOf, fmtRangeMW, headlineCapacityMW, publishedObjections, statusLabel } from '../lib/data'
import { dashboard } from './commandBus'
import { flagshipSite, runQuery } from './queryEngine'
import { presentCards } from './stage'
import { revealSite } from './mapFx'
import { ARTIFACT_FORMATS, beginArtifact } from './sidecar'
import { nudge } from './nudge'
import { trace } from './trace'

/* The opening walkthrough.

   A first-time visitor does not know what to ask, so the session does not
   begin by waiting for them. It runs a fixed six-beat route — the country,
   one site, its scale, an artifact, an analysis, then the handover — with the
   guide narrating each beat as it lands. It is deterministic on purpose: the
   first ninety seconds are the ones that teach someone what this is.

   Any beat can be abandoned the moment the visitor speaks; the whole point is
   that they take over. */

let cancelled = false
let timers: number[] = []

export function cancelShowcase(reason = 'user'): void {
  if (!timers.length) return
  trace('note', 'showcase_cancelled', reason)
  cancelled = true
  for (const t of timers) window.clearTimeout(t)
  timers = []
}

function at(ms: number, fn: () => void) {
  timers.push(window.setTimeout(() => { if (!cancelled) fn() }, ms))
}

export function startShowcase(ds: Dataset): void {
  cancelShowcase('restart')
  cancelled = false
  timers = []

  const flag = flagshipSite(ds)
  if (!flag) return
  const slug = flag.project.slug
  const name = flag.project.display_name ?? flag.project.canonical_name
  const objections = publishedObjections(flag)
  const developer = developersOf(flag)[0]
  const capacity = headlineCapacityMW(flag)
  trace('note', 'showcase_start', slug)

  /* Beat 2 — leave the country view and go to one real place. */
  at(1000, () => {
    nudge(`WALKTHROUGH BEAT 2 of 6. You are now flying to ${name} — ${statusLabel(flag.project.status)} in ${flag.project.local_authority}${developer ? `, by ${developer}` : ''}${capacity ? `, ${fmtRangeMW(capacity.claim)} claimed` : ''}. The flight is ALREADY under way — call nothing, do not fly there yourself. Just say ONE sentence about why this site is worth looking at while you travel.`, { force: true })
    try { dashboard().flyToSite(slug) } catch { cancelShowcase('no dashboard') }
    presentCards([{ kind: 'site', slug, source: 'observatory record' }], { ttlMs: 46000 })
  })

  /* Beat 3 — the visual explanation of scale, phase by phase. revealSite
     nudges the guide itself as each phase lands. */
  at(12000, () => {
    const map = dashboard().getMap()
    if (!map) return
    nudge(`WALKTHROUGH BEAT 3 of 6. The scale sequence is starting at ${name}: boundary, then football pitches, then the building height. It is ALREADY running — call nothing. Say ONE short line to set it up, then let each stage speak for itself; you will be prompted as each lands.`, { force: true })
    revealSite(map, ds, slug, { setPitches: (on) => dashboard().setLayer('pitches', on), delayMs: 900 })
  })

  /* Beat 4 — an artifact worth reading, written live. */
  at(30000, () => {
    const record = JSON.stringify({
      project: flag.project, site: flag.site, planning_cases: flag.planning_cases,
      community: flag.community, capacity_claims: flag.capacity_claims,
    })
    beginArtifact(
      'timeline', `${name} — how it got here`,
      `You write compact on-screen artifacts for a public-interest Scottish data centre observatory. ${ARTIFACT_FORMATS.timeline} Plain text only, no markdown or preamble. Use only what is in the record; mark developer figures as claims.`,
      `A timeline of this project's planning journey.\n\nRecord:\n${record}`,
    )
    nudge(`WALKTHROUGH BEAT 4 of 6. A timeline of ${name}'s planning journey is ALREADY writing itself on screen — do not create another one, and call nothing. Just keep talking while it fills in: say what the story of this site has been${objections != null ? `, including that it drew ${objections}+ published objections` : ''}. Do not read the timeline out.`, { force: true })
  })

  /* Beat 5 — zoom back out to the argument the whole dataset makes. */
  at(48000, () => {
    const res = runQuery(ds, { metric: 'capacity', groupBy: 'site', limit: 6 })
    const max = Math.max(...res.rows.map((r) => r.value), 1)
    presentCards([{
      kind: 'bars',
      title: 'Biggest by claimed capacity',
      rows: res.rows.map((r) => ({ label: r.label, frac: r.value / max, display: r.display })),
      source: `${res.withFigure} of ${res.scanned} projects · observatory data`,
    }], { replace: true })
    const nat = ds.observatory.constants?.national_context?.scotland_electricity_generated_2024_twh?.value
    nudge(`WALKTHROUGH BEAT 5 of 6. A chart of the biggest sites by claimed capacity is now on screen: ${res.rows.slice(0, 3).map((r) => `${r.label} ${r.display}`).join(', ')}. Give ONE or TWO sentences of analysis — how ${name} compares with the giants, and what it means that these are mostly claims rather than consented projects${nat ? `. For scale, Scotland generated about ${nat} TWh of electricity in 2024` : ''}. Do not read the chart out.`, { force: true })
  })

  /* Beat 6 — hand over. */
  at(64000, () => {
    nudge(`WALKTHROUGH BEAT 6 of 6 — the end. Hand over now: in ONE sentence offer two or three concrete directions they could take (for example the objections at a contested site, the water use, or who is behind these companies), then stop and wait. Do not call anything.`, { force: true })
    timers = []
  })
}
