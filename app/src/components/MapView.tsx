import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import type { GeoCollection, ProjectRecord, QuantityClaim } from '../types'
import { STATUS_GROUPS, STATUS_GROUP_META, projectCoords, statusGroup } from '../lib/data'
import type { LensDef } from '../lib/lenses'
import {
  boundaryFeatures, buildingMasses, centroidOf, pitchGrid, polysOf, primaryBoundary,
  type MassSpec,
} from '../lib/geometry'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const SCOTLAND_BOUNDS: [[number, number], [number, number]] = [[-7.9, 54.6], [-0.6, 60.95]]
const ACCENT = '#2a78d6'
const NO_DATA = '#898781'

/* Official red line — reserved to sourced Spatial Hub boundaries only. */
export const REDLINE = '#c0242d'
/** Zoom at which real boundaries appear (the national view stays clean). */
export const BOUNDARY_MIN_ZOOM = 9
/** Zoom at which the derived pitch grid appears. */
export const PITCH_MIN_ZOOM = 12

interface Props {
  projects: ProjectRecord[]
  lens: LensDef
  geo: GeoCollection
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
  threeD: boolean
  showPitches: boolean
  pitchM2: number
}

function qv(q?: QuantityClaim): number | null {
  if (!q) return null
  const v = q.value ?? q.max ?? q.min
  return typeof v === 'number' ? v : null
}

/** Project points with per-lens colour, radius and metric baked into
    properties, so a single clustered source drives the whole marker system. */
function pointFeatures(projects: ProjectRecord[], lens: LensDef) {
  return {
    type: 'FeatureCollection' as const,
    features: projects.flatMap((p) => {
      const coords = projectCoords(p)
      if (!coords) return []
      const s = lens.marker(p)
      const m = lens.metric ? lens.metric(p) : null
      return [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: {
          slug: p.project.slug,
          name: p.project.display_name ?? p.project.canonical_name,
          color: s.color,
          radius: s.size / 2,
          metric_label: s.metricLabel,
          metric: m ?? 0,
          has_metric: m == null ? 0 : 1,
          sg: statusGroup(p.project.status),
        },
      }]
    }),
  }
}

/* Cluster aggregations are fixed when the source is created and survive
   setData, so they must be lens-agnostic: they aggregate the `metric` / `sg`
   properties, whose values are recomputed per lens in pointFeatures(). */
function clusterProperties(): Record<string, unknown> {
  const props: Record<string, unknown> = {
    sum_metric: ['+', ['get', 'metric']],
    n_metric: ['+', ['get', 'has_metric']],
  }
  for (const g of STATUS_GROUPS) {
    props[`g_${g}`] = ['+', ['case', ['==', ['get', 'sg'], g], 1, 0]]
  }
  return props
}

/* ---------------- donut cluster markers ---------------- */

interface Segment { color: string; n: number }

function isStatusLens(lens: LensDef): boolean {
  return lens.id === 'overview' || lens.id === 'planning'
}

function donutSegments(props: Record<string, unknown>, lens: LensDef, dark: boolean): Segment[] {
  const count = Number(props.point_count ?? 0)
  if (isStatusLens(lens)) {
    return STATUS_GROUPS.map((g) => {
      const meta = STATUS_GROUP_META[g]
      return { color: dark ? meta.colorDark : meta.color, n: Number(props[`g_${g}`] ?? 0) }
    }).filter((s) => s.n > 0)
  }
  const withFig = Number(props.n_metric ?? 0)
  const segs: Segment[] = []
  if (withFig > 0) segs.push({ color: dark ? '#5598e7' : ACCENT, n: withFig })
  if (count - withFig > 0) segs.push({ color: NO_DATA, n: count - withFig })
  return segs
}

