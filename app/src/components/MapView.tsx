import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import type { GeoCollection, ProjectRecord } from '../types'
import { projectCoords } from '../lib/data'
import type { LensDef } from '../lib/lenses'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const SCOTLAND_BOUNDS: [[number, number], [number, number]] = [[-7.9, 54.6], [-0.6, 60.95]]

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

export default function MapView({ projects, lens, geo, selectedSlug, onSelect, threeD }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const loadedRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

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
    map.on('click', () => onSelectRef.current(null))
    map.on('load', () => {
      loadedRef.current = true
      try {
        const boundaries = polygonFeatures(geo, 'boundary')
        const buildings = polygonFeatures(geo, 'building')
        map.addSource('dc-boundaries', { type: 'geojson', data: boundaries })
        map.addSource('dc-buildings', { type: 'geojson', data: buildings })
        map.addLayer({
          id: 'dc-boundary-fill',
          type: 'fill',
          source: 'dc-boundaries',
          paint: { 'fill-color': '#2a78d6', 'fill-opacity': 0.12 },
        })
        map.addLayer({
          id: 'dc-boundary-line',
          type: 'line',
          source: 'dc-boundaries',
          paint: { 'line-color': '#2a78d6', 'line-width': 1.5, 'line-opacity': 0.8 },
        })
        map.addLayer({
          id: 'dc-building-extrusion',
          type: 'fill-extrusion',
          source: 'dc-buildings',
          paint: {
            'fill-extrusion-color': '#1c5cab',
            'fill-extrusion-opacity': 0.85,
            'fill-extrusion-height': ['coalesce', ['to-number', ['get', 'height']], 12],
            'fill-extrusion-base': 0,
          },
        })
      } catch {
        /* geo layers are optional — never break the map */
      }
    })
    mapRef.current = map
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      loadedRef.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Markers: rebuilt when projects / lens / selection change. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    for (const p of projects) {
      const coords = projectCoords(p)
      if (!coords) continue
      const style = lens.marker(p)
      const el = document.createElement('button')
      el.className = 'dc-marker'
      el.style.width = `${style.size}px`
      el.style.height = `${style.size}px`
      el.style.background = `light-dark(${style.color}, ${style.colorDark})`
      el.style.padding = '0'
      const name = p.project.display_name ?? p.project.canonical_name
      el.title = `${name} — ${style.metricLabel}`
      el.setAttribute('aria-label', el.title)
      if (p.project.slug === selectedSlug) {
        el.style.boxShadow = '0 0 0 3px rgba(42,120,214,0.9), 0 1px 4px rgba(0,0,0,0.35)'
      }
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(p.project.slug)
      })
      const marker = new Marker({ element: el }).setLngLat(coords).addTo(map)
      markersRef.current.push(marker)
    }
  }, [projects, lens, selectedSlug])

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
