import { createContext, useContext } from 'react'
import type {
  CapacityClaim, GeoCollection, Observatory, ProjectRecord, SourceEntry,
  Status, StatusGroup, UncertaintyState,
} from '../types'

/* ------------------------------------------------------------------ */
/* Loading                                                            */
/* ------------------------------------------------------------------ */

export interface Dataset {
  observatory: Observatory
  geo: GeoCollection
  geoLoadFailed: boolean
}

const EMPTY_OBSERVATORY: Observatory = { projects: [], sources: {} }
const EMPTY_GEO: GeoCollection = { type: 'FeatureCollection', features: [] }

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`)
  return (await res.json()) as T
}

export async function loadDataset(): Promise<Dataset> {
  const observatory = await fetchJson<Observatory>('data/observatory.json')
  if (!Array.isArray(observatory.projects) || observatory.projects.length === 0) {
    throw new Error('The Observatory project dataset is empty or malformed')
  }

  let geoLoadFailed = false
  let geo = EMPTY_GEO
  try {
    geo = await fetchJson<GeoCollection>('data/geo.json')
    if (geo?.type !== 'FeatureCollection' || !Array.isArray(geo.features)) {
      geoLoadFailed = true
      geo = EMPTY_GEO
    }
  } catch {
    geoLoadFailed = true
  }

  return {
    observatory: {
      ...EMPTY_OBSERVATORY,
      ...observatory,
      projects: (observatory.projects ?? []).filter((p) => p?.project?.is_public !== false),
    },
    geo,
    geoLoadFailed,
  }
}

export const DataContext = createContext<Dataset | null>(null)

export function useDataset(): Dataset {
  const ds = useContext(DataContext)
  if (!ds) throw new Error('useDataset outside provider')
  return ds
}

export function getSource(ds: Dataset, id: string): SourceEntry | undefined {
  return ds.observatory.sources?.[id]
}

/* ------------------------------------------------------------------ */
/* Status grouping                                                    */
/* ------------------------------------------------------------------ */

export const STATUS_GROUPS: StatusGroup[] = [
  'operating', 'consented', 'pending', 'pre_app', 'refused', 'speculative',
]

export function statusGroup(status?: Status | string): StatusGroup {
  switch (status) {
    case 'operating':
      return 'operating'
    case 'under_construction':
    case 'consented':
      return 'consented'
    case 'pending':
    case 'appealed':
      return 'pending'
    case 'pre_application':
    case 'screening':
    case 'scoping':
    case 'announced':
      return 'pre_app'
    case 'refused':
    case 'withdrawn':
    case 'lapsed':
    case 'superseded':
      return 'refused'
    default:
      return 'speculative' // strategic_opportunity, grid_record_only, paused, unknown
  }
}

/* Group colours: fixed assignment from the validated categorical/status
   palette; each marker is always paired with a text label in the legend
   and chips so colour never carries meaning alone. */
export const STATUS_GROUP_META: Record<StatusGroup, { label: string; short: string; color: string; colorDark: string }> = {
  operating:   { label: 'Operating',                 short: 'Operating',   color: '#008300', colorDark: '#008300' },
  consented:   { label: 'Consented / building',      short: 'Consented',   color: '#2a78d6', colorDark: '#3987e5' },
  pending:     { label: 'Application / appeal live', short: 'Live case',   color: '#eda100', colorDark: '#c98500' },
  pre_app:     { label: 'Pre-application / early',   short: 'Pre-app',     color: '#e87ba4', colorDark: '#d55181' },
  refused:     { label: 'Refused / withdrawn',       short: 'Refused',     color: '#4a3aa7', colorDark: '#9085e9' },
  speculative: { label: 'Speculative / grid only',   short: 'Speculative', color: '#898781', colorDark: '#898781' },
}

export const STATUS_LABELS: Record<string, string> = {
  operating: 'Operating',
  under_construction: 'Under construction',
  consented: 'Consented',
  pending: 'Application pending',
  pre_application: 'Pre-application',
  screening: 'EIA screening',
  scoping: 'EIA scoping',
  announced: 'Announced',
  strategic_opportunity: 'Strategic opportunity',
  grid_record_only: 'Grid record only',
  refused: 'Refused',
  appealed: 'At appeal',
  withdrawn: 'Withdrawn',
  lapsed: 'Lapsed',
  paused: 'Paused',
  superseded: 'Superseded',
  unknown: 'Status unknown',
}

export function statusLabel(status?: string): string {
  return (status && STATUS_LABELS[status]) || status || 'Unknown'
}

/* ------------------------------------------------------------------ */
/* Claim states / maturity / sources                                  */
/* ------------------------------------------------------------------ */

export const STATE_LABELS: Record<UncertaintyState, string> = {
  confirmed: 'confirmed',
  reported: 'reported',
  developer_stated: 'developer-stated',
  modelled: 'modelled',
  inferred: 'inferred',
  estimated: 'estimated',
  disputed: 'disputed',
  unknown: 'unknown',
  not_disclosed: 'not disclosed',
  superseded: 'superseded',
  awaiting_verification: 'awaiting verification',
}

export function stateLabel(state?: string): string {
  return (state && STATE_LABELS[state as UncertaintyState]) || state || 'unstated'
}

export const MATURITY_META: Record<string, { label: string; explanation: string }> = {
  M0: { label: 'M0 · Concept', explanation: 'Marketed concept only — no planning or land evidence located.' },
  M1: { label: 'M1 · Early development', explanation: 'Early development: PAN, EIA screening/scoping, land option or announcement, but no formal application.' },
  M2: { label: 'M2 · Formal application', explanation: 'A formal planning application has been validated and awaits determination.' },
  M3: { label: 'M3 · Consented', explanation: 'Planning consent granted and the project is materially progressing.' },
  M4: { label: 'M4 · Under construction', explanation: 'Construction under way on site.' },
  M5: { label: 'M5 · Operational', explanation: 'Facility built and operating.' },
}

export function maturityNumber(m?: string): number {
  const n = Number(m?.replace('M', ''))
  return Number.isFinite(n) ? n : 0
}

export const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 · official primary record',
  2: 'Tier 2 · official secondary / government',
  3: 'Tier 3 · corporate / developer',
  4: 'Tier 4 · credible journalism',
  5: 'Tier 5 · campaign / social / unverified',
}

/* ------------------------------------------------------------------ */
/* Derived metrics per project                                        */
/* ------------------------------------------------------------------ */

export function claimValueMW(c: CapacityClaim): number | null {
  if (typeof c.value_mw === 'number') return c.value_mw
  if (typeof c.minimum_mw === 'number') return c.minimum_mw
  if (typeof c.maximum_mw === 'number') return c.maximum_mw
  return null
}

function claimBoundsMW(c: CapacityClaim): { minimumMw: number; maximumMw: number } | null {
  if (typeof c.value_mw === 'number') return { minimumMw: c.value_mw, maximumMw: c.value_mw }
  if (typeof c.minimum_mw === 'number' && typeof c.maximum_mw === 'number') {
    return { minimumMw: c.minimum_mw, maximumMw: c.maximum_mw }
  }
  if (typeof c.minimum_mw === 'number') return { minimumMw: c.minimum_mw, maximumMw: c.minimum_mw }
  if (typeof c.maximum_mw === 'number') return { minimumMw: c.maximum_mw, maximumMw: c.maximum_mw }
  return null
}

export interface HeadlineCapacity {
  /** Upper end, retained for sorting and proportional marker size only. */
  mw: number
  minimumMw: number
  maximumMw: number
  claim: CapacityClaim
}

/** Headline capacity: the preferred non-superseded facility claim, else the
    largest facility-scale claim. Excludes onsite/backup generation claims. */
export function headlineCapacityMW(p: ProjectRecord): HeadlineCapacity | null {
  const allClaims = p.capacity_claims ?? []
  const excludedTypes = ['onsite_generation', 'backup_generation', 'battery_storage', 'connection_application', 'connection_offer']
  const explicitlyPreferred = allClaims.find((c) => c.preferred && c.state !== 'superseded')
  if (explicitlyPreferred) {
    if (excludedTypes.includes(explicitlyPreferred.capacity_type)) return null
    const bounds = claimBoundsMW(explicitlyPreferred)
    return bounds == null ? null : {
      mw: bounds.maximumMw,
      ...bounds,
      claim: explicitlyPreferred,
    }
  }
  const facility = allClaims.filter(
    (c) =>
      c.state !== 'superseded' &&
      !['estimated', 'inferred', 'disputed'].includes(c.state) &&
      !excludedTypes.includes(c.capacity_type),
  )
  let best: HeadlineCapacity | null = null
  for (const c of facility) {
    const bounds = claimBoundsMW(c)
    if (bounds && (!best || bounds.maximumMw > best.maximumMw)) {
      best = { mw: bounds.maximumMw, ...bounds, claim: c }
    }
  }
  return best
}

export interface HeadlineCapacityTotal {
  minimumMw: number
  maximumMw: number
  projects: number
}

export function sumHeadlineCapacity(projects: ProjectRecord[]): HeadlineCapacityTotal {
  let minimumMw = 0
  let maximumMw = 0
  let withCapacity = 0
  for (const project of projects) {
    const capacity = headlineCapacityMW(project)
    if (!capacity) continue
    minimumMw += capacity.minimumMw
    maximumMw += capacity.maximumMw
    withCapacity += 1
  }
  return { minimumMw, maximumMw, projects: withCapacity }
}

export function headlineEnergyGWh(p: ProjectRecord): number | null {
  let best: number | null = null
  for (const e of p.energy_estimates ?? []) {
    if (typeof e.annual_energy_gwh === 'number' && (best == null || e.annual_energy_gwh > best)) {
      best = e.annual_energy_gwh
    }
  }
  return best
}

export function headlineWaterM3(p: ProjectRecord): number | null {
  let best: number | null = null
  for (const w of p.water_estimates ?? []) {
    if (typeof w.annual_water_m3 === 'number' && (best == null || w.annual_water_m3 > best)) {
      best = w.annual_water_m3
    }
  }
  return best
}

export function headlineCapexGBP(p: ProjectRecord): number | null {
  let best: number | null = null
  for (const c of p.economic_claims ?? []) {
    if (c.claim_category !== 'capital_expenditure' || c.state === 'superseded') continue
    const v = typeof c.value === 'number' ? c.value : (c.value_min ?? c.value_max)
    if (typeof v === 'number' && (best == null || v > best)) best = v
  }
  return best
}

export function operationalJobsClaim(p: ProjectRecord): number | null {
  let best: number | null = null
  for (const c of p.economic_claims ?? []) {
    if (c.claim_category !== 'direct_operational_jobs' || c.state === 'superseded') continue
    const v = typeof c.value === 'number' ? c.value : (c.value_max ?? c.value_min)
    if (typeof v === 'number' && (best == null || v > best)) best = v
  }
  return best
}

export function publishedObjections(p: ProjectRecord): number | null {
  let best: number | null = null
  for (const pc of p.planning_cases ?? []) {
    const o = pc.representations?.objections
    if (typeof o === 'number' && (best == null || o > best)) best = o
  }
  return best
}

export function developersOf(p: ProjectRecord): string[] {
  return [...new Set((p.organisations ?? [])
    .filter((o) => o.role === 'developer')
    .map((o) => o.name))]
}

export function projectCoords(p: ProjectRecord): [number, number] | null {
  /* `display_point` is set by the build wherever the researched lat/lon fell
     outside the site's own official boundary — the red line came off the
     application and is the better evidence. The researched point is still on the
     record, so the discrepancy stays visible on the profile. */
  const dp = p.site?.display_point
  if (Array.isArray(dp) && typeof dp[0] === 'number' && typeof dp[1] === 'number') {
    return [dp[0], dp[1]]
  }
  const { longitude, latitude } = p.site ?? {}
  if (typeof longitude === 'number' && typeof latitude === 'number') return [longitude, latitude]
  return null
}

/* ------------------------------------------------------------------ */
/* Formatting                                                         */
/* ------------------------------------------------------------------ */

const nf0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

export function fmtInt(n: number): string {
  return nf0.format(n)
}

export function fmtMW(mw: number): string {
  return mw >= 1000 ? `${nf1.format(mw / 1000)} GW` : `${nf0.format(mw)} MW`
}

export function fmtGBP(v: number): string {
  if (v >= 1e9) return `£${nf1.format(v / 1e9)}bn`
  if (v >= 1e6) return `£${nf1.format(v / 1e6)}m`
  return `£${nf0.format(v)}`
}

export function fmtM3(v: number): string {
  return `${nf0.format(v)} m³`
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function fmtRangeMW(c: CapacityClaim): string {
  if (typeof c.value_mw === 'number') return fmtMW(c.value_mw)
  if (typeof c.minimum_mw === 'number' && typeof c.maximum_mw === 'number')
    return `${fmtMW(c.minimum_mw)}–${fmtMW(c.maximum_mw)}`
  if (typeof c.minimum_mw === 'number') return `≥ ${fmtMW(c.minimum_mw)}`
  if (typeof c.maximum_mw === 'number') return `≤ ${fmtMW(c.maximum_mw)}`
  return 'not disclosed'
}

export function fmtMWRange(minimumMw: number, maximumMw: number): string {
  return minimumMw === maximumMw
    ? fmtMW(maximumMw)
    : `${fmtMW(minimumMw)}–${fmtMW(maximumMw)}`
}

export const CAPACITY_TYPE_LABELS: Record<string, string> = {
  it_load: 'IT load',
  grid_import: 'Grid import',
  connection_application: 'Connection application',
  connection_offer: 'Connection offer',
  backup_generation: 'Backup generation',
  onsite_generation: 'On-site / linked generation',
  battery_storage: 'Battery storage',
  first_phase: 'First phase',
  ultimate_buildout: 'Ultimate build-out',
  unspecified: 'Unspecified capacity',
}

export const ECONOMIC_CATEGORY_LABELS: Record<string, string> = {
  capital_expenditure: 'Capital expenditure',
  direct_operational_jobs: 'Direct operational jobs',
  indirect_operational_jobs: 'Indirect operational jobs',
  induced_jobs: 'Induced jobs',
  total_jobs_unspecified: 'Total jobs (unspecified mix)',
  construction_job_years: 'Construction job-years',
  peak_construction_workforce: 'Peak construction workforce',
  gva: 'GVA',
  business_rates: 'Business rates',
  community_fund: 'Community fund',
  apprenticeships: 'Apprenticeships',
  other: 'Other',
}

export function fmtEconValue(c: { value?: number | null; value_min?: number; value_max?: number; unit?: string }): string {
  const unit = c.unit ?? ''
  const one = (v: number) => (unit === 'gbp' ? fmtGBP(v) : `${fmtInt(v)}${unit && unit !== 'unstated' ? ` ${unit.replace('_', '-')}` : ''}`)
  if (typeof c.value === 'number') return one(c.value)
  if (typeof c.value_min === 'number' && typeof c.value_max === 'number') return `${one(c.value_min)}–${one(c.value_max)}`
  if (typeof c.value_max === 'number') return `up to ${one(c.value_max)}`
  if (typeof c.value_min === 'number') return `over ${one(c.value_min)}`
  return 'not stated'
}
