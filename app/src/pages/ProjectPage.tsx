import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { PlanningCase, ProjectRecord, QuantityClaim } from '../types'
import {
  CAPACITY_TYPE_LABELS, ECONOMIC_CATEGORY_LABELS, MATURITY_META, TIER_LABELS,
  fmtDate, fmtEconValue, fmtInt, fmtRangeMW, headlineCapacityMW, headlineEnergyGWh,
  headlineWaterM3, developersOf, useDataset,
} from '../lib/data'
import { MaturityBadge, StatusBadge, StateChip, VerificationBadge } from '../components/Badges'
import { primaryBoundary } from '../lib/geometry'

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

/** Collapsible section — progressive disclosure for the detail-heavy parts. */
function Section({ title, hint, defaultOpen, children }: {
  title: string
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details className="acc" open={defaultOpen}>
      <summary>
        <span className="acc-title">{title}</span>
        {hint && <span className="acc-hint">{hint}</span>}
        <svg className="acc-chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="acc-body">{children}</div>
    </details>
  )
}

/** Football-pitch comparison: a row of pitch icons, assumption disclosed. */
function PitchIcon() {
  return (
    <svg className="pitch-icon" viewBox="0 0 28 18" aria-hidden="true">
      <rect x="1" y="1" width="26" height="16" rx="2" />
      <line x1="14" y1="1" x2="14" y2="17" />
      <circle cx="14" cy="9" r="2.6" fill="none" />
      <rect x="1" y="5.5" width="3.6" height="7" fill="none" />
      <rect x="23.4" y="5.5" width="3.6" height="7" fill="none" />
    </svg>
  )
}

