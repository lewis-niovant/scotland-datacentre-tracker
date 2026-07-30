import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LensId, ProjectRecord } from '../types'
import { boundaryFeatures, extentCounts } from '../lib/geometry'
import { developersOf, statusGroup, useDataset } from '../lib/data'
import { lensById } from '../lib/lenses'
import MapView, { SCOTLAND_BOUNDS } from '../components/MapView'
import ProjectSheet from '../components/ProjectSheet'
import GuidedTour, { introDismissed, type TourState } from '../components/GuidedTour'
import ObjectionMarkers from '../components/ObjectionMarkers'
import type { Map as MapLibreMap } from 'maplibre-gl'
import {
  EMPTY_FILTERS, FilterChips, LensSwitcher, MapLegend, StatsStrip, type Filters,
} from '../components/Filters'

/* Focus mode: get close to one site and the map stops being a national dashboard
   and becomes that site's close-up — satellite imagery, pitch grid and 3D switch
   themselves on, the filter chrome stands down, and zooming back out hands
   everything back exactly as it was. Enter and exit thresholds differ so the
   mode cannot flap at the boundary. */
const FOCUS_ENTER_ZOOM = 12.6
const FOCUS_EXIT_ZOOM = 11.3
/** Zoom from which the satellite toggle offers itself — imagery is context for
    a place, not a way to look at all of Scotland. */
const SAT_BTN_ZOOM = 11

