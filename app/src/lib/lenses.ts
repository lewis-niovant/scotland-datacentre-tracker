import type { LensId, ProjectRecord } from '../types'
import {
  fmtGBP, fmtInt, fmtMW, headlineCapacityMW, headlineCapexGBP, headlineEnergyGWh,
  headlineWaterM3, maturityNumber, operationalJobsClaim, publishedObjections,
  statusGroup, STATUS_GROUP_META,
} from './data'

/* Sequential blue ramp (light->dark = low->high magnitude), from the
   validated reference palette. Ordinal-safe steps only. */
const SEQ = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b']
const SEQ_DARK = ['#86b6ef', '#5598e7', '#3987e5', '#256abf', '#184f95']
const NO_DATA = '#898781'

export interface MarkerStyle {
  color: string
  colorDark: string
  size: number // px diameter
  metricLabel: string // shown in tooltip, e.g. "600 MW claimed"
}

export interface StatTileDef {
  value: string
  label: string
}

export interface LensDef {
  id: LensId
  label: string
  marker: (p: ProjectRecord) => MarkerStyle
  legend: string
  stats: (projects: ProjectRecord[]) => StatTileDef[]
}

function seqStyle(frac: number | null, size: number, metricLabel: string): MarkerStyle {
  if (frac == null) return { color: NO_DATA, colorDark: NO_DATA, size: 12, metricLabel: 'no figure located' }
  const i = Math.min(SEQ.length - 1, Math.max(0, Math.floor(frac * SEQ.length)))
  return { color: SEQ[i], colorDark: SEQ_DARK[i], size, metricLabel }
}

function statusStyle(p: ProjectRecord, size = 16): MarkerStyle {
  const meta = STATUS_GROUP_META[statusGroup(p.project.status)]
  return { color: meta.color, colorDark: meta.colorDark, size, metricLabel: meta.label }
}

function sizeBySqrt(v: number, max: number, minPx = 12, maxPx = 34): number {
  if (max <= 0) return minPx
  return minPx + (maxPx - minPx) * Math.sqrt(Math.min(v / max, 1))
}

function sum(vals: Array<number | null>): { total: number; n: number } {
  let total = 0
  let n = 0
  for (const v of vals) if (v != null) { total += v; n += 1 }
  return { total, n }
}

/* Reference maxima keep marker scales stable as filters change. */
const MAX_MW = 1000
const MAX_WATER = 500000
const MAX_CAPEX = 10e9

