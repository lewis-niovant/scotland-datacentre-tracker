import { useState } from 'react'
import type { GeoCollection, StatusGroup } from '../types'
import { STATUS_GROUPS, STATUS_GROUP_META, fmtInt } from '../lib/data'
import { extentCounts } from '../lib/geometry'
import { BOUNDARY_MIN_ZOOM, PITCH_MIN_ZOOM } from './MapView'
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
  filters, onChange, developers, authorities, availableGroups, presentGroups,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  developers: string[]
  authorities: string[]
  /** Status groups still reachable under the other active filters. */
  availableGroups: Set<StatusGroup>
  /** Status groups with at least one project anywhere in the dataset. A chip
      that can never match anything is dropped outright — a control that does
      nothing is clutter, not information. */
  presentGroups: Set<StatusGroup>
}) {
  const toggleGroup = (g: StatusGroup) => {
    const groups = filters.groups.includes(g)
      ? filters.groups.filter((x) => x !== g)
      : [...filters.groups, g]
    onChange({ ...filters, groups })
  }
  return (
    <div className="chip-row" role="toolbar" aria-label="Filters">
      {STATUS_GROUPS.filter((g) => presentGroups.has(g)).map((g) => {
        const meta = STATUS_GROUP_META[g]
        const on = filters.groups.includes(g)
        /* An unreachable group stays visible but inert — the absence is itself
           information. An already-selected chip is never disabled, or it could
           not be switched off. */
        const dead = !on && !availableGroups.has(g)
        return (
          <button
            key={g}
            className={`chip${dead ? ' unavailable' : ''}`}
            aria-pressed={on}
            disabled={dead}
            title={dead ? `No ${meta.label.toLowerCase()} projects under the current filters` : undefined}
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

export function StatsStrip({ tiles, shown, total }: { tiles: StatTileDef[]; shown: number; total: number }) {
  return (
    <div className="stats-strip" aria-label="Summary statistics for the current filters">
      <div className={`stat-tile count-tile${shown < total ? ' filtered' : ''}`}>
        <div className="v">{shown} of {total}</div>
        <div className="l">{shown < total ? 'projects shown (filtered)' : 'projects shown'}</div>
      </div>
      {tiles.map((t, i) => (
        <div className="stat-tile" key={i}>
          <div className="v">{t.value}</div>
          <div className="l">{t.label}</div>
        </div>
      ))}
    </div>
  )
}

const SEQ_LEGEND = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b']

export function MapLegend({ lens, showPitches, pitchM2, geo, totalProjects, presentGroups }: {
  lens: LensDef
  showPitches: boolean
  pitchM2: number
  geo: GeoCollection
  totalProjects: number
  /** Same rule as the chips: only explain colours the map can actually show. */
  presentGroups: Set<StatusGroup>
}) {
  const counts = extentCounts(geo, totalProjects)
  /* Collapsed by default on small screens so the map stays clear. */
  const [open, setOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 800px)').matches : true,
  )
  return (
    <div className={`map-legend${open ? ' open' : ''}`}>
      <button
        className="legend-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="4.2" cy="4.5" r="2" fill="currentColor" opacity="0.85" />
          <circle cx="4.2" cy="11.5" r="2" fill="currentColor" opacity="0.45" />
          <path d="M8.5 4.5h4.5M8.5 11.5h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Legend
        <span className="caret" aria-hidden="true">{open ? '▾' : '▴'}</span>
      </button>
      {open && (
        <div className="legend-body">
          <div className="legend-title">{lens.legend}</div>
          {lens.id === 'overview' || lens.id === 'planning' ? (
            STATUS_GROUPS.filter((g) => presentGroups.has(g)).map((g) => {
              const meta = STATUS_GROUP_META[g]
              return (
                <div className="row" key={g}>
                  <span className="dot" style={{ background: `light-dark(${meta.color}, ${meta.colorDark})` }} />
                  {meta.label}
                </div>
              )
            })
          ) : (
            <>
              <div className="legend-ramp" aria-hidden="true">
                {SEQ_LEGEND.map((c) => <span key={c} style={{ background: c }} />)}
              </div>
              <div className="row small-note">low → high (marker size too)</div>
              <div className="row">
                <span className="dot" style={{ background: '#898781' }} />
                no figure located
              </div>
            </>
          )}
          <div className="row cluster-note">
            <span className="cluster-key" aria-hidden="true">
              <svg viewBox="0 0 34 34">
                <circle cx="17" cy="17" r="13" className="ck-plate" />
                <circle cx="17" cy="17" r="13" className="ck-a" />
                <circle cx="17" cy="17" r="13" className="ck-b" />
              </svg>
            </span>
            <span>
              Bubbles show the <strong>{lens.aggregateLabel}</strong> with the number of sites;
              the ring shows {lens.id === 'overview' || lens.id === 'planning'
                ? 'the status mix'
                : 'how many of them have a published figure'}. Tap to zoom in.
            </span>
          </div>
          <div className="legend-title extent-head">
            Site extents <span className="small-note">(from zoom {BOUNDARY_MIN_ZOOM}; tap any shape for its explanation)</span>
          </div>
          <div className="row boundary-note">
            <span className="extent-key t1" aria-hidden="true" />
            <span>
              <strong>Solid red — official planning boundary.</strong> The red line submitted with
              the application, from Spatial Hub Scotland (OGL v3).{' '}
              <em>{counts.official} project{counts.official === 1 ? '' : 's'}.</em>
            </span>
          </div>
          {counts.osm > 0 && (
            <div className="row boundary-note">
              <span className="extent-key t4" aria-hidden="true" />
              <span>
                <strong>Solid teal — built footprint, not a planning boundary.</strong> The
                buildings that actually stand on the site, surveyed by OpenStreetMap
                contributors. Used where a facility predates the online planning portal, so no
                red line exists for it. © OpenStreetMap contributors, ODbL.{' '}
                <em>{counts.osm} project{counts.osm === 1 ? '' : 's'}.</em>
              </span>
            </div>
          )}
          <div className="row boundary-note">
            <span className="extent-key t2" aria-hidden="true" />
            <span>
              <strong>Dashed — projected size, not a planning boundary.</strong> A square of the
              site’s stated area centred on the recorded location. The area is sourced; the shape,
              orientation and exact parcel are not.{' '}
              <em>{counts.tier2} project{counts.tier2 === 1 ? '' : 's'}.</em>
            </span>
          </div>
          <div className="row boundary-note">
            <span className="extent-key t3" aria-hidden="true" />
            <span>
              <strong>Dotted, unfilled — projected size, approximate location.</strong> As above,
              but the location is known only to settlement level, so this shows how big the site
              would be, not precisely where. The dot marks the only point we hold.{' '}
              <em>{counts.tier3} project{counts.tier3 === 1 ? '' : 's'}.</em>
            </span>
          </div>
          <div className="row small-note extent-none">
            {counts.none} project{counts.none === 1 ? '' : 's'}: no published area, no extent shown.
          </div>
          {showPitches && (
            <div className="row pitch-note-row">
              <span className="pitch-key" aria-hidden="true" />
              <span>
                Thin green grid = derived {fmtInt(pitchM2)} m² football pitches inside official
                boundaries <em>and</em> projected extents (drawn by us, layout illustrative).
                Appears from zoom {PITCH_MIN_ZOOM}.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