function donutHTML(props: Record<string, unknown>, lens: LensDef, dark: boolean): { html: string; size: number } {
  const count = Number(props.point_count ?? 0)
  const total = Number(props.sum_metric ?? 0)
  const withFig = Number(props.n_metric ?? 0)
  /* Credibility aggregates as a mean, everything else as a sum. */
  const scaleVal = lens.id === 'credibility' ? (withFig ? total / withFig : 0) : total
  const frac = lens.metricMax > 0 ? Math.min(1, Math.max(0, scaleVal / lens.metricMax)) : 0
  const size = withFig === 0 ? 54 : Math.round(54 + 32 * Math.sqrt(frac))
  const r = size / 2 - 5
  const c = size / 2
  const circ = 2 * Math.PI * r
  const segs = withFig === 0 && !isStatusLens(lens)
    ? [{ color: NO_DATA, n: count }]
    : donutSegments(props, lens, dark)
  let offset = 0
  const arcs = segs.map((s) => {
    const len = (s.n / Math.max(count, 1)) * circ
    const drawn = Math.max(len - 2, 0.6) // 2px surface gap between fills
    const el = `<circle class="seg" cx="${c}" cy="${c}" r="${r}" stroke="${s.color}" stroke-dasharray="${drawn} ${circ - drawn}" stroke-dashoffset="${-offset}" />`
    offset += len
    return el
  }).join('')
  const value = lens.fmtAggregate(total, withFig)
  /* Fit the label to the bubble: pick the largest step that still fits the
     inner width, else wrap at the smallest step. */
  const innerW = size - 18
  const fits = (px: number) => value.length * px * 0.62 <= innerW
  const cls = fits(13) ? '' : fits(11) ? ' md' : ' sm'
  return {
    size,
    html: `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">`
      + `<circle class="plate" cx="${c}" cy="${c}" r="${r}" />${arcs}</svg>`
      + `<span class="donut-text"><span class="dv${cls}">${value}</span>`
      + `<span class="dn">${count} sites</span></span>`,
  }
}

function ariaFor(props: Record<string, unknown>, lens: LensDef): string {
  const count = Number(props.point_count ?? 0)
  const withFig = Number(props.n_metric ?? 0)
  const total = Number(props.sum_metric ?? 0)
  const gap = count - withFig
  const base = `${count} grouped sites — ${lens.fmtAggregate(total, withFig)} ${lens.aggregateLabel}`
  return `${base}${gap > 0 ? `; ${gap} of ${count} have no published figure` : ''}. Activate to zoom in.`
}

