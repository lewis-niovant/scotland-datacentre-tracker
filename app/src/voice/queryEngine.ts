import type { Dataset } from '../lib/data'
import {
  developersOf, fmtGBP, fmtInt, fmtMW, fmtMWRange, headlineCapacityMW, headlineCapexGBP,
  headlineEnergyGWh, headlineWaterM3, operationalJobsClaim, publishedObjections,
  statusGroup, statusLabel,
} from '../lib/data'
import { boundaryFeatures } from '../lib/geometry'
import type { ProjectRecord, StatusGroup } from '../types'

/* Tier 1 of the data path: a deterministic, instant query engine over the
   loaded dataset. No LLM, no network — the voice agent describes what it
   wants and gets exact rows back in under a millisecond, which is what makes
   ad-hoc "group these by that" questions feel immediate in conversation.
   The slower sidecar model is only for genuinely unstructured synthesis. */

export const METRICS = {
  count: { label: 'projects', of: () => 1, fmt: (v: number) => fmtInt(v) },
  capacity: { label: 'claimed capacity', of: (p: ProjectRecord) => headlineCapacityMW(p)?.mw ?? null, fmt: fmtMW },
  energy: { label: 'claimed energy per year', of: headlineEnergyGWh, fmt: (v: number) => `${fmtInt(v)} GWh` },
  water: { label: 'claimed water per year', of: headlineWaterM3, fmt: (v: number) => `${fmtInt(v)} m³` },
  investment: { label: 'claimed investment', of: headlineCapexGBP, fmt: fmtGBP },
  jobs: { label: 'claimed operational jobs', of: operationalJobsClaim, fmt: fmtInt },
  objections: { label: 'published objections', of: publishedObjections, fmt: (v: number) => `${fmtInt(v)}+` },
} as const

export type MetricId = keyof typeof METRICS
export type GroupId = 'site' | 'status' | 'status_group' | 'authority' | 'developer' | 'maturity'

export interface QueryFilter {
  status_groups?: StatusGroup[] | null
  developer?: string | null
  authority?: string | null
  has_height?: boolean | null
  min_capacity_mw?: number | null
}

export interface QuerySpec {
  metric: MetricId
  groupBy: GroupId
  filter?: QueryFilter
  sort?: 'value_desc' | 'value_asc' | 'label'
  limit?: number
}

export interface QueryRow { label: string; value: number; display: string; n: number }
export interface QueryResult {
  rows: QueryRow[]
  total: number
  totalDisplay: string
  scanned: number
  withFigure: number
  metricLabel: string
  groupLabel: string
  note: string
}

/* Companies appear under several legal names across sources ("Apatura",
   "Apatura Ltd", "Apatura Energy"), which split one developer into three
   bars and made charts read as wrong. Group on a trimmed trading name and
   display the shortest variant seen. */
const CORP_SUFFIX = /\b(ltd|limited|plc|llp|inc|incorporated|group|holdings|energy|power|uk|scotland|company|co)\b/g

function developerKey(name: string): string {
  const k = name.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(CORP_SUFFIX, ' ')
    .replace(/\s+/g, ' ').trim()
  return k || name.toLowerCase().trim()
}

function keysFor(p: ProjectRecord, groupBy: GroupId): string[] {
  switch (groupBy) {
    case 'site': return [p.project.display_name ?? p.project.canonical_name]
    case 'status': return [statusLabel(p.project.status)]
    case 'status_group': return [statusGroup(p.project.status)]
    case 'authority': return [p.project.local_authority || 'unknown authority']
    case 'maturity': return [p.project.maturity_level ?? 'M?']
    case 'developer': {
      const d = developersOf(p)
      return d.length ? [...new Set(d.map(developerKey))] : ['']
    }
  }
}

export function applyFilter(ds: Dataset, f?: QueryFilter): ProjectRecord[] {
  const all = ds.observatory.projects
  if (!f) return all
  return all.filter((p) => {
    if (f.status_groups?.length && !f.status_groups.includes(statusGroup(p.project.status))) return false
    if (f.developer && !developersOf(p).includes(f.developer)) return false
    if (f.authority && p.project.local_authority !== f.authority) return false
    if (f.has_height && typeof p.site?.max_building_height_m?.value !== 'number') return false
    if (f.min_capacity_mw != null && (headlineCapacityMW(p)?.mw ?? 0) < f.min_capacity_mw) return false
    return true
  })
}