export default function MapPage() {
  const ds = useDataset()
  const [searchParams] = useSearchParams()
  const deepLinkSlug = searchParams.get('site')
  const [lensId, setLensId] = useState<LensId>('overview')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<string | null>(null)
  const [threeD, setThreeD] = useState(false)
  const [satellite, setSatellite] = useState(false)
  const [showPitches, setShowPitches] = useState(false)
  /* Arriving on a shared link to one site should land on that site, not on the
     national tour. The tour stays a click away behind the ? button. */
  const [showIntro, setShowIntro] = useState(() => !introDismissed() && !deepLinkSlug)
  const [massCount, setMassCount] = useState(0)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [tourOpenObjections, setTourOpenObjections] = useState<string | null>(null)
  const [zoom, setZoom] = useState(5)
  const [focus, setFocus] = useState<string | null>(null)
  const preFocusRef = useRef<{ threeD: boolean; satellite: boolean; showPitches: boolean } | null>(null)

  /* While the tour is flying, the map must not also auto-fit to the filter
     changes the tour itself is making — the two cameras fight and the flight
     stutters. The same goes for focus mode: the tour owns the map. */
  const tourRunning = showIntro

  const lens = lensById(lensId)
  const all = ds.observatory.projects
  const pitchM2 = ds.observatory.constants?.comparisons?.football_pitch_m2?.value ?? 7140
  const extents = useMemo(() => extentCounts(ds.geo, all.length), [ds.geo, all.length])

  /* Groups with at least one project anywhere — chips for the rest are dropped. */
  const presentGroups = useMemo(
    () => new Set(all.map((p) => statusGroup(p.project.status))),
    [all],
  )

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

  const boundarySlugs = useMemo(
    () => new Set(boundaryFeatures(ds.geo).map((f) => f.properties.slug ?? '')),
    [ds.geo],
  )

  /* ---------- focus mode ---------- */

  const enterFocus = (slug: string) => {
    setFocus((cur) => {
      if (cur === slug) return cur
      if (cur == null) {
        preFocusRef.current = { threeD, satellite, showPitches }
      }
      return slug
    })
    setThreeD(true)
    setSatellite(true)
    setShowPitches(true)
  }

  const exitFocus = () => {
    setFocus(null)
    const prev = preFocusRef.current
    preFocusRef.current = null
    if (prev) {
      setThreeD(prev.threeD)
      setSatellite(prev.satellite)
      setShowPitches(prev.showPitches)
    }
  }

  /* Handlers live in refs so the single moveend listener never goes stale. */
  const focusTickRef = useRef<() => void>(() => {})
  focusTickRef.current = () => {
    if (!map || tourRunning) return
    const z = map.getZoom()
    setZoom(z)
    if (focus != null) {
      if (z < FOCUS_EXIT_ZOOM) exitFocus()
      return
    }
    if (z < FOCUS_ENTER_ZOOM) return
    /* Zoomed right in with exactly one site on screen: that site is the story. */
    const bounds = map.getBounds()
    const visible = filtered.filter((p) => {
      const dp = p.site?.display_point
      const c: [number, number] | null = Array.isArray(dp) && typeof dp[0] === 'number'
        ? [dp[0], dp[1] as number]
        : (typeof p.site?.longitude === 'number' && typeof p.site?.latitude === 'number'
          ? [p.site.longitude, p.site.latitude] : null)
      return !!c && bounds.contains(c)
    })
    if (visible.length === 1) enterFocus(visible[0].project.slug)
  }

  useEffect(() => {
    if (!map) return
    const tick = () => focusTickRef.current()
    map.on('moveend', tick)
    tick()
    return () => { map.off('moveend', tick) }
  }, [map])

  /* Leave focus deliberately: back out to the national picture. Focus state is
     NOT cleared here — restoring 3D/satellite immediately would fire a competing
     camera ease that cancels this flight. The moveend handler exits focus (and
     restores the pre-focus toggles) once the camera has actually left. */
  const leaveFocus = () => {
    setSelected(null)
    map?.fitBounds(SCOTLAND_BOUNDS, { padding: 24, duration: 1100 })
  }

  const onSelectProject = (slug: string | null) => {
    setSelected(slug)
    if (slug) enterFocus(slug)
  }

  /* ---------- deep link: /#/?site=slug lands focused on that site ---------- */
  const deepLinkedRef = useRef(false)
  useEffect(() => {
    if (deepLinkedRef.current || !deepLinkSlug) return
    if (!all.some((p) => p.project.slug === deepLinkSlug)) return
    deepLinkedRef.current = true
    onSelectProject(deepLinkSlug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkSlug, all, map])

  /* ---------- tour ---------- */

  /* The tour drives the same controls the user has, so nothing it sets is state
     they cannot immediately change once it ends. */
  const applyTourState = (t: TourState) => {
    setFilters({ ...EMPTY_FILTERS, groups: t.groups })
    setShowPitches(t.showPitches)
    setThreeD(t.threeD)
    setTourOpenObjections(t.openObjections ?? null)
    setSelected(null)
  }

  const startTour = () => {
    /* No restore on exit here: the tour scripts its own state from beat one. */
    setFocus(null)
    preFocusRef.current = null
    setSelected(null)
    setSatellite(false)
    setShowIntro(true)
  }

  const selectedProject = filtered.find((p) => p.project.slug === selected)
    ?? all.find((p) => p.project.slug === selected) ?? null
  const focusProject = focus ? all.find((p) => p.project.slug === focus) ?? null : null
  const tiles = useMemo(() => lens.stats(filtered), [lens, filtered])

  return (
    <div className={`map-page${selectedProject ? ' has-panel' : ''}${focusProject ? ' focus-mode' : ''}`}>
      <div className="map-wrap">
        <MapView
          projects={filtered}
          lens={lens}
          geo={ds.geo}
          selectedSlug={selected}
          onSelect={onSelectProject}
          threeD={threeD}
          satellite={satellite}
          showPitches={showPitches}
          pitchM2={pitchM2}
          onMassCount={setMassCount}
          onMapReady={setMap}
          suppressAutoFit={tourRunning}
        />
        <ObjectionMarkers
          map={map}
          ready={!!map}
          projects={filtered}
          sources={ds.observatory.sources ?? {}}
          openFor={tourOpenObjections}
        />
        <div className="map-topbar">
          {focusProject ? (
            <div className="focus-bar">
              <button className="focus-back" onClick={leaveFocus}>‹ All of Scotland</button>
              <div className="focus-name">
                <strong>{focusProject.project.display_name ?? focusProject.project.canonical_name}</strong>
                <span>close-up view — imagery, pitches &amp; 3D on</span>
              </div>
            </div>
          ) : (
            <>
              <StatsStrip tiles={tiles} shown={filtered.length} total={all.length} />
              <LensSwitcher lens={lensId} onChange={setLensId} />
              <FilterChips
                filters={filters}
                onChange={(f) => { setFilters(applyFilters(f)); setSelected(null) }}
                developers={developers}
                authorities={authorities}
                availableGroups={availableGroups}
                presentGroups={presentGroups}
              />
              <p className="map-note">
                Zoom in for site extents — <strong>{extents.official} official red-line
                boundaries</strong>, {extents.osm + extents.tier2 + extents.tier3} others. Tap any
                shape to see what it is; get close to a single site for its full close-up.
              </p>
            </>
          )}
        </div>
        {threeD && (
          <p className="map-hint">
            {massCount > 0 ? (
              <>
                <strong>Indicative massing — {massCount} of {filtered.length} shown projects
                publish a height.</strong> Height is sourced. Where a footprint is published the
                block uses it; where it is not, a nominal 120 m block carries the height and is
                drawn in grey.{satellite && (
                  <> Surrounding buildings (matte grey) are OpenStreetMap-surveyed heights, for
                  scale.</>
                )} Layouts are illustrative throughout.
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
        {!showIntro && !focusProject && <MapLegend
          lens={lens}
          showPitches={showPitches}
          pitchM2={pitchM2}
          geo={ds.geo}
          totalProjects={all.length}
          presentGroups={presentGroups}
        />}
        <div className="map-controls">
          <button
            className="map-btn"
            aria-pressed={threeD}
            onClick={() => setThreeD((v) => !v)}
            title="Tilt the map and stand published building heights up in 3D"
          >
            3D
          </button>
          {(zoom >= SAT_BTN_ZOOM || satellite) && (
            <button
              className="map-btn"
              aria-pressed={satellite}
              onClick={() => setSatellite((v) => !v)}
              title="Satellite imagery (Esri World Imagery) with terrain"
            >
              Sat
            </button>
          )}
          <button
            className="map-btn tour-btn"
            onClick={startTour}
            title="Replay the guided tour"
          >
            ?
            <span className="sr-only">Replay the guided tour</span>
          </button>
        </div>
        {selectedProject && (
          <ProjectSheet
            key={selectedProject.project.slug}
            p={selectedProject}
            onClose={() => setSelected(null)}
          />
        )}
        {showIntro && (
          <GuidedTour
            projects={all}
            boundarySlugs={boundarySlugs}
            map={map}
            onState={applyTourState}
            onDone={() => { setShowIntro(false); setTourOpenObjections(null) }}
          />
        )}
      </div>
    </div>
  )
}
