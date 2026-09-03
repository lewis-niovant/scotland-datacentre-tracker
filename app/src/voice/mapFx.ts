import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Dataset } from '../lib/data'
import { fmtInt, projectCoords } from '../lib/data'
import {
  centroidOf, extentExplanation, osmFootprints, pitchesPhrase, polysOf,
  primaryBoundary, projectedExtent,
} from '../lib/geometry'
import type { GeoFeature } from '../types'
import { presentCards } from './stage'
import { nudge } from './nudge'

/* Map effects for the voice guide: the spotlight, the callout ring, the slow
   orbit, and the phased cinematic site reveal. Everything here is temporary
   theatre — layers, DOM and timers are tracked and torn down by clearFx(),
   which every new scene calls first. */

const FX_SOURCE = 'fx-extent'
const FX_LINE = 'fx-extent-line'
const FX_FILL = 'fx-extent-fill'
const FX_MASS = 'fx-extent-mass'

/** A two-storey house, for "how tall is that?" comparisons. */
const HOUSE_M = 8

interface FxScene {
  id: number
  timers: number[]
  cleanups: Array<() => void>
}
let scene: FxScene | null = null
let sceneSeq = 0

function newScene(): FxScene {
  clearFx()
  scene = { id: ++sceneSeq, timers: [], cleanups: [] }
  return scene
}

function after(s: FxScene, ms: number, fn: () => void) {
  s.timers.push(window.setTimeout(() => { if (scene === s) fn() }, ms))
}

/** Clears the current effects scene.

    Pass the id returned when the scene was created to make the clear
    conditional: a timed tidy-up ("lift this ring in 15 seconds") must not
    tear down whatever has started in the meantime. Getting this wrong left
    the guide narrating an animation that had already been deleted. */
export function clearFx(onlyScene?: number): void {
  if (onlyScene != null && scene?.id !== onlyScene) return
  stopContinuousOrbit()
  const s = scene
  scene = null
  if (!s) return
  for (const t of s.timers) window.clearTimeout(t)
  for (const c of s.cleanups.reverse()) { try { c() } catch { /* map may be gone */ } }
}

function mapAlive(map: MapLibreMap): boolean {
  try { return !!map.getContainer() && map.getStyle() != null } catch { return false }
}

function removeFxLayers(map: MapLibreMap) {
  if (!mapAlive(map)) return
  for (const id of [FX_MASS, FX_LINE, FX_FILL]) if (map.getLayer(id)) map.removeLayer(id)
  if (map.getSource(FX_SOURCE)) map.removeSource(FX_SOURCE)
}

/* ------------------------------------------------------------------ */
/* Spotlight + callout ring                                            */
/* ------------------------------------------------------------------ */

export function spotlight(
  map: MapLibreMap,
  lngLat: [number, number],
  label?: string,
  opts?: { keepScene?: boolean; dim?: boolean },
): number {
  const s = opts?.keepScene && scene ? scene : newScene()
  const container = map.getContainer()

  const shade = document.createElement('div')
  shade.className = 'fx-spotlight'
  if (opts?.dim === false) shade.classList.add('no-dim')
  const ring = document.createElement('div')
  ring.className = 'fx-ring'
  ring.innerHTML = `<span class="fx-ring-circle"></span>${label ? `<span class="fx-ring-label">${label.replace(/</g, '&lt;')}</span>` : ''}`
  container.appendChild(shade)
  container.appendChild(ring)

  const update = () => {
    if (!mapAlive(map)) return
    const p = map.project(lngLat)
    shade.style.setProperty('--fx-x', `${p.x}px`)
    shade.style.setProperty('--fx-y', `${p.y}px`)
    ring.style.transform = `translate(${p.x}px, ${p.y}px)`
  }
  update()
  map.on('move', update)
  requestAnimationFrame(() => { shade.classList.add('on'); ring.classList.add('on') })

  s.cleanups.push(() => {
    map.off('move', update)
    shade.classList.remove('on'); ring.classList.remove('on')
    window.setTimeout(() => { shade.remove(); ring.remove() }, 500)
  })
  return s.id
}

