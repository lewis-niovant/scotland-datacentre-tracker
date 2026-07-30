import { useMemo, useState } from 'react'
import type { LensId, ProjectRecord } from '../types'
import { extentCounts } from '../lib/geometry'
import { developersOf, statusGroup, useDataset } from '../lib/data'
import { lensById } from '../lib/lenses'
import MapView from '../components/MapView'
import ProjectSheet from '../components/ProjectSheet'
import IntroOverlay, { introDismissed } from '../components/IntroOverlay'
import {
  EMPTY_FILTERS, FilterChips, LensSwitcher, MapLegend, StatsStrip, type Filters,
} from '../components/Filters'

export default function MapPage() {
  const ds = useDataset()
  const [lensId, setLensId] = useState<LensId>('overview')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<string | null>(null)
  const [threeD, setThreeD] = useState(false)
  const [showPitches, setShowPitches] = useState(false)
  const [showIntro, setShowIntro] = useState(() => !introDismissed())
  const [massCount, setMassCount] = useState(0)

  const lens = lensById(lensId)
  const all = ds.observatory.projects
  const pitchM2 = ds.observatory.constants?.comparisons?.football_pitch_m2?.value ?? 7140
  const extents = useMemo(() => extentCounts(ds.geo, all.length), [ds.geo, all.length])

  /* One predicate per filter dimension, so each dimension's option list can be
     built from the projects surviving *the other* dimensions. That is what makes
     the filters interact: pick City of Edinburgh and the developer list narrows
     to developers that actually have a site there, rather than offering choices
     that lead to an empty map. */
  const matches = useMemo(() => ({
    groups: (p: ProjectRecord) =>
      !filters.groups.length || filters.groups.includes(statusGroup(p.project.status)),
    developer: (p: ProjectRecord) =>
      !filters.developer || developersOf(p).includes(filters.developer),
    authority: (p: ProjectRecord) =>
      !filters.authority || p.project.local_authority === filters.authority,
  }), [filters])

  /** Everything passing every dimension except `except`. */
  const exceptFor = useMemo(() => {
    const keys = ['groups', 'developer', 'authority'] as const
    return (except: (typeof keys)[number]) =>
      all.filter((p) => keys.every((k) => k === except || matches[k](p)))
  }, [all, matches])

  const developers = useMemo(
    () => [...new Set(exceptFor('developer').flatMap(developersOf))].sort(),
    [exceptFor],
  )
  const authorities = useMemo(
    () => [...new Set(exceptFor('authority').map((p) => p.project.local_authority).filter(Boolean))].sort(),
    [exceptFor],
  )
  /* Status chips stay visible but go dim-and-disabled when nothing would match,
     so the map still shows what the dataset does and does not contain. */
  const availableGroups = useMemo(
    () => new Set(exceptFor('groups').map((p) => statusGroup(p.project.status))),
    [exceptFor],
  )

  const filtered = useMemo(
    () => all.filter((p) => matches.groups(p) && matches.developer(p) && matches.authority(p)),
    [all, matches],
  )

  /* Narrowing one dimension can strand a choice made in another — pick a council
     that the previously-selected developer does not build in and the map would go
     blank with both chips still lit. Drop the stranded choice instead. */
  const applyFilters = (next: Filters): Filters => {
    const ok = (f: Filters) =>
      all.some((p) =>
        (!f.groups.length || f.groups.includes(statusGroup(p.project.status)))
        && (!f.developer || developersOf(p).includes(f.developer))
        && (!f.authority || p.project.local_authority === f.authority))
    if (ok(next)) return next
    if (next.developer && next.developer !== filters.developer) return { ...next, authority: '' }
    if (next.authority && next.authority !== filters.authority) return { ...next, developer: '' }
    return next
  }

  const selectedProject = filtered.find((p) => p.project.slug === selected) ?? null
  const tiles = useMemo(() => lens.stats(filtered), [lens, filtered])

  return (
    <div className={`map-page${selectedProject ? ' has-panel' : ''}`}>
      <div className="map-wrap">
        <MapView
          projects={filtered}
          lens={lens}
          geo={ds.geo}
          selectedSlug={selected}
          onSelect={setSelected}
          threeD={threeD}
          showPitches={showPitches}
          pitchM2={pitchM2}
          onMassCount={setMassCount}
        />
        <div className="map-topbar">
          <StatsStrip tiles={tiles} shown={filtered.length} total={all.length} />
          <LensSwitcher lens={lensId} onChange={setLensId} />
          <FilterChips
            filters={filters}
            onChange={(f) => { setFilters(applyFilters(f)); setSelected(null) }}
            developers={developers}
            authorities={authorities}
            availableGroups={availableGroups}
          />
          <p className="map-note">
            Zoom in for site extents: <strong>{extents.official} official red-line boundaries</strong>,{' '}
            {extents.tier2 + extents.tier3} projected from a stated area (dashed/dotted — not
            boundaries). Tap any shape to see which it is.
          </p>
        </div>
        {threeD && (
          <p className="map-hint">
            {massCount > 0 ? (
              <>
                <strong>Indicative massing — {massCount} of {filtered.length} shown projects
                publish a height.</strong> Height is sourced. Where a footprint is published the
                block uses it; where it is not, a nominal 120 m block carries the height and is
                drawn in grey. Layouts are illustrative throughout.
              </>
            ) : (
              <><strong>No height figures in this selection.</strong> The map is tilted, but nothing
              here publishes a building height to extrude. Clear the filters to see the sites that do.</>
            )}
          </p>
        )}
        {showPitches && !threeD && (
          <p className="map-hint">
            <strong>Pitch grid on</strong> — 105 × 68 m cells inside official boundaries and
            projected extents; zoom in to see them. Comparisons can be switched off.
          </p>
        )}
        <MapLegend
          lens={lens}
          showPitches={showPitches}
          pitchM2={pitchM2}
          geo={ds.geo}
          totalProjects={all.length}
        />
        <div className="map-controls">
          <button
            className="map-btn"
            aria-pressed={threeD}
            onClick={() => setThreeD((v) => !v)}
            title="Tilt the map and show building volumes where footprints are published"
          >
            3D
          </button>
          <button
            className="map-btn"
            aria-pressed={showPitches}
            onClick={() => setShowPitches((v) => !v)}
            title={`Overlay a ${pitchM2} m² football-pitch grid inside official boundaries and projected extents (zoom in to see it)`}
          >
            <span aria-hidden="true">⬚</span>
            <span className="sr-only">Show size comparison grid</span>
          </button>
        </div>
        {selectedProject && (
          <ProjectSheet
            key={selectedProject.project.slug}
            p={selectedProject}
            onClose={() => setSelected(null)}
          />
        )}
        {showIntro && <IntroOverlay onDismiss={() => setShowIntro(false)} />}
      </div>
    </div>
  )
}