function PitchComparison({ areaM2, pitchM2, basis }: { areaM2: number; pitchM2: number; basis: string }) {
  const pitches = areaM2 / pitchM2
  const rounded = pitches >= 10 ? Math.round(pitches) : Math.round(pitches * 10) / 10
  let perIcon = 1
  if (pitches > 200) perIcon = 25
  else if (pitches > 80) perIcon = 10
  else if (pitches > 30) perIcon = 5
  const icons = Math.max(1, Math.round(pitches / perIcon))
  return (
    <div className="pitch-compare">
      <div className="pitch-headline">
        <strong>≈ {fmtInt(rounded)} football pitches</strong> of {basis}
      </div>
      <div className="pitch-row" aria-hidden="true">
        {Array.from({ length: Math.min(icons, 40) }, (_, i) => <PitchIcon key={i} />)}
      </div>
      <div className="pitch-note">
        {perIcon > 1 ? `Each pitch icon ≈ ${perIcon} pitches. ` : ''}
        Assumes a {fmtInt(pitchM2)} m² pitch; area {fmtInt(areaM2)} m² ({basis}).
      </div>
    </div>
  )
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
  const cap = headlineCapacityMW(record)
  const devs = developersOf(record)
  const reportedArea = site?.site_area_m2?.value
  const boundary = primaryBoundary(ds.geo, project.slug)
  const officialArea = typeof boundary?.properties.official_area_m2 === 'number'
    ? boundary.properties.official_area_m2
    : null
  /* Prefer the official red line where one exists — but always show both,
     because the discrepancies are the editorial point. */
  const area = officialArea ?? (typeof reportedArea === 'number' ? reportedArea : undefined)
  const areaBasis = officialArea != null ? 'official red-line area' : 'claimed site area'
  const pitchM2 = constants?.football_pitch_m2?.value
  const houseKwh = constants?.household_annual_electricity_kwh?.value
  const poolM3 = constants?.olympic_pool_m3?.value

  const nSources = sourceIds.length

  return (
    <div className="page">
      {/* ---------- headline card: what / where / how big / status / who ---------- */}
      <div className="profile-hero">
        <div className="crumb">
          <Link to="/projects">Projects</Link> <span aria-hidden="true">/</span> {project.local_authority}
        </div>
        <h1>{name}</h1>
        {project.canonical_name !== name && <p className="muted small">{project.canonical_name}</p>}
        <div className="badge-row">
          <StatusBadge status={project.status} />
          <MaturityBadge level={project.maturity_level} />
          <VerificationBadge level={project.verification_level} />
        </div>
        <div className="hero-grid">
          <div className="hero-stat">
            <div className="hv">
              {cap ? fmtRangeMW(cap.claim) : '—'}
            </div>
            <div className="hl">
              capacity claim {cap && <StateChip state={cap.claim.state} />}
            </div>
          </div>
          <div className="hero-stat">
            <div className="hv">
              {typeof area === 'number'
                ? `${area / 10000 < 100 ? (area / 10000).toFixed(1) : fmtInt(area / 10000)} ha`
                : '—'}
            </div>
            <div className="hl">
              {officialArea != null ? 'official red-line area' : 'claimed site area'}{' '}
              {officialArea != null
                ? <StateChip state="confirmed" />
                : site?.site_area_m2 && <StateChip state={site.site_area_m2.state} />}
            </div>
          </div>
          <div className="hero-stat">
            <div className="hv hv-sm">{project.local_authority}</div>
            <div className="hl">local authority</div>
          </div>
          <div className="hero-stat">
            <div className="hv hv-sm">{devs.length ? devs.join(', ') : 'No developer named'}</div>
            <div className="hl">developer</div>
          </div>
        </div>
        {officialArea != null && (
          <>
            <div className="area-compare">
              <span className="ac official">
                <span className="k">Official red line</span>
                <span className="n">{(officialArea / 10000).toFixed(1)} ha</span>
              </span>
              {typeof reportedArea === 'number' && (
                <span className="ac">
                  <span className="k">Reported</span>
                  <span className="n">{(reportedArea / 10000).toFixed(1)} ha</span>
                </span>
              )}
            </div>
            <p className="small muted">
              Red-line area measured from the official application boundary
              {boundary?.properties.reference ? ` (${boundary.properties.reference}, ` : ' ('}
              {boundary?.properties.local_auth ?? 'local authority'} via Spatial Hub Scotland, OGL v3
              {boundary?.properties.retrieved_date ? `, retrieved ${fmtDate(boundary.properties.retrieved_date)}` : ''}).
              {typeof reportedArea === 'number' && Math.abs(officialArea - reportedArea) / officialArea > 0.15 && (
                <> The reported figure differs materially from the official boundary — both are shown rather than reconciled.</>
              )}
            </p>
          </>
        )}
        <p className="hero-summary">{project.summary}</p>
        {maturity && (
          <p className="small muted">
            <strong>{maturity.label}:</strong> {maturity.explanation}{' '}
            {project.maturity_explanation && <>Evidence for this project: {project.maturity_explanation}</>}
          </p>
        )}
        {project.latest_development?.headline && (
          <div className="latest-card">
            <span className="latest-tag">Latest · {fmtDate(project.latest_development.date)}</span>
            <div>{project.latest_development.headline}</div>
          </div>
        )}
        {(project.aliases?.length ?? 0) > 0 && (
          <p className="small muted">
            Also known as: {project.aliases!.map((a) => a.alias).join(' · ')}
          </p>
        )}
      </div>

      {/* ---------- scale comparisons stay visible: the delight ---------- */}
      {(typeof area === 'number' && pitchM2) || (energy != null && houseKwh) || (water != null && poolM3) ? (
        <section className="section compare-section">
          <div className="compare-head">
            <h2>How big is that?</h2>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={showComparisons}
                onChange={(e) => setShowComparisons(e.target.checked)}
              />
              Show comparisons
            </label>
          </div>
          {showComparisons && (
            <>
              {typeof area === 'number' && pitchM2 && (
                <PitchComparison areaM2={area} pitchM2={pitchM2} basis={areaBasis} />
              )}
              <div className="compare-cards">
                {energy != null && houseKwh && (
                  <div className="compare-card">
                    <div className="cv">{fmtInt((energy * 1e6) / houseKwh)}</div>
                    <div className="cl">typical households’ annual electricity ≈ the highest claimed annual energy ({fmtInt(energy)} GWh, Ofgem {fmtInt(houseKwh)} kWh/household)</div>
                  </div>
                )}
                {water != null && poolM3 && (
                  <div className="compare-card">
                    <div className="cv">{(water / poolM3).toFixed(1)}</div>
                    <div className="cl">Olympic swimming pools ≈ claimed annual water use ({fmtInt(water)} m³)</div>
                  </div>
                )}
              </div>
              <p className="figure-note">Approximate, assumption-disclosed comparisons of claimed figures — details in About.</p>
            </>
          )}
        </section>
      ) : null}

      {/* ---------- expandable detail ---------- */}
      <Section title="Key figures" hint="every value is a claim, with its state and claimant" defaultOpen>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Figure</th><th>Value</th><th>State</th><th>Claimant</th></tr>
            </thead>
            <tbody>
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
      </Section>

      {(record.capacity_claims?.length ?? 0) > 0 && (
        <Section title="Capacity claims" hint={`${record.capacity_claims!.length} figures, side by side`}>
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
                      {c.preferred && <div className="small preferred-flag">preferred</div>}
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
        </Section>
      )}

      {(timeline.length > 0 || (record.planning_cases?.length ?? 0) > 0) && (
        <Section
          title="Planning"
          hint={`${record.planning_cases?.length ?? 0} case${(record.planning_cases?.length ?? 0) === 1 ? '' : 's'}${timeline.length ? ` · ${timeline.length} events` : ''}`}
        >
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
        </Section>
      )}

      {(record.economic_claims?.length ?? 0) > 0 && (
        <Section title="Economic claims" hint={`${record.economic_claims!.length} claims — money and jobs`}>
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
        </Section>
      )}

      {(record.organisations?.length ?? 0) > 0 && (
        <Section title="Who is behind it" hint={`${record.organisations!.length} organisations`}>
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
        </Section>
      )}

      {community && (
        <Section title="Community" hint="concerns raised and benefits claimed">
          {community.summary && <p className="small">{community.summary}</p>}
          {(community.principal_concerns?.length ?? 0) > 0 && (
            <>
              <h3 className="sub-label">Principal concerns</h3>
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
              <h3 className="sub-label">Claimed local benefits</h3>
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
        </Section>
      )}

      {(project.unknowns?.length ?? 0) > 0 && (
        <Section title="What we don’t know" hint="documented gaps — never guessed at">
          <ul className="plain">
            {project.unknowns!.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </Section>
      )}

      {nSources > 0 && (
        <Section title="Sources" hint={`${nSources} cited`}>
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
        </Section>
      )}

      <p style={{ marginTop: 28 }}>
        <Link to="/projects">← All projects</Link>{' · '}
        <Link to="/">Map</Link>
      </p>
    </div>
  )
}
