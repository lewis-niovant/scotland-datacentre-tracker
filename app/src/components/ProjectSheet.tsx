import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectRecord } from '../types'
import {
  fmtMW, fmtRangeMW, headlineCapacityMW, stateLabel, developersOf, statusGroup,
  statusLabel, STATUS_GROUP_META,
} from '../lib/data'
import { MaturityBadge, StateChip, VerificationBadge } from './Badges'

/** Bottom sheet (mobile) / side panel (desktop). On mobile it opens as a
    peek — name, status, headline figure — and expands on tap or upward drag. */
export default function ProjectSheet({ p, onClose }: { p: ProjectRecord; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const name = p.project.display_name ?? p.project.canonical_name
  const cap = headlineCapacityMW(p)
  const devs = developersOf(p)
  const gMeta = STATUS_GROUP_META[statusGroup(p.project.status)]

  const onTouchStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current == null) return
    const dy = e.changedTouches[0].clientY - dragStartY.current
    dragStartY.current = null
    if (dy < -24) setExpanded(true)
    else if (dy > 24) { if (expanded) setExpanded(false); else onClose() }
  }

  return (
    <aside
      className={`sheet${expanded ? ' expanded' : ' peek'}`}
      aria-label={`Summary of ${name}`}
    >
      <div
        className="sheet-head"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v) } }}
        aria-expanded={expanded}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-title-row">
          <div className="sheet-title">
            <h2>{name}</h2>
            <div className="sheet-status">
              <span className="dot" style={{ background: `light-dark(${gMeta.color}, ${gMeta.colorDark})` }} />
              {statusLabel(p.project.status)}
              {cap && <span className="sheet-cap"> · {fmtRangeMW(cap.claim)} claimed</span>}
            </div>
          </div>
          <button
            className="sheet-close"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="sheet-body summary-card">
        <div className="meta">
          {p.project.local_authority}
          {p.project.region && p.project.region !== p.project.local_authority ? ` · ${p.project.region}` : ''}
          {p.project.project_type ? ` · ${p.project.project_type.replace(/_/g, ' ')}` : ''}
        </div>
        <div className="badge-row">
          <VerificationBadge level={p.project.verification_level} />
          <MaturityBadge level={p.project.maturity_level} />
        </div>
        <dl className="kv-mini">
          {cap && (
            <>
              <dt>Capacity claim</dt>
              <dd>
                {fmtRangeMW(cap.claim)}{' '}
                <StateChip state={cap.claim.state} />
              </dd>
            </>
          )}
          {devs.length > 0 && (
            <>
              <dt>Developer</dt>
              <dd>{devs.join(', ')}</dd>
            </>
          )}
        </dl>
        {cap && cap.mw >= 1000 && (
          <p className="small muted">
            Large figures like {fmtMW(cap.mw)} are {stateLabel(cap.claim.state)} claims by{' '}
            {cap.claim.claimant ?? 'the promoter'}, not verified capacity.
          </p>
        )}
        <p className="blurb">{p.project.summary}</p>
        <Link className="btn-primary" to={`/project/${p.project.slug}`}>Full profile →</Link>
      </div>
    </aside>
  )
}
