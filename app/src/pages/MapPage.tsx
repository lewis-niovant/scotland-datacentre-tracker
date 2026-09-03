import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { LensId, ProjectRecord } from '../types'
import { boundaryFeatures, extentCounts } from '../lib/geometry'
import { developersOf, projectCoords, statusGroup, statusLabel, useDataset } from '../lib/data'
import { EMPTY_FILTERS, type Filters } from '../lib/filterState'
import { buildScript, introDismissed, type TourState } from '../lib/guidedTour'
import { lensById } from '../lib/lenses'
import { SCOTLAND_BOUNDS } from '../lib/mapPresentation'
import MapView from '../components/MapView'
import ProjectSheet from '../components/ProjectSheet'
import GuidedTour from '../components/GuidedTour'
import ObjectionMarkers from '../components/ObjectionMarkers'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { FilterChips, LensSwitcher, MapLegend, StatsStrip } from '../components/Filters'
import { onAgentAction, registerDashboard, type DashboardHandlers } from '../voice/commandBus'
import { useVoiceGuide } from '../voice/useVoiceGuide'
import VoiceDock from '../voice/VoiceDock'
import StageOverlay from '../voice/StageOverlay'
import { clearFx, drawOnMap, revealSite, startContinuousOrbit, stopContinuousOrbit } from '../voice/mapFx'
import { trace } from '../voice/trace'

/* Focus mode: get close to one site and the map stops being a national dashboard
   and becomes that site's close-up — pitch grid and 3D switch themselves on, the
   filter chrome stands down, and zooming back out hands everything back exactly
   as it was. Enter and exit thresholds differ so the mode cannot flap at the
   boundary.

   The enter threshold is deliberately below the zoom at which a site fills the
   screen: waiting until then meant the snap often never fired at all, which read
   as the feature being broken rather than subtle. */
const FOCUS_ENTER_ZOOM = 11.6
const FOCUS_EXIT_ZOOM = 10.6