export function runQuery(ds: Dataset, spec: QuerySpec): QueryResult {
  const def = METRICS[spec.metric]
  const scope = applyFilter(ds, spec.filter)
  const buckets = new Map<string, { value: number; minimumValue: number; n: number; display: string }>()
  let withFigure = 0
  let unattributed = 0

  for (const p of scope) {
    const v = def.of(p)
    if (v == null) continue
    const minimumValue = spec.metric === 'capacity'
      ? headlineCapacityMW(p)?.minimumMw ?? v
      : v
    withFigure++
    for (const k of keysFor(p, spec.groupBy)) {
      /* An unnamed bucket is a gap in the record, not a finding — count it
         for the caption rather than letting it top the chart. */
      if (k === '') { unattributed += 1; continue }
      const cur = buckets.get(k) ?? { value: 0, minimumValue: 0, n: 0, display: k }
      cur.value += v
      cur.minimumValue += minimumValue
      cur.n += 1
      /* Prefer the shortest real name seen for a grouped company. */
      if (spec.groupBy === 'developer') {
        for (const raw of developersOf(p)) {
          if (developerKey(raw) === k && (cur.display === k || raw.length < cur.display.length)) cur.display = raw
        }
      }
      buckets.set(k, cur)
    }
  }

  let rows: QueryRow[] = [...buckets].map(([, b]) => ({
    label: b.display,
    value: b.value,
    n: b.n,
    display: spec.metric === 'capacity' ? fmtMWRange(b.minimumValue, b.value) : def.fmt(b.value),
  }))
  const sort = spec.sort ?? 'value_desc'
  rows.sort((a, b) =>
    sort === 'label' ? a.label.localeCompare(b.label)
      : sort === 'value_asc' ? a.value - b.value
      : b.value - a.value)
  if (spec.limit) rows = rows.slice(0, spec.limit)

  const total = [...buckets.values()].reduce((t, b) => t + b.value, 0)
  const totalMinimum = [...buckets.values()].reduce((t, b) => t + b.minimumValue, 0)
  const groupLabel = spec.groupBy.replace('_', ' ')
  const missing = scope.length - withFigure
  return {
    rows,
    total,
    totalDisplay: spec.metric === 'capacity' ? fmtMWRange(totalMinimum, total) : def.fmt(total),
    scanned: scope.length,
    withFigure,
    metricLabel: def.label,
    groupLabel,
    note: [
      missing > 0
        ? `${missing} of ${scope.length} projects in scope publish no ${def.label} figure and are excluded.`
        : `All ${scope.length} projects in scope carry a figure.`,
      unattributed > 0 ? `${unattributed} more name no ${spec.groupBy}.` : '',
      spec.metric === 'capacity' ? 'Where a claim is a range, the bar length uses its upper end.' : '',
    ].filter(Boolean).join(' '),
  }
}

/** The site that best demonstrates the dashboard: published height, official
    red line, community record and a big claim. Used for the opening move, so
    a first-time user's demo lands on a site with something to show. */
export function flagshipSite(ds: Dataset): ProjectRecord | null {
  const withBoundary = new Set(boundaryFeatures(ds.geo).map((f) => f.properties.slug ?? ''))
  let best: { p: ProjectRecord; score: number; mw: number } | null = null
  for (const p of ds.observatory.projects) {
    const score =
      (typeof p.site?.max_building_height_m?.value === 'number' ? 4 : 0)
      + (withBoundary.has(p.project.slug) ? 3 : 0)
      + (publishedObjections(p) != null ? 2 : 0)
      + ((p.community?.principal_concerns?.length ?? 0) > 0 ? 1 : 0)
      + (p.project.verification_level === 'verified' ? 1 : 0)
    const mw = headlineCapacityMW(p)?.mw ?? 0
    if (!best || score > best.score || (score === best.score && mw > best.mw)) best = { p, score, mw }
  }
  return best?.p ?? null
}
