import { Link } from 'react-router-dom'
import type { ProjectRecord } from '../types'
import {
  fmtMW, fmtRangeMW, headlineCapacityMW, stateLabel, developersOf,
} from '../lib/data'
import { MaturityBadge, StatusBadge, StateChip } from './Badges'

export default function ProjectSheet({ p, onClose }: { p: ProjectRecord; onClose: () => void }) {
  const name = p.project.display_name ?? p.project.canonical_name
  const cap = headlineCapacityMW(p)
  const devs = developersOf(p)
  return (
    <aside className="sheet" aria-label={`Summary of ${name}`}>
      <div className="sheet-handle" />
      <button className="sheet-close" onClick={onClose} aria-label="Close panel">✕</button>
      <div className="sheet-body summary-card">
        <h2>{name}</h2>
        <div className="meta">
          {p.project.local_authority}
          {p.project.region ? ` · ${p.project.region}` : ''}
          {p.project.project_type ? ` · ${p.project.project_type.replace(/_/g, ' ')}` : ''}
        </div>
        <div className="badge-row">
          <StatusBadge status={p.project.status} />
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
          {p.project.verification_level && (
            <>
              <dt>Verification</dt>
              <dd>{p.project.verification_level}</dd>
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