function distSq(a: [number, number], b: [number, number]): number {
  /* Longitude degrees are shorter than latitude ones this far north; without the
     correction "nearest" skews east–west. cos(57°) ≈ 0.54. */
  const dx = (a[0] - b[0]) * 0.54
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

export default function MapPage() {
  const ds = useDataset()
  const [searchParams] = useSearchParams()
  const deepLinkSlug = searchParams.get('site')
  const [lensId, setLensId] = useState<LensId>('overview')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<string | null>(null)
  const [threeD, setThreeD] = useState(false)
  /* Imagery is the default view: the sites are fields, industrial estates and
     edge-of-town parcels, and the cartographic style renders most of them as
     blank space. The toggle back to it is always available. */
  const [satellite, setSatellite] = useState(true)
  const [showPitches, setShowPitches] = useState(false)
  /* Arriving on a shared link to one site should land on that site, not on the
     national tour. The tour stays a click away behind the ? button. */
  const [showIntro, setShowIntro] = useState(() => !introDismissed() && !deepLinkSlug)
  const [massCount, setMassCount] = useState(0)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [tourOpenObjections, setTourOpenObjections] = useState<string | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const preFocusRef = useRef<{ threeD: boolean; showPitches: boolean } | null>(null)

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

  /* Focus deliberately does NOT touch the basemap. Imagery is already the
     default, and someone who has switched to the plain map has made a choice
     that zooming in should not silently undo. */
  const enterFocus = (slug: string) => {
    setFocus((cur) => {
      if (cur === slug) return cur
      if (cur == null) preFocusRef.current = { threeD, showPitches }
      return slug
    })
    setThreeD(true)
    setShowPitches(true)
  }

  const exitFocus = () => {
    setFocus(null)
    const prev = preFocusRef.current
    preFocusRef.current = null
    if (prev) {
      setThreeD(prev.threeD)
      setShowPitches(prev.showPitches)
    }
  }

  /* Handlers live in refs so the single moveend listener never goes stale. */
  const focusTickRef = useRef<() => void>(() => {})
  focusTickRef.current = () => {
    if (!map || tourRunning || voiceFlyingRef.current) return
    const z = map.getZoom()
    if (focus != null) {
      if (z < FOCUS_EXIT_ZOOM) exitFocus()
      return
    }
    if (z < FOCUS_ENTER_ZOOM) return
    /* Close in on the map and whichever site you have centred is the one you are
       looking at. Requiring exactly one site in the viewport meant two adjacent
       sites — or one site plus a sliver of its neighbour — silently blocked the
       snap forever. Nearest-to-centre always resolves. */
    const bounds = map.getBounds()
    const c = map.getCenter()
    const centre: [number, number] = [c.lng, c.lat]
    let best: { slug: string; d: number } | null = null
    for (const p of filtered) {
      const coords = projectCoords(p)
      if (!coords || !bounds.contains(coords)) continue
      const d = distSq(coords, centre)
      if (!best || d < best.d) best = { slug: p.project.slug, d }
    }
    if (best) enterFocus(best.slug)
  }

  /* 3D from the national view tilted an empty map: the extrusion layers only
     draw from zoom 10.5, and the surrounding buildings from 13, so the button
     genuinely did nothing until you had already zoomed in. Rather than disable
     it, let it take you somewhere it means something. */
  const heightSites = useMemo(
    () => filtered.filter((p) => typeof p.site?.max_building_height_m?.value === 'number'),
    [filtered],
  )

  const toggle3D = () => {
    if (threeD || !map) { setThreeD((v) => !v); return }
    setThreeD(true)
    if (map.getZoom() >= FOCUS_ENTER_ZOOM) return
    /* Fly to a site that actually publishes a height — nearest to where they are
       already looking, so the jump is explicable rather than arbitrary. */
    const c = map.getCenter()
    const centre: [number, number] = [c.lng, c.lat]
    let best: { p: ProjectRecord; coords: [number, number]; d: number } | null = null
    for (const p of heightSites) {
      const coords = projectCoords(p)
      if (!coords) continue
      const d = distSq(coords, centre)
      if (!best || d < best.d) best = { p, coords, d }
    }
    if (!best) return
    enterFocus(best.p.project.slug)
    setSelected(best.p.project.slug)
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

  /* ---------- deep link: /#/map?site=slug lands focused on that site ---------- */
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
    /* No restore on exit here: the tour scripts its own state from beat one.
       The basemap is left alone — the tour reads fine over imagery. */
    setFocus(null)
    preFocusRef.current = null
    setSelected(null)
    setShowIntro(true)
  }

  /* ---------- voice guide ---------- */

  const navigate = useNavigate()
  const voice = useVoiceGuide(ds)
  const voiceLive = voice.status === 'live'

  /* Voice camera direction: a two-beat cinematic flight instead of the UI's
     single fast ease. Beat one arcs to the site flat and wide, so imagery and
     boundary layers stream in during the approach; beat two tilts and pushes
     in slowly once everything is on screen. While a flight is running the
     voice guide owns the camera (suppressAutoFit) and focus-snap stands down. */
  const [voiceFlying, setVoiceFlying] = useState(false)
  const voiceFlyingRef = useRef(false)
  const flightIdRef = useRef(0)
  const setFlying = (v: boolean) => { voiceFlyingRef.current = v; setVoiceFlying(v) }

  const voiceFlyToSite = (slug: string, opts?: { thenOrbit?: boolean }) => {
    clearFx()
    setTourOpenObjections(null)
    if (!filtered.some((x) => x.project.slug === slug)) setFilters(EMPTY_FILTERS)
    const p = all.find((x) => x.project.slug === slug)
    const coords = p && projectCoords(p)
    if (!map || !coords) { onSelectProject(slug); return }
    const id = ++flightIdRef.current
    setFlying(true)
    setSelected(slug)
    map.stop()
    trace('camera', 'fly_start', slug)
    /* Beat 1 — the approach. Wide arc, flat pitch, unhurried. */
    map.flyTo({ center: coords, zoom: 11.9, pitch: 0, bearing: 0, speed: 0.62, curve: 1.5, essential: false })
    map.once('moveend', () => {
      if (flightIdRef.current !== id) return
      /* Beat 2 — the push-in. 3D and pitch grid switch on now, so the
         extrusions grow while the camera tilts rather than popping mid-zoom. */
      enterFocus(slug)
      map.easeTo({
        center: coords, zoom: 13.35, pitch: 55, bearing: -14,
        duration: 3200, easing: (t) => 1 - Math.pow(1 - t, 3),
      })
      map.once('moveend', () => {
        if (flightIdRef.current !== id) return
        setFlying(false)
        trace('camera', 'fly_landed', { slug, zoom: Math.round(map.getZoom() * 10) / 10 })
        /* A site under discussion keeps turning, so the depth of the 3D view
           reads without anyone having to drag the map. */
        if (opts?.thenOrbit !== false) startContinuousOrbit(map, 26, 16000)
      })
    })
  }

  const voiceShowScotland = () => {
    stopContinuousOrbit()
    clearFx()
    setTourOpenObjections(null)
    setSelected(null)
    exitFocus()
    if (!map) { return }
    const id = ++flightIdRef.current
    setFlying(true)
    map.stop()
    const cam = map.cameraForBounds(SCOTLAND_BOUNDS, { padding: 24 })
    map.flyTo({
      center: (cam?.center as [number, number] | undefined) ?? [-4.1, 57.3],
      zoom: cam?.zoom ?? 6.4,
      pitch: 0, bearing: 0, speed: 0.9, curve: 1.4, essential: false,
    })
    map.once('moveend', () => { if (flightIdRef.current === id) setFlying(false) })
  }

  /* Stage mode: while the guide is live the whole app chrome stands down —
     header and bottom nav included, which live outside this page. */
  useEffect(() => {
    document.body.classList.toggle('voice-stage', voiceLive)
    return () => { document.body.classList.remove('voice-stage') }
  }, [voiceLive])

  /* Asking the guide takes over from the scripted overlay tour: close it the
     moment a session starts, so two directors never fight over the camera. */
  useEffect(() => {
    if (voice.status === 'connecting' || voice.status === 'live') {
      setShowIntro(false)
      setTourOpenObjections(null)
    }
  }, [voice.status])

  /* The tour beats, voice-narrated: same script, no overlay. */
  const tourBeats = useMemo(() => buildScript(all, boundarySlugs), [all, boundarySlugs])
  const runTourBeat = (i: number) => {
    if (i < 0 || i >= tourBeats.length) return null
    const b = tourBeats[i]
    clearFx()
    setShowIntro(false)
    setSelected(null)
    setFocus(null)
    applyTourState(b.state)
    if (map) {
      const id = ++flightIdRef.current
      setFlying(true)
      map.stop()
      const cam = b.state.camera
      if (cam.national || !cam.center) {
        const c = map.cameraForBounds(SCOTLAND_BOUNDS, { padding: 24 })
        map.flyTo({
          center: (c?.center as [number, number] | undefined) ?? [-4.1, 57.3],
          zoom: c?.zoom ?? 6.4, pitch: 0, bearing: 0, speed: 0.7, curve: 1.4, essential: false,
        })
      } else {
        map.flyTo({
          center: cam.center, zoom: cam.zoom ?? 12,
          pitch: cam.pitch ?? (b.state.threeD ? 55 : 0), bearing: 0,
          speed: 0.7, curve: 1.5, essential: false,
        })
      }
      map.once('moveend', () => { if (flightIdRef.current === id) setFlying(false) })
    }
    return { kicker: b.kicker, title: b.title, body: b.body, index: i, total: tourBeats.length }
  }
  /* While the guide is live the chrome stands down; anything the agent touches
     surfaces again for a few seconds so the user sees the change land. */
  const [surfaced, setSurfaced] = useState(false)
  const surfaceTimer = useRef<number | undefined>(undefined)

  /* Handlers live in a ref (same pattern as focusTickRef) so the bus never
     sees stale state, while the registration itself happens exactly once. */
  const voiceHandlersRef = useRef<DashboardHandlers>(null!)
  voiceHandlersRef.current = {
    setLens: (id) => setLensId(id),
    setFilters: (next) => { setFilters(applyFilters({ ...filters, ...next })); setSelected(null) },
    clearFilters: () => setFilters(EMPTY_FILTERS),
    flyToSite: voiceFlyToSite,
    showScotland: voiceShowScotland,
    setLayer: (layer, on) => {
      if (layer === 'satellite') setSatellite(on)
      else if (layer === 'pitches') setShowPitches(on)
      else if (on !== threeD) toggle3D()
    },
    openObjections: (slug) => setTourOpenObjections(slug),
    openProfile: (slug) => navigate(`/project/${slug}`),
    cancelFlight: () => {
      /* Abandon the flight, but KEEP the camera suppressed: dropping the flag
         here lets MapView's own pitch/auto-fit effects fire an ease that
         cancels whatever camera move is replacing this one. Hold it for the
         length of a reframe, then hand the camera back. */
      flightIdRef.current += 1
      stopContinuousOrbit()
      map?.stop()
      setFlying(true)
      window.setTimeout(() => setFlying(false), 3000)
    },
    startTour,
    runTourBeat,
    getMap: () => map,
    getState: () => ({
      lens: lensId,
      filters,
      selectedSlug: selected,
      focusSlug: focus,
      satellite,
      threeD,
      showPitches,
      tourRunning,
      visibleSlugs: filtered.map((p) => p.project.slug),
      camera: map ? { center: [map.getCenter().lng, map.getCenter().lat], zoom: map.getZoom() } : null,
    }),
  }

  useEffect(() => registerDashboard(() => voiceHandlersRef.current), [])

  /* Dev-only: drive the cinematic reveal without a live session (Playwright). */
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __sdoReveal?: (slug: string, delayMs?: number) => unknown }).__sdoReveal =
      (slug: string, delayMs = 0) => {
        if (!map) return { error: 'no map' }
        return revealSite(map, ds, slug, { setPitches: setShowPitches, delayMs })
      }
    ;(window as unknown as { __sdoDraw?: (slugs: string[]) => unknown }).__sdoDraw = (slugs: string[]) => {
      if (!map) return { error: 'no map' }
      const pts = slugs
        .map((s) => all.find((p) => p.project.slug === s))
        .map((p) => p && projectCoords(p))
        .filter((c): c is [number, number] => !!c)
      if (pts.length < 2) return { error: 'need two placeable sites' }
      return drawOnMap(map, { links: pts.slice(0, -1).map((c, i) => ({ from: c, to: pts[i + 1] })) })
    }
  }, [map, ds, all])
  useEffect(() => onAgentAction(() => {
    setSurfaced(true)
    window.clearTimeout(surfaceTimer.current)
    surfaceTimer.current = window.setTimeout(() => setSurfaced(false), 7000)
  }), [])

  const selectedProject = filtered.find((p) => p.project.slug === selected)
    ?? all.find((p) => p.project.slug === selected) ?? null
  const focusProject = focus ? all.find((p) => p.project.slug === focus) ?? null : null
  const tiles = useMemo(() => lens.stats(filtered), [lens, filtered])

  return (
    <div className={`map-page${selectedProject ? ' has-panel' : ''}${focusProject ? ' focus-mode' : ''}${voiceLive ? ' voice-live' : ''}${surfaced ? ' voice-surfaced' : ''}`}>
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
          suppressAutoFit={tourRunning || voiceFlying}
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
                <span>close-up view — scale &amp; height on</span>
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
                boundaries</strong>, {extents.osm + extents.tier2 + extents.tier3} others. Select a
                shape with a pointer, or open the Legend for a keyboard-accessible explanation;
                get close to a single site for its full close-up.
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
          <details className="map-project-picker">
            <summary className="map-btn" title="Browse visible projects as a list">
              List
            </summary>
            <div className="map-project-menu">
              <strong>{filtered.length} visible project{filtered.length === 1 ? '' : 's'}</strong>
              <ul>
                {[...filtered]
                  .sort((a, b) => (a.project.display_name ?? a.project.canonical_name)
                    .localeCompare(b.project.display_name ?? b.project.canonical_name))
                  .map((project) => (
                    <li key={project.project.slug}>
                      <button type="button" onClick={() => onSelectProject(project.project.slug)}>
                        <span>{project.project.display_name ?? project.project.canonical_name}</span>
                        <small>{statusLabel(project.project.status)} · {project.project.local_authority}</small>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </details>
          <button
            className="map-btn"
            aria-pressed={threeD}
            onClick={toggle3D}
            title={threeD
              ? 'Return the map to flat'
              : heightSites.length > 0
                ? 'Tilt the map and stand published building heights up in 3D'
                : 'No project in this selection publishes a building height'}
            disabled={!threeD && heightSites.length === 0}
          >
            3D
          </button>
          <button
            className="map-btn"
            aria-pressed={satellite}
            onClick={() => setSatellite((v) => !v)}
            title={satellite
              ? 'Switch to the plain map'
              : 'Switch to satellite imagery (Esri World Imagery)'}
          >
            {satellite ? 'Map' : 'Sat'}
          </button>
          <button
            className="map-btn tour-btn"
            onClick={startTour}
            title="Replay the guided tour"
          >
            ?
            <span className="sr-only">Replay the guided tour</span>
          </button>
        </div>
        <VoiceDock voice={voice} />
        {voiceLive && <StageOverlay ds={ds} />}
        {/* In stage mode the agent's site cards replace the written panel. */}
        {selectedProject && !voiceLive && (
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
