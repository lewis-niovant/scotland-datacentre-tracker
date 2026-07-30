import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { PlanningCase, ProjectRecord, QuantityClaim } from '../types'
import {
  CAPACITY_TYPE_LABELS, ECONOMIC_CATEGORY_LABELS, MATURITY_META, TIER_LABELS,
  fmtDate, fmtEconValue, fmtInt, fmtRangeMW, headlineEnergyGWh, headlineWaterM3,
  useDataset,
} from '../lib/data'
import { MaturityBadge, StatusBadge, StateChip } from '../components/Badges'

/* ---------------- helpers ---------------- */

function collectSourceIds(node: unknown, acc: Set<string>) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSourceIds(n, acc))
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === 'source_ids' && Array.isArray(v)) v.forEach((id) => typeof id === 'string' && acc.add(id))
      else collectSourceIds(v, acc)
    }
  }
}

function QuantityRow({ label, q, unitLabel }: { label: string; q?: QuantityClaim; unitLabel?: string }) {
  if (!q) return null
  let text: string
  if (typeof q.value === 'number') text = `${fmtInt(q.value)}${unitLabel ? ` ${unitLabel}` : ''}`
  else if (typeof q.min === 'number' || typeof q.max === 'number')
    text = `${q.min ?? '?'}–${q.max ?? '?'}${unitLabel ? ` ${unitLabel}` : ''}`
  else text = 'not disclosed'
  return (
    <tr>
      <td>{label}</td>
      <td className="num">{text}</td>
      <td><StateChip state={q.state} /></td>
      <td className="small muted">{q.claimant ?? '—'}</td>
    </tr>
  )
}

interface TimelineEntry { date: string; title: string; ref?: string | null }

function timelineOf(cases: PlanningCase[]): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  for (const c of cases) {
    for (const e of c.events ?? []) {
      if (e.event_date && e.title) entries.push({ date: e.event_date, title: e.title, ref: c.reference })
    }
    if (c.decision_date && !(c.events ?? []).some((e) => e.event_date === c.decision_date)) {
      entries.push({ date: c.decision_date, title: `Decision: ${c.decision ?? 'unknown'}`, ref: c.reference })
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date))
}

/* ---------------- page ---------------- */

