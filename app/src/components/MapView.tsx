import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, NavigationControl } from 'maplibre-gl'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import type { GeoCollection, ProjectRecord } from '../types'
import { projectCoords } from '../lib/data'
import type { LensDef } from '../lib/lenses'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const SCOTLAND_BOUNDS: [[number, number], [number, number]] = [[-7.9, 54.6], [-0.6, 60.95]]
const ACCENT = '#2a78d6'

interface Props {
  projects: ProjectRecord[]
  lens: LensDef
  geo: GeoCollection
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
  threeD: boolean
}

function polygonFeatures(geo: GeoCollection, kind: string) {
  return {
    type: 'FeatureCollection' as const,
    features: geo.features.filter(
      (f) =>
        f?.properties?.kind === kind &&
        (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'),
    ),
  }
}

/** Project points with per-lens colour + radius baked into properties, so a
    single clustered source drives the whole marker system. */
function pointFeatures(projects: ProjectRecord[], lens: LensDef) {
  return {
    type: 'FeatureCollection' as const,
    features: projects.flatMap((p) => {
      const coords = projectCoords(p)
      if (!coords) return []
      const s = lens.marker(p)
      return [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: {
          slug: p.project.slug,
          name: p.project.display_name ?? p.project.canonical_name,
          color: s.color,
          radius: s.size / 2,
          metric: s.metricLabel,
        },
      }]
    }),
  }
}

export default function MapView({ projects, lens, geo, selectedSlug, onSelect, threeD }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const loadedRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const pointsRef = useRef(pointFeatures(projects, lens))
  pointsRef.current = pointFeatures(projects, lens)

  /* Create the map once. */
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
      try {
        const boundaries = polygonFeatures(geo, 'boundary')
        const buildings = polygonFeatures(geo, 'building')
        map.addSource('dc-boundaries', { type: 'geojson', data: boundaries })
        map.addSource('dc-buildings', { type: 'geojson', data: buildings })
        map.addLayer({
          id: 'dc-boundary-fill', type: 'fill', source: 'dc-boundaries',
          paint: { 'fill-color': ACCENT, 'fill-opacity': 0.12 },
        })
        map.addLayer({
          id: 'dc-boundary-line', type: 'line', source: 'dc-boundaries',
          paint: { 'line-color': ACCENT, 'line-width': 1.5, 'line-opacity': 0.8 },
        })
        map.addLayer({
          id: 'dc-building-extrusion', type: 'fill-extrusion', source: 'dc-buildings',
          paint: {
            'fill-extrusion-color': '#1c5cab',
            'fill-extrusion-opacity': 0.85,
            'fill-extrusion-height': ['coalesce', ['to-number', ['get', 'height']], 12],
            'fill-extrusion-base': 0,
          },
        })
      } catch { /* geo layers are optional — never break the map */ }

      map.addSource('dc-points', {
        type: 'geojson',
        data: pointsRef.current,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 9,
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
      map.addLayer({
        id: 'dc-clusters', type: 'circle', source: 'dc-points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 15, 5, 19, 12, 24],
          'circle-color': ACCENT,
          'circle-opacity': 0.92,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      })
      map.addLayer({
        id: 'dc-cluster-count', type: 'symbol', source: 'dc-points',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#ffffff' },
      })

      map.on('click', (e: MapMouseEvent) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['dc-clusters', 'dc-dots'] })
        const hit = hits[0]
        if (!hit) { onSelectRef.current(null); return }
        if (hit.properties?.cluster) {
          const src = map.getSource('dc-points') as GeoJSONSource
          src.getClusterExpansionZoom(hit.properties.cluster_id as number)
            .then((zoom) => map.easeTo({ center: (hit.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates, zoom: zoom + 0.3, duration: 500 }))
            .catch(() => {})
        } else if (typeof hit.properties?.slug === 'string') {
          onSelectRef.current(hit.properties.slug)
        }
      })
      for (const layer of ['dc-clusters', 'dc-dots']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }
    })

    mapRef.current = map
    ;(window as unknown as { __sdoMap?: MapLibreMap }).__sdoMap = map
    return () => {
      loadedRef.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Points update when projects / lens change. */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const src = map.getSource('dc-points') as GeoJSONSource | undefined
    src?.setData(pointFeatures(projects, lens))
  }, [projects, lens])

  /* Selection highlight. */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current || !map.getLayer('dc-selected')) return
    map.setFilter('dc-selected', ['==', ['get', 'slug'], selectedSlug ?? '__none__'])
  }, [selectedSlug])

  /* 3D pitch toggle. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ pitch: threeD ? 55 : 0, bearing: 0, duration: 600 })
  }, [threeD])

  /* Fly to selection. */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedSlug) return
    const p = projects.find((x) => x.project.slug === selectedSlug)
    const coords = p && projectCoords(p)
    if (coords) {
      map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 8.5), duration: 500 })
    }
  }, [selectedSlug, projects])

  return <div ref={containerRef} className="map-canvas" role="application" aria-label="Map of Scottish data centre projects" />
}