export const LENSES: LensDef[] = [
  {
    id: 'overview',
    label: 'Overview',
    legend: 'Colour: status group',
    marker: (p) => statusStyle(p),
    stats: (ps) => {
      const cap = sum(ps.map((p) => headlineCapacityMW(p)?.mw ?? null))
      return [
        { value: fmtInt(ps.length), label: 'projects shown' },
        { value: cap.n ? fmtMW(cap.total) : '—', label: `claimed capacity (${cap.n} projects, mixed claim states)` },
        { value: fmtInt(new Set(ps.map((p) => p.project.local_authority)).size), label: 'local authorities' },
      ]
    },
  },
  {
    id: 'electricity',
    label: '⚡ Electricity',
    legend: 'Size & shade: claimed capacity (MW)',
    marker: (p) => {
      const cap = headlineCapacityMW(p)
      if (!cap) return seqStyle(null, 12, 'no capacity figure located')
      return seqStyle(Math.sqrt(cap.mw / MAX_MW), sizeBySqrt(cap.mw, MAX_MW), `${fmtMW(cap.mw)} claimed (${cap.claim.capacity_type.replace(/_/g, ' ')})`)
    },
    stats: (ps) => {
      const cap = sum(ps.map((p) => headlineCapacityMW(p)?.mw ?? null))
      const gwh = sum(ps.map(headlineEnergyGWh))
      return [
        { value: cap.n ? fmtMW(cap.total) : '—', label: `total claimed capacity (${cap.n}/${ps.length} projects; largely developer-stated)` },
        { value: gwh.n ? `${fmtInt(gwh.total)} GWh/yr` : '—', label: `claimed / estimated annual energy at full build (${gwh.n} projects)` },
        { value: fmtInt(ps.length - cap.n), label: 'projects with no capacity figure' },
      ]
    },
  },
  {
    id: 'water',
    label: '💧 Water',
    legend: 'Size & shade: claimed water use (m³/yr)',
    marker: (p) => {
      const w = headlineWaterM3(p)
      if (w == null) return seqStyle(null, 12, 'no water figure located')
      return seqStyle(Math.sqrt(w / MAX_WATER), sizeBySqrt(w, MAX_WATER), `${fmtInt(w)} m³/yr claimed`)
    },
    stats: (ps) => {
      const w = sum(ps.map(headlineWaterM3))
      return [
        { value: w.n ? `${fmtInt(w.total)} m³/yr` : '—', label: `claimed annual water use (${w.n} projects; developer figures)` },
        { value: fmtInt(w.n), label: 'projects with any water estimate' },
        { value: fmtInt(ps.length - w.n), label: 'projects with no water figure' },
      ]
    },
  },
  {
    id: 'economics',
    label: '💷 Economics',
    legend: 'Size & shade: claimed capital expenditure',
    marker: (p) => {
      const c = headlineCapexGBP(p)
      if (c == null) return seqStyle(null, 12, 'no investment figure located')
      return seqStyle(Math.sqrt(c / MAX_CAPEX), sizeBySqrt(c, MAX_CAPEX), `${fmtGBP(c)} claimed investment`)
    },
    stats: (ps) => {
      const capex = sum(ps.map(headlineCapexGBP))
      const jobs = sum(ps.map(operationalJobsClaim))
      return [
        { value: capex.n ? fmtGBP(capex.total) : '—', label: `claimed investment (${capex.n} projects; developer-stated, unverified)` },
        { value: jobs.n ? fmtInt(jobs.total) : '—', label: `claimed direct operational jobs (${jobs.n} projects)` },
        { value: fmtInt(ps.length - capex.n), label: 'projects with no investment figure' },
      ]
    },
  },
  {
    id: 'planning',
    label: '📋 Planning',
    legend: 'Colour: status group · size: live application',
    marker: (p) => {
      const livePending = (p.planning_cases ?? []).some((c) => c.decision === 'pending' && c.reference)
      return statusStyle(p, livePending ? 24 : 14)
    },
    stats: (ps) => {
      const pending = ps.filter((p) => (p.planning_cases ?? []).some((c) => c.decision === 'pending' && c.reference))
      const obj = sum(ps.map(publishedObjections))
      const eiaNo = ps.filter((p) => (p.planning_cases ?? []).some((c) => c.decision === 'screening_eia_not_required')).length
      return [
        { value: fmtInt(pending.length), label: 'live applications awaiting decision' },
        { value: obj.n ? `${fmtInt(obj.total)}+` : '—', label: 'published objections (portal minimums)' },
        { value: fmtInt(eiaNo), label: 'screened as not requiring EIA' },
      ]
    },
  },
  {
    id: 'credibility',
    label: '🔍 Credibility',
    legend: 'Shade: maturity M0 (concept) → M5 (operating)',
    marker: (p) => {
      const m = maturityNumber(p.project.maturity_level)
      return seqStyle(m / 5, 12 + m * 3.2, `Maturity ${p.project.maturity_level} · ${p.project.verification_level ?? 'unverified'}`)
    },
    stats: (ps) => {
      const verified = ps.filter((p) => p.project.verification_level === 'verified').length
      const formal = ps.filter((p) => maturityNumber(p.project.maturity_level) >= 2).length
      return [
        { value: fmtInt(verified), label: 'verified against official records' },
        { value: fmtInt(ps.length - verified), label: 'reported / unverifiable only' },
        { value: fmtInt(formal), label: 'at formal application stage or beyond (M2+)' },
      ]
    },
  },
]

export function lensById(id: LensId): LensDef {
  return LENSES.find((l) => l.id === id) ?? LENSES[0]
}