export default function ProjectPage() {
  const { slug } = useParams()
  const ds = useDataset()
  const [showComparisons, setShowComparisons] = useState(true)

  const record: ProjectRecord | undefined = ds.observatory.projects.find(
    (p) => p.project.slug === slug,
  )

  const sourceIds = useMemo(() => {
    const acc = new Set<string>()
    if (record) collectSourceIds(record, acc)
    return [...acc]
  }, [record])

  if (!record) {
    return (
      <div className="page">
        <h1>Project not found</h1>
        <p>No project with slug “{slug}” exists in this snapshot.</p>
        <Link to="/projects">← All projects</Link>
      </div>
    )
  }

  const { project, site, community, grid } = record
  const name = project.display_name ?? project.canonical_name
  const maturity = MATURITY_META[project.maturity_level]
  const timeline = timelineOf(record.planning_cases ?? [])
  const constants = ds.observatory.constants?.comparisons
  const energy = headlineEnergyGWh(record)
  const water = headlineWaterM3(record)

  const comparisons: string[] = []
  if (constants) {
    const pitch = constants.football_pitch_m2?.value
    const house = constants.household_annual_electricity_kwh?.value
    const pool = constants.olympic_pool_m3?.value
    const area = site?.site_area_m2?.value
    if (pitch && typeof area === 'number')
      comparisons.push(`Claimed site area ≈ ${fmtInt(area / pitch)} football pitches (${fmtInt(area)} m² ÷ ${fmtInt(pitch)} m²).`)
    if (house && energy != null)
      comparisons.push(`Highest claimed annual energy (${fmtInt(energy)} GWh) ≈ the annual electricity of ${fmtInt((energy * 1e6) / house)} typical households (Ofgem ${fmtInt(house)} kWh/yr).`)
    if (pool && water != null)
      comparisons.push(`Claimed annual water use (${fmtInt(water)} m³) ≈ ${(water / pool).toFixed(1)} Olympic swimming pools.`)
  }

  return (
    <div className="page">
      <div className="profile-head">
        <div className="name-row">
          <h1>{name}</h1>
        </div>
        {project.canonical_name !== name && <p className="muted small">{project.canonical_name}</p>}
        <div className="badge-row">
          <StatusBadge status={project.status} />
          <MaturityBadge level={project.maturity_level} />
          {project.verification_level && <span className="badge">{project.verification_level}</span>}
        </div>
        {maturity && (
          <p className="small muted">
            <strong>{maturity.label}:</strong> {maturity.explanation}{' '}
            {project.maturity_explanation && <>Evidence for this project: {project.maturity_explanation}</>}
          </p>
        )}
        <p>{project.summary}</p>
        {project.latest_development?.headline && (
          <div className="card">
            <strong className="small">Latest development · {fmtDate(project.latest_development.date)}</strong>
            <div className="small">{project.latest_development.headline}</div>
          </div>
        )}
        {(project.aliases?.length ?? 0) > 0 && (
          <p className="small muted">
            Also known as: {project.aliases!.map((a) => a.alias).join(' · ')}
          </p>
        )}
      </div>

      <section className="section">
        <h2>Key figures</h2>
        <p className="figure-note">
          Every value is a claim with an explicit state and claimant. Nothing here is an
          Observatory measurement.
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Figure</th><th>Value</th><th>State</th><th>Claimant</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Local authority</td>
                <td className="num">{project.local_authority}</td>
                <td /><td />
              </tr>
              <QuantityRow label="Site area" q={site?.site_area_m2} unitLabel="m²" />
              <QuantityRow label="Gross floor area" q={site?.gross_floor_area_m2} unitLabel="m²" />
              <QuantityRow label="Max building height" q={site?.max_building_height_m} unitLabel="m" />
              <QuantityRow label="Number of buildings" q={site?.number_of_buildings} />
              <QuantityRow label="Requested grid import" q={grid?.requested_import_capacity_mw} unitLabel="MW" />
              {energy != null && (
                <tr>
                  <td>Highest claimed annual energy</td>
                  <td className="num">{fmtInt(energy)} GWh/yr</td>
                  <td><StateChip state={record.energy_estimates?.find((e) => e.annual_energy_gwh === energy)?.state} /></td>
                  <td className="small muted">{record.energy_estimates?.find((e) => e.annual_energy_gwh === energy)?.scenario_name ?? '—'}</td>
                </tr>
              )}
              {water != null && (
                <tr>
                  <td>Claimed annual water use</td>
                  <td className="num">{fmtInt(water)} m³/yr</td>
                  <td><StateChip state={record.water_estimates?.find((w) => w.annual_water_m3 === water)?.state} /></td>
                  <td className="small muted">{record.water_estimates?.find((w) => w.annual_water_m3 === water)?.estimate_type ?? '—'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(record.capacity_claims?.length ?? 0) > 0 && (
        <section className="section">
          <h2>Capacity claims — all of them, side by side</h2>
          <p className="figure-note">
            Conflicting figures are preserved deliberately; the “preferred” row is an editorial
            interpretation with its rationale, never an average.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Type</th><th>Figure</th><th>State</th><th>Claimant</th><th>Date</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {record.capacity_claims!.map((c, i) => (
                  <tr key={i}>
                    <td>
                      {CAPACITY_TYPE_LABELS[c.capacity_type] ?? c.capacity_type}
                      {c.preferred && <div className="small" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>preferred</div>}
                    </td>
                    <td className="num">{fmtRangeMW(c)}</td>
                    <td><StateChip state={c.state} /></td>
                    <td className="small">{c.claimant ?? '—'}</td>
                    <td className="small muted">{c.applicable_date ?? '—'}</td>
                    <td className="small muted">
                      {c.preferred_rationale ? `Preferred because: ${c.preferred_rationale} ` : ''}
                      {c.notes ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(timeline.length > 0 || (record.planning_cases?.length ?? 0) > 0) && (
        <section className="section">
          <h2>Planning</h2>
          {record.planning_cases?.map((c, i) => (
            <div className="card" key={i}>
              <strong>{c.reference ?? 'No application yet'}</strong>{' '}
              <span className="muted small">
                {c.application_type?.replace(/_/g, ' ')} · {c.planning_authority} · decision: {c.decision ?? 'unknown'}
              </span>
              {c.description && <p className="small" style={{ margin: '6px 0 0' }}>{c.description}</p>}
              {c.representations?.objections != null && (
                <p className="small muted" style={{ margin: '6px 0 0' }}>
                  {fmtInt(c.representations.objections)}+ published objections
                  {c.representations.as_of_date ? ` (as of ${fmtDate(c.representations.as_of_date)})` : ''}.{' '}
                  {c.representations.notes ?? ''}
                </p>
              )}
              {c.official_url && (
                <p className="small" style={{ margin: '6px 0 0' }}>
                  <a href={c.official_url} target="_blank" rel="noreferrer">View on the planning portal ↗</a>
                </p>
              )}
            </div>
          ))}
          {timeline.length > 0 && (
            <ol className="timeline" style={{ marginTop: 14 }}>
              {timeline.map((e, i) => (
                <li key={i}>
                  <div className="t-date">{fmtDate(e.date)}{e.ref ? ` · ${e.ref}` : ''}</div>
                  <div className="t-title">{e.title}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {(record.economic_claims?.length ?? 0) > 0 && (
        <section className="section">
          <h2>Economic claims</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Category</th><th>Figure</th><th>Scope / period</th><th>State</th><th>Claimant</th></tr>
              </thead>
              <tbody>
                {record.economic_claims!.map((c, i) => (
                  <tr key={i}>
                    <td>{ECONOMIC_CATEGORY_LABELS[c.claim_category] ?? c.claim_category}
                      {c.binding_status && <div className="small muted">{c.binding_status}</div>}
                    </td>
                    <td className="num">{fmtEconValue(c)}</td>
                    <td className="small muted">{[c.geographic_scope, c.period].filter(Boolean).join(' · ') || '—'}</td>
                    <td><StateChip state={c.state} /></td>
                    <td className="small">{c.claimant ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(record.organisations?.length ?? 0) > 0 && (
        <section className="section">
          <h2>Organisations</h2>
          <ul className="plain">
            {record.organisations!.map((o, i) => (
              <li key={i}>
                <strong>{o.name}</strong>{' '}
                <span className="muted small">
                  {o.role?.replace(/_/g, ' ')}
                  {o.company_number ? ` · ${o.company_number}` : ''}
                </span>
                {o.ownership_summary && <div className="small muted">{o.ownership_summary}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {community && (
        <section className="section">
          <h2>Community</h2>
          {community.summary && <p className="small">{community.summary}</p>}
          {(community.principal_concerns?.length ?? 0) > 0 && (
            <>
              <h3 className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)' }}>Principal concerns</h3>
              <ul className="plain">
                {community.principal_concerns!.map((c, i) => (
                  <li key={i}>
                    {c.concern}
                    {c.raised_by && <div className="small muted">Raised by: {c.raised_by}</div>}
                    {c.developer_response && <div className="small muted">Developer response: {c.developer_response}</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {(community.claimed_local_benefits?.length ?? 0) > 0 && (
            <>
              <h3 className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)' }}>Claimed local benefits</h3>
              <ul className="plain">
                {community.claimed_local_benefits!.map((b, i) => (
                  <li key={i}>
                    {b.benefit}
                    <div className="small muted">
                      Claimed by {b.claimant ?? 'unknown'}
                      {b.binding_status ? ` · binding status: ${b.binding_status}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {comparisons.length > 0 && (
        <section className="section">
          <h2>Scale comparisons</h2>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={showComparisons}
              onChange={(e) => setShowComparisons(e.target.checked)}
            />
            Show approximate comparisons (assumptions disclosed in About)
          </label>
          {showComparisons && (
            <ul className="plain">
              {comparisons.map((c, i) => <li key={i}>≈ {c}</li>)}
            </ul>
          )}
        </section>
      )}

      {(project.unknowns?.length ?? 0) > 0 && (
        <section className="section">
          <h2>What we don’t know</h2>
          <p className="figure-note">Documented gaps — never guessed at.</p>
          <ul className="plain">
            {project.unknowns!.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </section>
      )}

      {sourceIds.length > 0 && (
        <section className="section">
          <h2>Sources ({sourceIds.length})</h2>
          {sourceIds.map((id) => {
            const s = ds.observatory.sources?.[id]
            if (!s) return <div className="src-item" key={id}><span className="m">{id} (not in ledger)</span></div>
            return (
              <div className="src-item" key={id}>
                <span className="t">
                  {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
                </span>
                <div className="m">
                  {s.publisher}
                  {s.publication_date ? ` · ${fmtDate(s.publication_date)}` : ''}
                  {s.reliability_tier ? ` · ${TIER_LABELS[s.reliability_tier] ?? `Tier ${s.reliability_tier}`}` : ''}
                  {s.perspective ? ` · ${s.perspective}` : ''}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <p style={{ marginTop: 28 }}>
        <Link to="/projects">← All projects</Link>{' · '}
        <Link to="/">Map</Link>
      </p>
    </div>
  )
}