export default function MapView({
  projects, lens, geo, selectedSlug, onSelect, threeD, showPitches, pitchM2,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const loadedRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const lensRef = useRef(lens)
  lensRef.current = lens
  const markersRef = useRef(new Map<number, { marker: Marker; key: string }>())
  const syncRef = useRef<() => void>(() => {})
  const fitSigRef = useRef<string | null>(null)
  const areaLabelsRef = useRef(new Map<string, Marker>())
  /* Effects that add data to the style must wait for 'load' — and must re-run
     once it happens, or the polygons stay frozen/empty forever. */
  const [ready, setReady] = useState(false)

  /* ---------- create the map once ---------- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds: SCOTLAND_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      loadedRef.current = true
      setReady(true)
      /* The basemap (positron) is light in both colour schemes, so map-layer
         colours are chosen against it rather than against the UI theme. */
      const red = REDLINE
      const empty = { type: 'FeatureCollection' as const, features: [] }

      map.addSource('dc-boundaries', { type: 'geojson', data: empty })
      map.addSource('dc-pitches', { type: 'geojson', data: empty })
      map.addSource('dc-buildings', { type: 'geojson', data: empty })

      map.addLayer({
        id: 'dc-boundary-fill', type: 'fill', source: 'dc-boundaries',
        minzoom: BOUNDARY_MIN_ZOOM,
        paint: {
          'fill-color': red,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], BOUNDARY_MIN_ZOOM, 0, BOUNDARY_MIN_ZOOM + 1.2, 0.11],
        },
      })
      map.addLayer({
        id: 'dc-boundary-line', type: 'line', source: 'dc-boundaries',
        minzoom: BOUNDARY_MIN_ZOOM,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': red,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], BOUNDARY_MIN_ZOOM, 0.15, BOUNDARY_MIN_ZOOM + 1, 1],
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.6, 12, 2.6, 16, 3.4],
        },
      })
      map.addLayer({
        id: 'dc-pitch-grid', type: 'line', source: 'dc-pitches',
        minzoom: PITCH_MIN_ZOOM,
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#2f7d31',
          'line-width': 0.7,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], PITCH_MIN_ZOOM, 0, PITCH_MIN_ZOOM + 0.8, 0.8],
        },
      })
      map.addLayer({
        id: 'dc-building-extrusion', type: 'fill-extrusion', source: 'dc-buildings',
        minzoom: 10.5,
        layout: { visibility: 'none' },
        paint: {
          'fill-extrusion-color': '#1c5cab',
          'fill-extrusion-opacity': 0.8,
          'fill-extrusion-height': ['coalesce', ['to-number', ['get', 'height']], 12],
          'fill-extrusion-base': 0,
        },
      })

      map.addSource('dc-points', {
        type: 'geojson',
        data: pointFeatures(projects, lensRef.current),
        cluster: true,
        clusterRadius: 62,
        clusterMaxZoom: 9,
        clusterProperties: clusterProperties(),
      })
      /* Selection halo sits under the dots. */
      map.addLayer({
        id: 'dc-selected', type: 'circle', source: 'dc-points',
        filter: ['==', ['get', 'slug'], '__none__'],
        paint: {
          'circle-radius': ['+', ['get', 'radius'], 7],
          'circle-color': ACCENT,
          'circle-opacity': 0.25,
          'circle-stroke-color': ACCENT,
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'dc-dots', type: 'circle', source: 'dc-points',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.95,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      /* ---- HTML donut markers carry the aggregated value, not a bare count ---- */
      const sync = () => {
        if (!map.getSource('dc-points')) return
        let feats
        try {
          feats = map.querySourceFeatures('dc-points')
        } catch { return }
        /* Marker fills sit on the light basemap, not on the UI surface. */
        const dk = false
        const live = new Set<number>()
        for (const f of feats) {
          const props = f.properties as Record<string, unknown>
          if (!props?.cluster) continue
          const id = Number(props.cluster_id)
          if (live.has(id)) continue
          live.add(id)
          const coords = (f.geometry as { coordinates: [number, number] }).coordinates
          const { html, size } = donutHTML(props, lensRef.current, dk)
          const key = `${lensRef.current.id}|${size}|${props.point_count}|${props.sum_metric}|${props.n_metric}`
          const existing = markersRef.current.get(id)
          if (existing) {
            if (existing.key !== key) {
              const el = existing.marker.getElement()
              el.innerHTML = html
              el.style.width = `${size}px`
              el.style.height = `${size}px`
              el.style.zIndex = String(200 - size)
              el.setAttribute('aria-label', ariaFor(props, lensRef.current))
              markersRef.current.set(id, { marker: existing.marker, key })
            }
            existing.marker.setLngLat(coords)
            continue
          }
          const el = document.createElement('button')
          el.type = 'button'
          el.className = 'cluster-donut'
          el.style.width = `${size}px`
          el.style.height = `${size}px`
          /* Smaller bubbles ride on top: their labels have least room, and a
             big bubble's centred value stays clear either way. */
          el.style.zIndex = String(200 - size)
          el.innerHTML = html
          el.setAttribute('aria-label', ariaFor(props, lensRef.current))
          el.addEventListener('click', (ev) => {
            ev.stopPropagation()
            const src = map.getSource('dc-points') as GeoJSONSource
            src.getClusterExpansionZoom(id)
              .then((zoom) => map.easeTo({ center: coords, zoom: zoom + 0.35, duration: 550 }))
              .catch(() => {})
          })
          const marker = new Marker({ element: el }).setLngLat(coords).addTo(map)
          markersRef.current.set(id, { marker, key })
        }
        for (const [id, m] of markersRef.current) {
          if (!live.has(id)) { m.marker.remove(); markersRef.current.delete(id) }
        }
      }
      syncRef.current = sync
      map.on('data', (e) => { if ((e as { sourceId?: string }).sourceId === 'dc-points') sync() })
      map.on('moveend', sync)
      sync()

      map.on('click', (e: MapMouseEvent) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['dc-dots'] })
        const hit = hits[0]
        if (!hit) { onSelectRef.current(null); return }
        if (typeof hit.properties?.slug === 'string') onSelectRef.current(hit.properties.slug)
      })
      map.on('mouseenter', 'dc-dots', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'dc-dots', () => { map.getCanvas().style.cursor = '' })
    })

    mapRef.current = map
    ;(window as unknown as { __sdoMap?: MapLibreMap }).__sdoMap = map
    return () => {
      loadedRef.current = false
      setReady(false)
      for (const [, m] of markersRef.current) m.marker.remove()
      markersRef.current.clear()
      for (const [, m] of areaLabelsRef.current) m.remove()
      areaLabelsRef.current.clear()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- points update when projects / lens change ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const src = map.getSource('dc-points') as GeoJSONSource | undefined
    src?.setData(pointFeatures(projects, lens))
    /* Aggregates are lens-agnostic; the donut *labels* are not, so relabel
       once the new data has been re-indexed. */
    const t = window.setTimeout(() => syncRef.current(), 80)
    return () => window.clearTimeout(t)
  }, [projects, lens, ready])

  /* ---------- boundaries react to geo AND to the active filters ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const slugs = projects.map((p) => p.project.slug)
    const feats = boundaryFeatures(geo).filter((f) => slugs.includes(f.properties.slug ?? ''))
    const src = map.getSource('dc-boundaries') as GeoJSONSource | undefined
    src?.setData({ type: 'FeatureCollection', features: feats } as never)
    for (const id of ['dc-boundary-fill', 'dc-boundary-line']) {
      if (map.getLayer(id)) map.setFilter(id, ['in', ['get', 'slug'], ['literal', slugs]])
    }
    /* The pitch grid is derived from the same (filtered) boundaries. */
    const pitches = map.getSource('dc-pitches') as GeoJSONSource | undefined
    pitches?.setData(pitchGrid(feats, pitchM2) as never)
  }, [geo, projects, pitchM2, ready])

  /* ---------- indicative masses: only where footprint AND height are sourced ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const specs: MassSpec[] = []
    for (const p of projects) {
      const fp = qv(p.site?.building_footprint_m2)
      const h = qv(p.site?.max_building_height_m)
      if (fp == null || h == null) continue
      const b = primaryBoundary(geo, p.project.slug)
      const centre = (b && centroidOf(polysOf(b))) ?? projectCoords(p)
      if (!centre) continue
      specs.push({
        slug: p.project.slug,
        name: p.project.display_name ?? p.project.canonical_name,
        centre,
        footprintM2: fp,
        heightM: h,
        buildings: qv(p.site?.number_of_buildings) ?? 1,
      })
    }
    const src = map.getSource('dc-buildings') as GeoJSONSource | undefined
    src?.setData(buildingMasses(specs) as never)
  }, [geo, projects, ready])

  /* ---------- pitch-ratio labels on each official boundary ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const slugs = new Set(projects.map((p) => p.project.slug))
    const wanted = boundaryFeatures(geo).filter(
      (f) => f.properties.is_primary && slugs.has(f.properties.slug ?? ''),
    )
    const live = new Set<string>()
    for (const f of wanted) {
      const areaM2 = f.properties.official_area_m2
      const centre = centroidOf(polysOf(f))
      if (typeof areaM2 !== 'number' || !centre) continue
      const key = `${f.properties.slug}|${f.properties.reference ?? ''}`
      live.add(key)
      if (areaLabelsRef.current.has(key)) continue
      const el = document.createElement('div')
      el.className = 'pitch-label'
      const pitches = Math.round(areaM2 / pitchM2)
      el.innerHTML = `<strong>≈ ${pitches} football pitches</strong>`
        + `<span>official red line · ${(areaM2 / 10000).toFixed(1)} ha</span>`
      areaLabelsRef.current.set(key, new Marker({ element: el }).setLngLat(centre).addTo(map))
    }
    for (const [key, m] of areaLabelsRef.current) {
      if (!live.has(key)) { m.remove(); areaLabelsRef.current.delete(key) }
    }
  }, [geo, projects, pitchM2, ready])

  /* Labels ride with the pitch grid: same toggle, same zoom threshold. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      const on = showPitches && map.getZoom() >= PITCH_MIN_ZOOM
      for (const [, m] of areaLabelsRef.current) {
        m.getElement().classList.toggle('on', on)
      }
    }
    apply()
    map.on('zoomend', apply)
    map.on('moveend', apply)
    return () => { map.off('zoomend', apply); map.off('moveend', apply) }
  }, [showPitches, ready, geo, projects])

  /* ---------- pitch-grid visibility ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current || !map.getLayer('dc-pitch-grid')) return
    map.setLayoutProperty('dc-pitch-grid', 'visibility', showPitches ? 'visible' : 'none')
  }, [showPitches, ready])

  /* ---------- selection highlight ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current || !map.getLayer('dc-selected')) return
    map.setFilter('dc-selected', ['==', ['get', 'slug'], selectedSlug ?? '__none__'])
  }, [selectedSlug, ready])

  /* ---------- 3D: tilt AND extrusion visibility ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ pitch: threeD ? 55 : 0, bearing: 0, duration: 600 })
    if (loadedRef.current && map.getLayer('dc-building-extrusion')) {
      map.setLayoutProperty('dc-building-extrusion', 'visibility', threeD ? 'visible' : 'none')
    }
  }, [threeD, ready])

  /* ---------- a filter change moves the map, so filtering is visibly effective ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const sig = projects.map((p) => p.project.slug).sort().join(',')
    const first = fitSigRef.current === null
    const changed = fitSigRef.current !== sig
    fitSigRef.current = sig
    if (first || !changed || selectedSlug) return
    const coords = projects.map(projectCoords).filter((c): c is [number, number] => !!c)
    if (!coords.length) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of coords) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    map.fitBounds([[minX, minY], [maxX, maxY]], {
      padding: { top: 176, bottom: 116, left: 44, right: 60 },
      maxZoom: 10.5,
      duration: 700,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects])

  /* ---------- fly to selection ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedSlug) return
    const p = projects.find((x) => x.project.slug === selectedSlug)
    const coords = p && projectCoords(p)
    if (coords) {
      map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 12.4), duration: 600 })
    }
  }, [selectedSlug, projects])

  return <div ref={containerRef} className="map-canvas" role="application" aria-label="Map of Scottish data centre projects" />
}