/** Gentle cinematic drift — a slow partial orbit. Any user interaction or new
    camera command cancels it naturally. */
export function orbit(map: MapLibreMap, opts?: { dBearing?: number; durationMs?: number }): void {
  if (!mapAlive(map)) return
  map.easeTo({
    bearing: map.getBearing() + (opts?.dBearing ?? 35),
    duration: opts?.durationMs ?? 16000,
    easing: (t) => t,
    essential: false,
  })
}

/* A single ease stops dead at the end, which made a close-up feel parked the
   moment the drift finished. Keep re-issuing it so a site being discussed is
   always slowly turning, and stop the moment the user touches the map. */
let orbitStop: (() => void) | null = null

export function startContinuousOrbit(map: MapLibreMap, degPerLeg = 26, legMs = 15000): void {
  stopContinuousOrbit()
  if (!mapAlive(map)) return
  let cancelled = false
  const leg = () => {
    if (cancelled || !mapAlive(map)) return
    orbit(map, { dBearing: degPerLeg, durationMs: legMs })
  }
  const timer = window.setInterval(leg, legMs)
  const onInteract = () => stopContinuousOrbit()
  map.on('dragstart', onInteract)
  map.on('zoomstart', onInteract)
  leg()
  orbitStop = () => {
    cancelled = true
    window.clearInterval(timer)
    map.off('dragstart', onInteract)
    map.off('zoomstart', onInteract)
    orbitStop = null
  }
}

export function stopContinuousOrbit(): void {
  orbitStop?.()
}

/* ------------------------------------------------------------------ */
/* Agent drawing: links between sites, highlighted areas               */
/* ------------------------------------------------------------------ */

const DRAW_SOURCE = 'fx-draw'
const DRAW_LINE = 'fx-draw-line'
const DRAW_FILL = 'fx-draw-fill'
const DRAW_HALO = 'fx-draw-halo'

function removeDrawLayers(map: MapLibreMap) {
  if (!mapAlive(map)) return
  for (const id of [DRAW_HALO, DRAW_LINE, DRAW_FILL]) if (map.getLayer(id)) map.removeLayer(id)
  if (map.getSource(DRAW_SOURCE)) map.removeSource(DRAW_SOURCE)
}

/** A curved arc between two points, so several links from one site fan out
    legibly instead of overlaying each other as straight lines. */
function arc(a: [number, number], b: [number, number], bend = 0.18): [number, number][] {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const cx = mx - dy * bend
  const cy = my + dx * bend
  const pts: [number, number][] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const u = 1 - t
    pts.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ])
  }
  return pts
}

function circlePoly(centre: [number, number], radiusKm: number): [number, number][] {
  const [lon, lat] = centre
  const dLat = radiusKm / 110.54
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  const ring: [number, number][] = []
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2
    ring.push([lon + Math.cos(a) * dLon, lat + Math.sin(a) * dLat])
  }
  return ring
}

export interface DrawSpec {
  links?: Array<{ from: [number, number]; to: [number, number] }>
  areas?: Array<{ centre: [number, number]; radiusKm: number }>
  /** Convex-ish region around a set of points (drawn as a padded hull). */
  hull?: [number, number][]
}

/** Draws the agent's own annotation layer over the map: arcs connecting
    sites, and circles marking regions. Cleared with everything else. */
