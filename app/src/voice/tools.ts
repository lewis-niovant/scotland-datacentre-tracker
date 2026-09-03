import { tool } from '@openai/agents-realtime'
import { z } from 'zod'
import type { Dataset } from '../lib/data'
import {
  developersOf, fmtInt, fmtMWRange, fmtRangeMW, headlineCapacityMW,
  projectCoords, publishedObjections, statusGroup, statusLabel, sumHeadlineCapacity,
} from '../lib/data'
import { lensById } from '../lib/lenses'
import type { LensId, ProjectRecord, StatusGroup } from '../types'
import { hasObjectionStory } from '../lib/communityStories'
import { dashboard, noteAgentAction } from './commandBus'
import { clearStage, presentCards, type ArtifactKind, type StageCard } from './stage'
import { clearFx, drawOnMap, revealSite, spotlight, type DrawSpec } from './mapFx'
import { METRICS, flagshipSite, runQuery, type GroupId, type MetricId, type QueryFilter } from './queryEngine'
import { tracedExecute } from './trace'
import { ARTIFACT_FORMATS, beginArtifact } from './sidecar'

/* Three tiers of data access, deliberately separated by latency:

   0. The roster in the system prompt — free, instant, covers most questions.
   1. query_data — a local deterministic query engine (queryEngine.ts). Sub-
      millisecond, exact, renders itself as a table or chart. This is what
      makes ad-hoc "group X by Y" feel conversational.
   2. The sidecar text model — a few seconds, for genuine synthesis. Either
      returned whole (ai_brief, research) or streamed into an artifact that
      builds itself on screen (build_artifact).

   Tools are wrapped in tracedExecute so every call, argument and duration is
   recorded for debugging a conversation after the fact. */

const LENS_IDS = ['overview', 'electricity', 'water', 'economics', 'planning', 'credibility'] as const
const GROUP_IDS = ['operating', 'consented', 'pending', 'pre_app', 'refused', 'speculative'] as const
const METRIC_IDS = ['count', 'capacity', 'energy', 'water', 'investment', 'jobs', 'objections'] as const
const GROUP_BY_IDS = ['site', 'status', 'status_group', 'authority', 'developer', 'maturity'] as const

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function resolveSite(ds: Dataset, query: string): { hit?: ProjectRecord; candidates: ProjectRecord[] } {
  const q = norm(query)
  const scored = ds.observatory.projects.map((p) => {
    const names = [
      p.project.slug.replace(/-/g, ' '), p.project.canonical_name, p.project.display_name ?? '',
      ...(p.project.aliases ?? []).map((a) => a.alias), p.site?.settlement ?? '',
    ].map(norm).filter(Boolean)
    let score = 0
    for (const n of names) {
      if (n === q) score = Math.max(score, 100)
      else if (n.includes(q) || q.includes(n)) score = Math.max(score, 60)
      else {
        const words = q.split(' ').filter((w) => w.length > 2)
        const hit = words.filter((w) => n.includes(w)).length
        if (words.length && hit) score = Math.max(score, (hit / words.length) * 50)
      }
    }
    return { p, score }
  }).filter((s) => s.score >= 25).sort((a, b) => b.score - a.score)
  if (!scored.length) return { candidates: [] }
  const top = scored[0]
  const clear = top.score >= 60 && (scored.length === 1 || scored[1].score < top.score - 15)
  return { hit: clear ? top.p : undefined, candidates: scored.slice(0, 5).map((s) => s.p) }
}

function siteLine(p: ProjectRecord): string {
  const cap = headlineCapacityMW(p)
  return `${p.project.display_name ?? p.project.canonical_name} [${p.project.slug}] — ${statusLabel(p.project.status)}, ${p.project.local_authority}${cap ? `, ${fmtRangeMW(cap.claim)} claimed` : ''}`
}

export { flagshipSite }

