import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  developersOf, fmtRangeMW, headlineCapacityMW, maturityNumber, statusGroup,
  STATUS_GROUPS, STATUS_GROUP_META, useDataset,
} from '../lib/data'
import { StatusBadge, StateChip, VerificationBadge } from '../components/Badges'

type SortKey = 'capacity' | 'status' | 'authority' | 'name'

export default function ProjectsPage() {
  const ds = useDataset()
  const [sort, setSort] = useState<SortKey>('capacity')

  const projects = useMemo(() => {
    const list = [...ds.observatory.projects]
    list.sort((a, b) => {
      switch (sort) {
        case 'capacity': {
          const ca = headlineCapacityMW(a)?.mw ?? -1
          const cb = headlineCapacityMW(b)?.mw ?? -1
          return cb - ca
        }
        case 'status': {
          const d = STATUS_GROUPS.indexOf(statusGroup(a.project.status)) -
                    STATUS_GROUPS.indexOf(statusGroup(b.project.status))
          return d !== 0 ? d : maturityNumber(b.project.maturity_level) - maturityNumber(a.project.maturity_level)
        }
        case 'authority':
          return (a.project.local_authority || '').localeCompare(b.project.local_authority || '')
        default:
          return (a.project.display_name ?? a.project.canonical_name)
            .localeCompare(b.project.display_name ?? b.project.canonical_name)
      }
    })
    return list
  }, [ds, sort])

  return (
    <div className="page">
      <h1>Projects</h1>
      <p className="lede">
        {projects.length} tracked data centre projects. Capacity figures are claims — most are
        developer-stated and unverified against any planning or grid record.
      </p>
      <div className="sort-row">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="capacity">Capacity claim (largest first)</option>
          <option value="status">Status</option>
          <option value="authority">Local authority</option>
          <option value="name">Name</option>
        </select>
      </div>
      {projects.map((p) => {
        const cap = headlineCapacityMW(p)
        const devs = developersOf(p)
        const gMeta = STATUS_GROUP_META[statusGroup(p.project.status)]
        return (
          <Link
            key={p.project.slug}
            to={`/project/${p.project.slug}`}
            className="card project-card"
            style={{ ['--status-color' as string]: `light-dark(${gMeta.color}, ${gMeta.colorDark})` }}
          >
            <div className="pc-top">
              <h3>{p.project.display_name ?? p.project.canonical_name}</h3>
              <VerificationBadge level={p.project.verification_level} />
            </div>
            <div className="badge-row">
              <StatusBadge status={p.project.status} />
            </div>
            <div className="figs">
              <div className="f">
                <b>{cap ? fmtRangeMW(cap.claim) : '—'}</b>{' '}
                {cap && <StateChip state={cap.claim.state} />}
                <span>capacity claim</span>
              </div>
              <div className="f">
                <b>{p.project.local_authority}</b>
                <span>local authority</span>
              </div>
              {devs.length > 0 && (
                <div className="f">
                  <b>{devs.join(', ')}</b>
                  <span>developer</span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