export function drawOnMap(map: MapLibreMap, spec: DrawSpec): number {
  const s = scene ?? newScene()
  if (!mapAlive(map)) return 0
  removeDrawLayers(map)
  const features: GeoFeature[] = []

  for (const l of spec.links ?? []) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: arc(l.from, l.to) },
      properties: { draw: 'link' },
    })
  }
  for (const a of spec.areas ?? []) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circlePoly(a.centre, a.radiusKm)] },
      properties: { draw: 'area' },
    })
  }
  if (spec.hull?.length) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [hullOf(spec.hull)] },
      properties: { draw: 'area' },
    })
  }
  if (!features.length) return 0

  map.addSource(DRAW_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features } as never })
  map.addLayer({
    id: DRAW_FILL, type: 'fill', source: DRAW_SOURCE,
    filter: ['==', ['get', 'draw'], 'area'],
    paint: { 'fill-color': '#ffd166', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 800 } as never },
  })
  map.addLayer({
    id: DRAW_HALO, type: 'line', source: DRAW_SOURCE,
    paint: {
      'line-color': '#0b0d12', 'line-width': 6, 'line-opacity': 0,
      'line-blur': 3, 'line-opacity-transition': { duration: 700 } as never,
    },
  })
  map.addLayer({
    id: DRAW_LINE, type: 'line', source: DRAW_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#ffd166', 'line-width': 2.6, 'line-opacity': 0,
      'line-dasharray': [2, 1.4],
      'line-opacity-transition': { duration: 700 } as never,
    },
  })
  requestAnimationFrame(() => {
    if (!mapAlive(map) || !map.getLayer(DRAW_LINE)) return
    map.setPaintProperty(DRAW_FILL, 'fill-opacity', 0.16)
    map.setPaintProperty(DRAW_HALO, 'line-opacity', 0.45)
    map.setPaintProperty(DRAW_LINE, 'line-opacity', 0.95)
  })

  /* Drawing a national relationship while the camera sits over one field
     leaves the reader watching a line disappear off the edge of the screen.
     Pull back to frame whatever was drawn. */
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const f of features) {
    const g = f.geometry as { type: string; coordinates: unknown }
    const ring = (g.type === 'Polygon' ? (g.coordinates as number[][][])[0] : g.coordinates as number[][])
    for (const [x, y] of ring) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (Number.isFinite(minX)) {
    stopContinuousOrbit()
    map.fitBounds([[minX, minY], [maxX, maxY]], {
      padding: { top: 90, bottom: 150, left: 90, right: 420 },
      maxZoom: 11, pitch: 0, bearing: 0, duration: 2400,
    })
  }
  s.cleanups.push(() => removeDrawLayers(map))
  return features.length
}

/** Monotone-chain convex hull, padded outwards so the ring sits clear of the
    points it encloses. */
function hullOf(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) {
    const c = pts[0] ?? [0, 0]
    return circlePoly(c, 8)
  }
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = []
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop()
    lower.push(q)
  }
  const upper: [number, number][] = []
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop()
    upper.push(q)
  }
  const ring = [...lower.slice(0, -1), ...upper.slice(0, -1)]
  const cx = ring.reduce((t, r) => t + r[0], 0) / ring.length
  const cy = ring.reduce((t, r) => t + r[1], 0) / ring.length
  const padded = ring.map(([x, y]) => [cx + (x - cx) * 1.22, cy + (y - cy) * 1.22] as [number, number])
  return [...padded, padded[0]]
}

/* ------------------------------------------------------------------ */
/* The cinematic site reveal                                           */
/* ------------------------------------------------------------------ */

export interface RevealPlan {
  /** What the agent should know to narrate the phases. */
  script: string
}

function extentFeatureFor(ds: Dataset, slug: string): GeoFeature | null {
  return primaryBoundary(ds.geo, slug)
    ?? projectedExtent(ds.geo, slug)
    ?? osmFootprints(ds.geo, slug)[0]
    ?? null
}

/** Phased reveal at a site the camera is already close to:
    1. spotlight + boundary pulse  2. football-pitch grid
    3. the WHOLE extent rises to its published height beside the OSM-surveyed
       houses  4. slow orbital drift. Returns a narration script for the agent. */