export function buildTools(ds: Dataset) {
  const all = ds.observatory.projects
  const bySlug = new Map(all.map((p) => [p.project.slug, p]))

  const resolve = (query: string): { p?: ProjectRecord; error?: string } => {
    const direct = bySlug.get(query)
    if (direct) return { p: direct }
    const { hit, candidates } = resolveSite(ds, query)
    if (hit) return { p: hit }
    return {
      error: candidates.length
        ? `Ambiguous — did you mean:\n${candidates.map(siteLine).join('\n')}`
        : `No site matched "${query}".`,
    }
  }

  /* ---------- tier 0/1: instant ---------- */

  const whatAmILookingAt = tool({
    name: 'what_am_i_looking_at',
    description: 'The current state of the screen: lens, filters, selected site, layers, zoom, how many sites are visible.',
    parameters: z.object({}),
    execute: tracedExecute('what_am_i_looking_at', async () => {
      const s = dashboard().getState()
      return JSON.stringify({
        lens: s.lens, filters: s.filters, selected_site: s.selectedSlug, close_up_on: s.focusSlug,
        satellite: s.satellite, three_d: s.threeD, pitch_grid: s.showPitches,
        visible_sites: s.visibleSlugs.length, total_sites: all.length,
        zoom: s.camera ? Math.round(s.camera.zoom * 10) / 10 : null,
      })
    }),
  })

  const findSites = tool({
    name: 'find_sites',
    description: 'Look up sites by name, place, developer or council. Instant.',
    parameters: z.object({ query: z.string() }),
    execute: tracedExecute('find_sites', async ({ query }: { query: string }) => {
      const q = norm(query)
      const byName = resolveSite(ds, query).candidates
      const byMeta = all.filter((p) =>
        norm(p.project.local_authority ?? '').includes(q) || developersOf(p).some((d) => norm(d).includes(q)))
      const seen = new Set<string>()
      const out = [...byName, ...byMeta].filter((p) => !seen.has(p.project.slug) && seen.add(p.project.slug)).slice(0, 8)
      return out.length ? out.map(siteLine).join('\n') : `Nothing matched "${query}".`
    }),
  })

  const siteDetails = tool({
    name: 'site_details',
    description: 'The full record for one site, for YOUR knowledge — nothing appears on screen. Instant.',
    parameters: z.object({ site: z.string() }),
    execute: tracedExecute('site_details', async ({ site }: { site: string }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      return JSON.stringify({
        name: p.project.display_name ?? p.project.canonical_name, slug: p.project.slug,
        summary: p.project.summary, status: statusLabel(p.project.status),
        maturity: p.project.maturity_level, verification: p.project.verification_level ?? 'unverified',
        authority: p.project.local_authority, settlement: p.site?.settlement ?? null,
        developers: developersOf(p),
        height_m: p.site?.max_building_height_m?.value ?? null,
        claimed_capacity: (() => {
          const capacity = headlineCapacityMW(p)
          return capacity ? {
            minimum_mw: capacity.minimumMw,
            maximum_mw: capacity.maximumMw,
            display: fmtRangeMW(capacity.claim),
          } : null
        })(),
        objections: publishedObjections(p),
        concerns: (p.community?.principal_concerns ?? []).map((c) => c.concern),
        planning: (p.planning_cases ?? []).map((c) => `${c.reference ?? 'no ref'}: ${c.decision ?? 'undecided'}`),
        latest: p.project.latest_development?.headline ?? null,
        unknowns: p.project.unknowns ?? [],
      })
    }),
  })

  const queryData = tool({
    name: 'query_data',
    description: 'THE WORKHORSE — instant, exact analysis over the whole dataset, drawn on screen as a chart or table. Pick a metric, group it by something, optionally filter, and it renders immediately. Use this for any "how many / which / biggest / by council / by developer" question rather than guessing or using slower tools.',
    parameters: z.object({
      metric: z.enum(METRIC_IDS).describe('What to measure. "count" counts projects.'),
      group_by: z.enum(GROUP_BY_IDS).describe('What to break it down by. "site" = individual projects.'),
      show_as: z.enum(['chart', 'table', 'nothing']).describe('chart = animated bars, table = rows, nothing = just tell me'),
      limit: z.number().int().min(2).max(12).nullable(),
      filter_status_groups: z.array(z.enum(GROUP_IDS)).nullable(),
      filter_developer: z.string().nullable(),
      filter_authority: z.string().nullable(),
      title: z.string().nullable().describe('Short on-screen title, e.g. "Biggest sites by claimed capacity"'),
    }),
    execute: tracedExecute('query_data', async (a: {
      metric: MetricId; group_by: GroupId; show_as: 'chart' | 'table' | 'nothing'
      limit: number | null; filter_status_groups: StatusGroup[] | null
      filter_developer: string | null; filter_authority: string | null; title: string | null
    }) => {
      const filter: QueryFilter = {
        status_groups: a.filter_status_groups,
        developer: a.filter_developer ? matchName(all.flatMap(developersOf), a.filter_developer) : null,
        authority: a.filter_authority
          ? matchName(all.map((p) => p.project.local_authority).filter(Boolean), a.filter_authority) : null,
      }
      const res = runQuery(ds, { metric: a.metric, groupBy: a.group_by, filter, limit: a.limit ?? 6 })
      if (!res.rows.length) return `Nothing matched. ${res.note}`
      const title = a.title ?? `${METRICS[a.metric].label} by ${res.groupLabel}`
      const source = `${res.withFigure} of ${res.scanned} projects · observatory data`
      if (a.show_as === 'chart') {
        const max = Math.max(...res.rows.map((r) => r.value), 1)
        presentCards([{
          kind: 'bars', title,
          rows: res.rows.map((r) => ({ label: r.label, frac: r.value / max, display: r.display })),
          source,
        }], { replace: true })
      } else if (a.show_as === 'table') {
        /* A per-site breakdown has one site per row, so a count column of 1s
           is noise; it only earns its place when rows aggregate. */
        const perSite = a.group_by === 'site'
        presentCards([{
          kind: 'table', title,
          columns: perSite ? [res.groupLabel, METRICS[a.metric].label] : [res.groupLabel, METRICS[a.metric].label, 'sites'],
          rows: res.rows.map((r) => (perSite ? [r.label, r.display] : [r.label, r.display, String(r.n)])),
          source,
        }], { replace: true })
      }
      noteAgentAction('query_data')
      return `${a.show_as === 'nothing' ? 'Result' : 'On screen'}: ${res.rows.map((r) => `${r.label} ${r.display}`).join('; ')}. Total ${res.totalDisplay}. ${res.note}\nDO NOT READ THIS LIST OUT — it is already on screen. Say ONE sentence naming only the leader and what is interesting about the shape of it.`
    }),
  })

  /* ---------- tier 2: sidecar model ---------- */

  const buildArtifact = tool({
    name: 'build_artifact',
    description: 'Create a little document on screen that writes itself live: a bullet list, a comparison table, a step-by-step flow, or a timeline. It appears instantly as a skeleton and fills in as it is written, so CALL IT AND KEEP TALKING — describe what is appearing rather than waiting in silence.',
    parameters: z.object({
      kind: z.enum(['bullets', 'table', 'flow', 'timeline']),
      title: z.string().describe('Short on-screen heading'),
      brief: z.string().describe('What it should contain, in your own words. Be specific.'),
      about_site: z.string().nullable().describe('Site slug to attach the full record as context, if relevant'),
    }),
    execute: tracedExecute('build_artifact', async (a: {
      kind: ArtifactKind; title: string; brief: string; about_site: string | null
    }) => {
      let context = ''
      if (a.about_site) {
        const { p } = resolve(a.about_site)
        if (p) context = `\n\nFull record for this site:\n${JSON.stringify({
          project: p.project, site: p.site, capacity_claims: p.capacity_claims,
          economic_claims: p.economic_claims, planning_cases: p.planning_cases,
          community: p.community, grid: p.grid,
        })}`
      }
      if (!context) {
        context = `\n\nRoster (slug|status|authority|claimedMW|developer|objections):\n${all.map((p) => {
          const cap = headlineCapacityMW(p)
          return `${p.project.slug}|${statusLabel(p.project.status)}|${p.project.local_authority}|${cap ? fmtRangeMW(cap.claim) : '?'}|${developersOf(p)[0] ?? '?'}|${publishedObjections(p) ?? '-'}`
        }).join('\n')}`
      }
      const system = `You write compact on-screen artifacts for a public-interest Scottish data centre observatory. ${ARTIFACT_FORMATS[a.kind]} Plain text only — no markdown, no preamble, no trailing commentary. Use only facts present in the supplied data; mark developer figures as claims. Be concrete and specific.`
      beginArtifact(a.kind, a.title, system, `${a.brief}${context}`)
      return `The ${a.kind} "${a.title}" is building on screen now. Keep talking — say what it is showing as it fills in, then add one insight of your own.`
    }),
  })

  const aiBrief = tool({
    name: 'ai_brief',
    description: 'A fast model writes a 3-bullet brief about one site, streamed onto the screen. Angles: overview, community, planning, money.',
    parameters: z.object({
      site: z.string(),
      angle: z.enum(['overview', 'community', 'planning', 'money']),
    }),
    execute: tracedExecute('ai_brief', async ({ site, angle }: { site: string; angle: string }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      const name = p.project.display_name ?? p.project.canonical_name
      const record = JSON.stringify({
        project: p.project, site: p.site, capacity_claims: p.capacity_claims,
        economic_claims: p.economic_claims, planning_cases: p.planning_cases, community: p.community,
      })
      beginArtifact(
        'bullets', `${name} — ${angle}`,
        'You write on-screen briefs for a public-interest data centre observatory. Exactly 3 lines, each one bullet under 14 words, plain text, no dashes or markdown. Mark developer figures as claims. Never invent anything absent from the record.',
        `Angle: ${angle}. Record:\n${record}`,
        'written live from the site record',
      )
      return `Brief on ${name} is writing itself on screen. Keep talking while it lands, then add ONE sentence of your own.`
    }),
  })

  const research = tool({
    name: 'research',
    description: 'Ask a fast model a freeform question across the whole roster when query_data cannot express it (patterns, judgement, "is there anything about…"). The answer writes itself on screen over a few seconds — so KEEP TALKING after calling it; say what you are checking and what you already know.',
    parameters: z.object({ question: z.string() }),
    execute: tracedExecute('research', async ({ question }: { question: string }) => {
      const roster = all.map((p) => {
        const cap = headlineCapacityMW(p)
        return `${p.project.slug}|${statusLabel(p.project.status)}|${p.project.local_authority}|${cap ? fmtRangeMW(cap.claim) : 'noMW'}|${p.project.maturity_level}|${developersOf(p)[0] ?? 'no-dev'}|${publishedObjections(p) ?? '-'}obj`
      }).join('\n')
      /* Returns at once and fills in on screen: a tool that blocks for four
         seconds leaves the guide standing there in silence, which is the one
         thing that breaks the illusion of a conversation. */
      beginArtifact(
        'bullets', 'Looking it up',
        'Answer using ONLY the roster provided (slug|status|authority|claimedMW|maturity|developer|objections). Output 2-4 lines, each one short finding under 16 words, plain text, no dashes or markdown. If the roster cannot answer, say plainly what is missing from it. MW figures are largely developer claims.',
        `${question}\n\nRoster:\n${roster}`,
        'fast model over the full roster',
      )
      return `Checking now — the answer is writing itself on screen. KEEP TALKING while it lands: say what you are looking for and anything you already know from the roster. Then read the finding and put it in your own words.`
    }),
  })

  /* ---------- the map ---------- */

  const flyToSite = tool({
    name: 'fly_to_site',
    description: 'Fly the camera to a site and open its close-up. Takes about eight seconds; its card appears automatically. ALWAYS say where you are taking them before calling this.',
    parameters: z.object({ site: z.string() }),
    execute: tracedExecute('fly_to_site', async ({ site }: { site: string }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      dashboard().flyToSite(p.project.slug)
      presentCards([{ kind: 'site', slug: p.project.slug, source: 'observatory record' }], { ttlMs: 40000 })
      return `Flying to ${siteLine(p)} (~8s). Its card is on screen — don't recite those figures. Say something about the place while you travel.`
    }),
  })

  const showScotland = tool({
    name: 'show_all_of_scotland',
    description: 'Pull the camera back out to the whole country.',
    parameters: z.object({}),
    execute: tracedExecute('show_all_of_scotland', async () => {
      dashboard().showScotland()
      return 'Zooming out to the national view.'
    }),
  })

  const pointAtSite = tool({
    name: 'point_at_site',
    description: 'Dim the map and put a pulsing ring on one site — a pointing finger for "this one, here". Great before flying, or from the national view.',
    parameters: z.object({ site: z.string(), label: z.string().nullable() }),
    execute: tracedExecute('point_at_site', async ({ site, label }: { site: string; label: string | null }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      const map = dashboard().getMap()
      const coords = projectCoords(p)
      if (!map || !coords) return 'The map is not ready.'
      const token = spotlight(map, coords, label ?? (p.project.display_name ?? p.project.canonical_name))
      window.setTimeout(() => clearFx(token), 15000)
      return `Ring is on ${p.project.slug}.`
    }),
  })

  const sizeItUp = tool({
    name: 'show_how_big_it_is',
    description: 'The big set piece for ONE site: the map dims and spotlights it, the planning boundary pulses, football pitches tile the site to show its area, then the whole site rises to its real published height next to the surrounding houses while the camera drifts around it. Takes about thirty seconds. Offer it in plain words ("want to see how big that actually is?") — never name this tool.',
    parameters: z.object({ site: z.string() }),
    execute: tracedExecute('show_how_big_it_is', async ({ site }: { site: string }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      const d = dashboard()
      const map = d.getMap()
      if (!map) return 'The map is not ready.'
      const slug = p.project.slug
      const st = d.getState()
      let delayMs = 0
      if (st.focusSlug !== slug || (st.camera?.zoom ?? 0) < 12.5) {
        d.flyToSite(slug)
        delayMs = 9000
      }
      const plan = revealSite(map, ds, slug, { setPitches: (on) => d.setLayer('pitches', on), delayMs })
      if ('error' in plan) return plan.error
      return delayMs ? `Flying in first (~9s), then: ${plan.script}` : plan.script
    }),
  })

  const showObjections = tool({
    name: 'show_community_objections',
    description: 'Fly to a site and open the community objections on the map. Returns EVERY concern in full, numbered, with who raised it and what the developer said back — so you can then go through them one at a time.',
    parameters: z.object({ site: z.string() }),
    execute: tracedExecute('show_community_objections', async ({ site }: { site: string }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      const name = p.project.display_name ?? p.project.canonical_name
      if (!hasObjectionStory(p)) {
        return `${name} has no recorded community story. Sites that do: ${all.filter(hasObjectionStory).map((x) => x.project.slug).join(', ')}`
      }
      const d = dashboard()
      d.flyToSite(p.project.slug)
      d.openObjections(p.project.slug)
      const concerns = p.community?.principal_concerns ?? []
      presentCards([{
        kind: 'note', icon: '📣',
        title: `What ${p.site?.settlement ?? 'the community'} raised`,
        points: concerns.slice(0, 4).map((c, i) => `${i + 1}. ${c.concern}`),
        source: 'objections recorded in the planning file',
      }], { ttlMs: 45000 })
      const detail = concerns.map((c, i) =>
        `${i + 1}. ${c.concern}${c.raised_by ? ` — raised by ${c.raised_by}` : ''}${c.developer_response ? ` — developer's answer: ${c.developer_response}` : ' — no developer response on record'}`
      ).join('\n')
      const objCount = publishedObjections(p)
      return `Objections open for ${name}${objCount != null ? ` (${objCount}+ published)` : ''}. THE FULL DETAIL — use it, do not stop at naming the themes:\n${detail}\n\nNow: say which concern bites hardest and WHY in one or two sentences, then offer to go through the rest one by one. Use explain_objection to take any single one properly.`
    }),
  })

  const explainObjection = tool({
    name: 'explain_objection',
    description: 'Take ONE numbered concern at a site and put it on screen in full — what was raised, by whom, and the developer\'s answer. Use this to go deeper after showing objections.',
    parameters: z.object({
      site: z.string(),
      number: z.number().int().min(1).describe('Which concern, 1-based, as numbered by show_community_objections'),
    }),
    execute: tracedExecute('explain_objection', async ({ site, number }: { site: string; number: number }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      const concerns = p.community?.principal_concerns ?? []
      const c = concerns[number - 1]
      if (!c) return `${p.project.display_name ?? p.project.canonical_name} has ${concerns.length} recorded concerns; there is no number ${number}.`
      const points = [c.concern]
      if (c.raised_by) points.push(`Raised by: ${c.raised_by}`)
      points.push(c.developer_response ? `Developer's answer: ${c.developer_response}` : 'The developer has not answered this on the record.')
      presentCards([{
        kind: 'note', icon: '⚖️',
        title: `Objection ${number} of ${concerns.length}`,
        points,
        source: 'from the planning file',
      }], { ttlMs: 40000, replace: true })
      return `On screen. Talk through it in your own words — what they are worried about and whether the developer really answered it. ${number < concerns.length ? `There ${concerns.length - number === 1 ? 'is 1 more' : `are ${concerns.length - number} more`} after this.` : 'That was the last one.'}`
    }),
  })

  const nationalComparison = tool({
    name: 'compare_to_scotland',
    description: 'THE context question — what all this claimed capacity would actually mean for Scotland: how it compares with the country\'s own electricity generation, the grid connection queue, and homes. Use whenever anyone asks how big this is "really", or compares it to the country. Instant.',
    parameters: z.object({
      scope: z.enum(['all', 'visible']).describe('All tracked projects, or only those currently shown'),
    }),
    execute: tracedExecute('compare_to_scotland', async ({ scope }: { scope: 'all' | 'visible' }) => {
      const ps = scope === 'visible'
        ? (() => { const v = new Set(dashboard().getState().visibleSlugs); return all.filter((p) => v.has(p.project.slug)) })()
        : all
      const capacity = sumHeadlineCapacity(ps)
      const n = capacity.projects
      const nat = ds.observatory.constants?.national_context ?? {}
      const comp = ds.observatory.constants?.comparisons ?? {}
      const scotTwh = nat.scotland_electricity_generated_2024_twh?.value
      const queueGw = nat.gb_demand_connection_queue_gw?.value
      const homeKwh = comp.household_annual_electricity_kwh?.value ?? 3400
      /* Data centres run near flat out; 85% is the conventional planning
         assumption and is stated as an assumption, not a measurement. */
      const LOAD = 0.85
      const twhMinimum = (capacity.minimumMw * LOAD * 8760) / 1e6
      const twhMaximum = (capacity.maximumMw * LOAD * 8760) / 1e6
      const homesMinimum = Math.round((capacity.minimumMw * LOAD * 8760 * 1000) / homeKwh)
      const homesMaximum = Math.round((capacity.maximumMw * LOAD * 8760 * 1000) / homeKwh)
      const decimalRange = (minimum: number, maximum: number, suffix: string) => minimum === maximum
        ? `${minimum.toFixed(1)}${suffix}`
        : `${minimum.toFixed(1)}–${maximum.toFixed(1)}${suffix}`
      const cards: StageCard[] = [{
        kind: 'stat', icon: '⚡', value: decimalRange(twhMinimum, twhMaximum, ' TWh/yr'),
        label: 'if every claimed megawatt were built and ran flat out',
        note: 'assumes 85% utilisation — an assumption, not a measurement',
        source: `${n} of ${ps.length} projects with a capacity figure`,
      }]
      if (scotTwh) {
        cards.push({
          kind: 'stat', icon: '🏴', value: decimalRange((twhMinimum / scotTwh) * 100, (twhMaximum / scotTwh) * 100, '%'),
          label: `of all the electricity Scotland generated in 2024 (${scotTwh} TWh)`,
          source: 'observatory national context',
        })
      }
      cards.push({
        kind: 'stat', icon: '🏠', value: decimalRange(homesMinimum / 1e6, homesMaximum / 1e6, 'm homes'),
        label: 'the same annual electricity as this many households',
        source: `${fmtInt(homeKwh)} kWh per home per year`,
      })
      presentCards(cards, { replace: true })
      return `On screen. Total claimed ${fmtMWRange(capacity.minimumMw, capacity.maximumMw)} across ${n} projects → about ${decimalRange(twhMinimum, twhMaximum, ' TWh')} a year at 85% utilisation${scotTwh ? `, or roughly ${decimalRange((twhMinimum / scotTwh) * 100, (twhMaximum / scotTwh) * 100, '%')} of Scotland's entire 2024 generation of ${scotTwh} TWh` : ''}${queueGw ? `. For context the GB grid connection queue stands at about ${queueGw} GW` : ''}. Say the comparison in ONE or TWO plain sentences and be honest that these are mostly claims that will not all get built.`
    }),
  })

  const drawOnMapTool = tool({
    name: 'draw_on_map',
    description: 'Draw your own annotations over the map: curved links joining sites, and circles marking areas. CALL THIS WHENEVER anyone says "show me on the map", or whenever you are describing a pattern that involves more than one place — one company\'s sites, a cluster, a corridor, everything near a town. Drawing the relationship is far better than listing it.',
    parameters: z.object({
      connect: z.array(z.string()).nullable().describe('Two or more site names/slugs to join with arcs, in order'),
      ring_sites: z.array(z.string()).nullable().describe('Sites to enclose in one highlighted region'),
      circle_site: z.string().nullable().describe('Draw a radius circle around this site'),
      radius_km: z.number().nullable().describe('Radius in km for circle_site (default 10)'),
      caption: z.string().describe('One short line saying what the drawing shows'),
    }),
    execute: tracedExecute('draw_on_map', async (a: {
      connect: string[] | null; ring_sites: string[] | null
      circle_site: string | null; radius_km: number | null; caption: string
    }) => {
      const d = dashboard()
      const map = d.getMap()
      if (!map) return 'The map is not ready.'
      /* Drawing reframes the camera; a flight still in the air would land on
         top of that and undo it. */
      d.cancelFlight()
      const coordsFor = (q: string): [number, number] | null => {
        const { p } = resolve(q)
        return p ? projectCoords(p) : null
      }
      const spec: DrawSpec = {}
      const named: string[] = []
      if (a.connect && a.connect.length >= 2) {
        const pts = a.connect.map((s) => ({ s, c: coordsFor(s) })).filter((x) => x.c)
        if (pts.length < 2) return 'Could not place at least two of those sites.'
        spec.links = pts.slice(0, -1).map((p, i) => ({ from: p.c!, to: pts[i + 1].c! }))
        named.push(...pts.map((p) => p.s))
      }
      if (a.ring_sites && a.ring_sites.length) {
        const pts = a.ring_sites.map(coordsFor).filter((c): c is [number, number] => !!c)
        if (pts.length) spec.hull = pts
      }
      if (a.circle_site) {
        const c = coordsFor(a.circle_site)
        if (c) spec.areas = [{ centre: c, radiusKm: a.radius_km ?? 10 }]
      }
      const n = drawOnMap(map, spec)
      if (!n) return 'Nothing to draw — check the site names.'
      presentCards([{ kind: 'note', icon: '✏️', title: 'On the map', points: [a.caption], source: 'drawn by the guide' }], { ttlMs: 30000 })
      return `Drawn: ${n} shape${n === 1 ? '' : 's'}${named.length ? ` linking ${named.join(' → ')}` : ''}. Say what the connection means — that is the whole point of drawing it.`
    }),
  })

  const setLens = tool({
    name: 'set_lens',
    description: 'Recolour the whole map by a theme: overview (status), electricity, water, economics, planning, credibility. Headline figures for that theme appear automatically.',
    parameters: z.object({ lens: z.enum(LENS_IDS) }),
    execute: tracedExecute('set_lens', async ({ lens }: { lens: LensId }) => {
      dashboard().setLens(lens)
      const tiles = lensById(lens).stats(all)
      presentCards(tiles.slice(0, 3).map((t) => ({
        kind: 'stat' as const, value: t.value, label: t.label, source: `${lens} lens · all sites`,
      })), { replace: true })
      return `Map recoloured by ${lens}. On screen: ${tiles.map((t) => `${t.value} (${t.label})`).join('; ')}. Summarise, don't recite.`
    }),
  })

  const setFilters = tool({
    name: 'set_filters',
    description: 'Show only some sites on the map, by status, developer or council. Pass null to leave a dimension alone, or clear_all to reset.',
    parameters: z.object({
      status_groups: z.array(z.enum(GROUP_IDS)).nullable(),
      developer: z.string().nullable(),
      authority: z.string().nullable(),
      clear_all: z.boolean().nullable(),
    }),
    execute: tracedExecute('set_filters', async (a: {
      status_groups: StatusGroup[] | null; developer: string | null
      authority: string | null; clear_all: boolean | null
    }) => {
      if (a.clear_all) {
        dashboard().clearFilters()
        noteAgentAction('set_filters')
        return `Filters cleared — all ${all.length} sites showing.`
      }
      const next: { groups?: StatusGroup[]; developer?: string; authority?: string } = {}
      if (a.status_groups) next.groups = a.status_groups
      if (a.developer != null) {
        const m = a.developer === '' ? '' : matchName(all.flatMap(developersOf), a.developer)
        if (m == null) return `No developer matching "${a.developer}".`
        next.developer = m
      }
      if (a.authority != null) {
        const m = a.authority === '' ? '' : matchName(all.map((p) => p.project.local_authority).filter(Boolean), a.authority)
        if (m == null) return `No council matching "${a.authority}".`
        next.authority = m
      }
      dashboard().setFilters(next)
      noteAgentAction('set_filters')
      const shown = all.filter((p) =>
        (!next.groups?.length || next.groups.includes(statusGroup(p.project.status)))
        && (!next.developer || developersOf(p).includes(next.developer))
        && (!next.authority || p.project.local_authority === next.authority)).length
      return `Filtered — about ${shown} sites showing.`
    }),
  })

  const setLayers = tool({
    name: 'set_layers',
    description: 'Toggle satellite imagery, 3D building masses, or the football-pitch scale grid. Null leaves a layer alone.',
    parameters: z.object({
      satellite: z.boolean().nullable(), three_d: z.boolean().nullable(), pitch_grid: z.boolean().nullable(),
    }),
    execute: tracedExecute('set_layers', async (a: {
      satellite: boolean | null; three_d: boolean | null; pitch_grid: boolean | null
    }) => {
      const d = dashboard()
      const acts: string[] = []
      if (a.satellite != null) { d.setLayer('satellite', a.satellite); acts.push(`satellite ${a.satellite ? 'on' : 'off'}`) }
      if (a.three_d != null) { d.setLayer('threeD', a.three_d); acts.push(`3D ${a.three_d ? 'on' : 'off'}`) }
      if (a.pitch_grid != null) { d.setLayer('pitches', a.pitch_grid); acts.push(`pitch grid ${a.pitch_grid ? 'on' : 'off'}`) }
      return acts.length ? `Done: ${acts.join(', ')}.` : 'No change requested.'
    }),
  })

  const playTourBeat = tool({
    name: 'play_tour_beat',
    description: 'Play one stop of the built-in tour: the map flies there and sets the scene, and YOU narrate it. Start at 0 and go one at a time, checking they want more between stops.',
    parameters: z.object({ beat: z.number().int().min(0) }),
    execute: tracedExecute('play_tour_beat', async ({ beat }: { beat: number }) => {
      const r = dashboard().runTourBeat(beat)
      if (!r) return 'No such stop — you have reached the end. Wrap up and invite questions.'
      return `Stop ${r.index + 1} of ${r.total} — "${r.kicker}: ${r.title}". Notes to retell in YOUR OWN words, one or two sentences: ${r.body}${r.index + 1 < r.total ? ` Next is stop ${r.index + 1}.` : ' That was the last stop.'}`
    }),
  })

  const clearScreen = tool({
    name: 'clear_screen',
    description: 'Take all the cards off the screen for a clean map. Use when changing subject.',
    parameters: z.object({}),
    execute: tracedExecute('clear_screen', async () => { clearStage(); return 'Screen cleared.' }),
  })

  const openProfile = tool({
    name: 'open_full_profile',
    description: 'Leave the map and open a site\'s written profile page with every claim and source. Only when they want the full written record.',
    parameters: z.object({ site: z.string() }),
    execute: tracedExecute('open_full_profile', async ({ site }: { site: string }) => {
      const { p, error } = resolve(site)
      if (!p) return error!
      dashboard().openProfile(p.project.slug)
      return `Opened the profile for ${p.project.display_name ?? p.project.canonical_name}. Say "back to the map" to return.`
    }),
  })

  return [
    whatAmILookingAt, findSites, siteDetails, queryData,
    buildArtifact, aiBrief, research,
    flyToSite, showScotland, pointAtSite, sizeItUp,
    showObjections, explainObjection, drawOnMapTool, nationalComparison,
    setLens, setFilters, setLayers, playTourBeat, clearScreen, openProfile,
  ]
}

function matchName(pool: string[], q: string): string | null {
  const names = [...new Set(pool)]
  return names.find((n) => norm(n) === norm(q)) ?? names.find((n) => norm(n).includes(norm(q))) ?? null
}
