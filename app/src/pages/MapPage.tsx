import { useMemo, useState } from 'react'
import type { LensId } from '../types'
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
  const [showIntro, setShowIntro] = useState(() => !introDismissed())

  const lens = lensById(lensId)
  const all = ds.observatory.projects

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
        />
        <div className="map-topbar">
          <StatsStrip tiles={tiles} />
          <LensSwitcher lens={lensId} onChange={setLensId} />
          <FilterChips
            filters={filters}
            onChange={(f) => { setFilters(f); setSelected(null) }}
            developers={developers}
            authorities={authorities}
          />
        </div>
        <MapLegend lens={lens} />
        <div className="map-controls">
          <button
            className="map-btn"
            aria-pressed={threeD}
            onClick={() => setThreeD((v) => !v)}
            title="Tilt the map and show building volumes where footprints are published"
          >
            3D
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