export function revealSite(
  map: MapLibreMap,
  ds: Dataset,
  slug: string,
  hooks: { setPitches(on: boolean): void; delayMs?: number },
): RevealPlan | { error: string } {
  const p = ds.observatory.projects.find((x) => x.project.slug === slug)
  if (!p) return { error: `Unknown site ${slug}` }
  const name = p.project.display_name ?? p.project.canonical_name
  const feature = extentFeatureFor(ds, slug)
  if (!feature) return { error: `${name} has no mapped extent (no red line, projected size or built footprint) — nothing to reveal. Narrate from get_site_details instead.` }

  const polys = polysOf(feature)
  const centre = centroidOf(polys) ?? projectCoords(p)
  if (!centre) return { error: `${name} has no usable location.` }

  const areaM2 = Number(feature.properties.official_area_m2 ?? feature.properties.area_m2
    ?? p.site?.site_area_m2?.value ?? 0)
  const pitchM2 = ds.observatory.constants?.comparisons?.football_pitch_m2?.value ?? 7140
  const heightM = typeof p.site?.max_building_height_m?.value === 'number'
    ? p.site.max_building_height_m.value : null
  const what = extentExplanation(feature)
  const pitches = areaM2 > 0 ? pitchesPhrase(areaM2, pitchM2) : null

  const s = newScene()
  const d0 = hooks.delayMs ?? 0

  /* Phase 0 — spotlight. */
  after(s, d0, () => {
    if (!mapAlive(map)) return
    spotlight(map, centre as [number, number], name, { keepScene: true })
  })

  /* Phase 1 — the boundary draws itself up and pulses. */
  after(s, d0 + 1400, () => {
    if (!mapAlive(map)) return
    removeFxLayers(map)
    map.addSource(FX_SOURCE, { type: 'geojson', data: feature as never })
    map.addLayer({
      id: FX_FILL, type: 'fill', source: FX_SOURCE,
      paint: { 'fill-color': '#ff3b2f', 'fill-opacity': 0 },
    })
    map.addLayer({
      id: FX_LINE, type: 'line', source: FX_SOURCE,
      paint: {
        'line-color': '#ff3b2f', 'line-width': 1, 'line-opacity': 0,
        'line-width-transition': { duration: 900 } as never,
        'line-opacity-transition': { duration: 900 } as never,
      },
    })
    s.cleanups.push(() => removeFxLayers(map))
    requestAnimationFrame(() => {
      if (!mapAlive(map) || !map.getLayer(FX_LINE)) return
      map.setPaintProperty(FX_LINE, 'line-width', 4)
      map.setPaintProperty(FX_LINE, 'line-opacity', 0.95)
      map.setPaintProperty(FX_FILL, 'fill-opacity', 0.08)
    })
    /* Heartbeat pulse while the scene lives. */
    let wide = true
    const pulse = window.setInterval(() => {
      if (!mapAlive(map) || !map.getLayer(FX_LINE)) return
      wide = !wide
      map.setPaintProperty(FX_LINE, 'line-width', wide ? 4 : 2.2)
    }, 1100)
    s.cleanups.push(() => window.clearInterval(pulse))
    presentCards([{
      kind: 'note', icon: '🔴', title: what.title,
      points: [pitches ? `${(areaM2 / 10000).toFixed(1)} hectares — ${pitches}` : 'Extent shown on the map'],
      source: what.tier === 1 ? 'official planning boundary' : 'derived from the published area',
    }], { ttlMs: 24000 })
    nudge(`ON SCREEN NOW at ${name}: the ${what.tier === 1 ? 'official planning boundary' : 'site extent'} has lit up and is pulsing, covering ${(areaM2 / 10000).toFixed(1)} hectares. Say ONE short sentence about it.`, { force: true })
  })

  /* Phase 2 — the pitch grid tiles the extent. */
  after(s, d0 + 5200, () => {
    hooks.setPitches(true)
    if (pitches) {
      presentCards([{
        kind: 'stat', icon: '⚽', value: pitches.replace('about ', '≈ '),
        label: 'if you tiled the whole site with football pitches',
        source: 'drawn by us from the sourced area',
      }], { ttlMs: 22000 })
    }
    nudge(`ON SCREEN NOW: football pitches are tiling across the site — ${pitches ?? 'the scale grid is on'}. Say ONE short sentence reacting to that scale.`, { force: true })
  })

  /* Phase 3 — the whole extent rises to its published height.

     The pitch grid answers "how wide"; leaving it on while the volume grows
     just fights it for the same pixels, so it stands down here. The camera
     also drops to a near-ground oblique angle: at the overhead framing that
     suits an area comparison, a 35 m block against a 68 ha field reads as
     nothing at all. */
  if (heightM != null) {
    after(s, d0 + 8600, () => {
      hooks.setPitches(false)
      if (!mapAlive(map)) return
      map.easeTo({
        center: centre as [number, number],
        zoom: 14.6, pitch: 74, duration: 2600,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      })
    })
    after(s, d0 + 9800, () => {
      if (!mapAlive(map) || !map.getSource(FX_SOURCE)) return
      map.addLayer({
        id: FX_MASS, type: 'fill-extrusion', source: FX_SOURCE,
        paint: {
          'fill-extrusion-color': '#4d9bff',
          'fill-extrusion-opacity': 0.78,
          'fill-extrusion-vertical-gradient': true,
          'fill-extrusion-height': 0,
          'fill-extrusion-height-transition': { duration: 3400 } as never,
        },
      })
      requestAnimationFrame(() => {
        if (!mapAlive(map) || !map.getLayer(FX_MASS)) return
        map.setPaintProperty(FX_MASS, 'fill-extrusion-height', heightM)
      })
      const houses = Math.max(1, Math.round(heightM / HOUSE_M))
      presentCards([{
        kind: 'stat', icon: '🏠', value: `${fmtInt(heightM)} m tall`,
        label: `as tall as ${houses} houses stacked on top of each other`,
        note: 'the volume is suggestive — the whole site drawn at its published height',
        source: 'height from the planning application',
      }], { ttlMs: 24000 })
      /* Keep turning around the mass once it has finished growing. */
      after(s, 3400, () => startContinuousOrbit(map, 30, 14000))
      nudge(`ON SCREEN NOW: the whole site is rising to its full ${heightM} metres beside the surrounding houses — about ${houses} houses stacked — and the camera is drifting around it. Say ONE short sentence about how that looks.`, { force: true })
    })
  }

  /* Curtain — the mass sinks, the boundary rests, the spotlight lifts. */
  after(s, d0 + (heightM != null ? 30000 : 22000), () => {
    if (mapAlive(map) && map.getLayer(FX_MASS)) {
      map.setPaintProperty(FX_MASS, 'fill-extrusion-height', 0)
    }
    after(s, 1200, () => clearFx())
  })

  const phases = [
    `t+${Math.round(d0 / 1000)}s spotlight`,
    `t+${Math.round((d0 + 1400) / 1000)}s the ${what.tier === 1 ? 'official red line' : what.tier === 4 ? 'built footprint' : 'projected extent (not a red line)'} pulses`,
    `t+${Math.round((d0 + 5200) / 1000)}s football-pitch grid${pitches ? ` (${pitches})` : ''}`,
    heightM != null
      ? `t+${Math.round((d0 + 9800) / 1000)}s the camera drops to near ground level and the whole site rises to ${heightM} m (≈ ${Math.max(1, Math.round(heightM / HOUSE_M))} houses stacked), then drifts around it`
      : 'no published height — the rise phase is skipped; say so',
  ]
  return {
    script: `Started at ${name}. It plays out over ~30 seconds: ${phases.join('; ')}. IMPORTANT: say ONE short sentence now to set it up, then STOP — you will be prompted as each stage lands, and you narrate them one at a time. Do not describe the whole sequence up front.`,
  }
}
