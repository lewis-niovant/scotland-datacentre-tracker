import type { StatusGroup } from '../types'
import { STATUS_GROUPS, STATUS_GROUP_META } from '../lib/data'
import type { LensDef, StatTileDef } from '../lib/lenses'
import { LENSES } from '../lib/lenses'
import type { LensId } from '../types'

export interface Filters {
  groups: StatusGroup[]
  developer: string
  authority: string
}

export const EMPTY_FILTERS: Filters = { groups: [], developer: '', authority: '' }

export function FilterChips({
  filters, onChange, developers, authorities,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  developers: string[]
  authorities: string[]
}) {
  const toggleGroup = (g: StatusGroup) => {
    const groups = filters.groups.includes(g)
      ? filters.groups.filter((x) => x !== g)
      : [...filters.groups, g]
    onChange({ ...filters, groups })
  }
  return (
    <div className="chip-row" role="toolbar" aria-label="Filters">
      {STATUS_GROUPS.map((g) => {
        const meta = STATUS_GROUP_META[g]
        return (
          <button
            key={g}
            className="chip"
            aria-pressed={filters.groups.includes(g)}
            onClick={() => toggleGroup(g)}
          >
            <span className="dot" style={{ background: `light-dark(${meta.color}, ${meta.colorDark})` }} />
            {meta.short}
          </button>
        )
      })}
      <label className={`chip${filters.developer ? ' has-value' : ''}`}>
        <select
          aria-label="Filter by developer"
          value={filters.developer}
          onChange={(e) => onChange({ ...filters, developer: e.target.value })}
        >
          <option value="">Developer: all</option>
          {developers.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label className={`chip${filters.authority ? ' has-value' : ''}`}>
        <select
          aria-label="Filter by local authority"
          value={filters.authority}
          onChange={(e) => onChange({ ...filters, authority: e.target.value })}
        >
          <option value="">Authority: all</option>
          {authorities.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
      {(filters.groups.length > 0 || filters.developer || filters.authority) && (
        <button className="chip" onClick={() => onChange(EMPTY_FILTERS)}>Clear ✕</button>
      )}
    </div>
  )
}

export function LensSwitcher({ lens, onChange }: { lens: LensId; onChange: (id: LensId) => void }) {
  return (
    <div className="lens-switcher" role="tablist" aria-label="Map lens">
      {LENSES.map((l) => (
        <button key={l.id} role="tab" aria-pressed={l.id === lens} onClick={() => onChange(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function StatsStrip({ tiles }: { tiles: StatTileDef[] }) {
  return (
    <div className="stats-strip" aria-label="Summary statistics for the current filters">
      {tiles.map((t, i) => (
        <div className="stat-tile" key={i}>
          <div className="v">{t.value}</div>
          <div className="l">{t.label}</div>
        </div>
      ))}
    </div>
  )
}

export function MapLegend({ lens }: { lens: LensDef }) {
  return (
    <div className="map-legend">
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{lens.legend}</div>
      {lens.id === 'overview' || lens.id === 'planning' ? (
        STATUS_GROUPS.map((g) => {
          const meta = STATUS_GROUP_META[g]
          return (
            <div className="row" key={g}>
              <span className="dot" style={{ background: `light-dark(${meta.color}, ${meta.colorDark})` }} />
              {meta.label}
            </div>
          )
        })
      ) : (
        <div className="row">
          <span className="dot" style={{ background: '#898781' }} />
          grey = no figure located
        </div>
      )}
    </div>
  )
}
