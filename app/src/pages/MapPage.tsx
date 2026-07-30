import { useMemo, useState } from 'react'
import type { LensId } from '../types'
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

  const lens = lensById(lensId)
  const all = ds.observatory.projects
  const pitchM2 = ds.observatory.constants?.comparisons?.football_pitch_m2?.value ?? 7140
  const extents = useMemo(() => extentCounts(ds.geo, all.length), [ds.geo, all.length])

  const developers = useMemo(
    () => [...new Set(all.flatMap(developersOf))].sort(),
    [all],
  )
  const authorities = useMemo(
    () => [...new Set(all.map((p) => p.project.local_authority).filter(Boolean))].sort(),
    [all],
  )

  const filtered = useMemo(
    () =>
      all.filter((p) => {
        if (filters.groups.length && !filters.groups.includes(statusGroup(p.project.status))) return false
        if (filters.developer && !developersOf(p).includes(filters.developer)) return false
        if (filters.authority && p.project.local_authority !== filters.authority) return false
        return true
      }),
    [all, filters],
  )

  const selectedProject = filtered.find((p) => p.project.slug === selected) ?? null
  const tiles = useMemo(() => lens.stats(filtered), [lens, filtered])

  return (
    <div className="map-page">
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
        />
        <div className="map-topbar">
          <StatsStrip tiles={tiles} shown={filtered.length} total={all.length} />
          <LensSwitcher lens={lensId} onChange={setLensId} />
          <FilterChips
            filters={filters}
            onChange={(f) => { setFilters(f); setSelected(null) }}
            developers={developers}
            authorities={authorities}
          />
          <p className="map-note">
            Zoom in for site extents: <strong>{extents.official} official red-line boundaries</strong>,{' '}
            {extents.tier2 + extents.tier3} projected from a stated area (dashed/dotted — not
            boundaries). Tap any shape to see which it is.
          </p>
        </div>
        {threeD && (
          <p className="map-hint">
            <strong>Indicative massing</strong> — footprint and height are sourced; the layout is not.
            Only projects publishing both appear.
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
