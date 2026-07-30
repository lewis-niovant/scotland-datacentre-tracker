import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import type { GeoCollection, GeoFeature, ProjectRecord } from '../types'
import { fmtInt } from '../lib/data'
import {
  bboxOf, buildingMasses, centroidOf, osmFootprints, pitchesPhrase, pitchGrid, polysOf,
  primaryBoundary, projectedExtent, STOREY_M, type MassSpec,
} from '../lib/geometry'
import { EXTENT2, EXTENT3, NOMINAL_BLOCK_M2, OSM_BUILT, REDLINE } from './MapView'

/* A small staged map on the project page: locate the site, draw its extent, fill
   it with football pitches, then stand its published height up.

   Only the stages we actually hold data for are offered, and the caption on each
   says which of the three tiers the extent is. A project with no geometry gets no
   map at all rather than an empty frame — see hasSiteReveal(). */

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

function qv(q?: { value?: number | null; max?: number | null; min?: number | null }): number | null {
  if (!q) return null
  const v = q.value ?? q.max ?? q.min
  return typeof v === 'number' ? v : null
}

export function hasSiteReveal(geo: GeoCollection, p: ProjectRecord): boolean {
  return !!(primaryBoundary(geo, p.project.slug)
    ?? osmFootprints(geo, p.project.slug)[0]
    ?? projectedExtent(geo, p.project.slug))
}

interface Stage { key: string; label: string; caption: string }

export default function SiteReveal({ geo, p, pitchM2 }: {
  geo: GeoCollection
  p: ProjectRecord
  pitchM2: number
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const massLabelRef = useRef<Marker | null>(null)
  const [ready, setReady] = useState(false)
  const [stage, setStage] = useState(0)
  const [failed, setFailed] = useState(false)

  const boundary = primaryBoundary(geo, p.project.slug)
  /* Largest of the surveyed outlines — a facility can be several halls. */
  const osm: GeoFeature | null = boundary ? null : osmFootprints(geo, p.project.slug)
    .reduce<GeoFeature | null>((a, f) =>
      (Number(f.properties.area_m2) || 0) > (Number(a?.properties.area_m2) || 0) ? f : a, null)
  const extent = boundary || osm ? null : projectedExtent(geo, p.project.slug)
  const shape = boundary ?? osm ?? extent
  const height = qv(p.site?.max_building_height_m)
  const footprint = qv(p.site?.building_footprint_m2)
  const areaM2 = boundary
    ? (boundary.properties.official_area_m2 as number | undefined)
    : ((osm ?? extent)?.properties.area_m2 as number | undefined)
  const tier: 1 | 2 | 3 | 4 = boundary ? 1 : osm ? 4 : extent?.properties.tier === 3 ? 3 : 2

  const stages: Stage[] = useMemo(() => [
    {
      key: 'locate',
      label: 'Location',
      caption: `${p.project.local_authority ?? 'Scotland'}${p.site?.settlement ? ` · ${p.site.settlement}` : ''}`,
    },
    {
      key: 'extent',
      label: tier === 1 ? 'Red line' : tier === 4 ? 'Built footprint' : 'Projected size',
      caption: tier === 1
        ? `The official planning boundary submitted with the application${areaM2 ? ` — ${(areaM2 / 10000).toFixed(1)} ha` : ''}. Source: Spatial Hub Scotland.`
        : tier === 4
        ? `The buildings that actually stand here${areaM2 ? ` — ${fmtInt(Math.round(areaM2))} m²` : ''}, surveyed by OpenStreetMap contributors and matched to this facility by name. This facility predates the online planning portal, so no red line exists for it. © OpenStreetMap contributors, ODbL.`
        : `Not a planning boundary — a square of the site's stated area${areaM2 ? ` (${(areaM2 / 10000).toFixed(1)} ha)` : ''}${tier === 3 ? ', on a settlement-level location' : ''}. The area is sourced; the shape is not.`,
    },
  ], [p, tier, areaM2])

  const allStages: Stage[] = useMemo(() => {
    const out = [...stages]
    if (areaM2 && pitchM2) {
      const phrase = pitchesPhrase(areaM2, pitchM2)
      out.push({
        key: 'pitches',
        label: 'Scale',
        caption: `That is ${phrase}, drawn at ${fmtInt(pitchM2)} m² each.`,
      })
    }
    if (height != null) {
      out.push({
        key: 'height',
        label: 'Height',
        caption: `Buildings up to ${height} m — roughly ${Math.max(1, Math.round(height / STOREY_M))} storeys. `
          + (footprint != null
            ? 'Block uses the published footprint; the layout is illustrative.'
            : 'No footprint is published, so a nominal block carries the sourced height.'),
      })
    }
    return out
  }, [stages, areaM2, pitchM2, height, footprint])

  /* ---------- create the map once ---------- */
  useEffect(() => {
    if (!boxRef.current || mapRef.current || !shape) return
    const polys = polysOf(shape)
    const [minX, minY, maxX, maxY] = bboxOf(polys)
    if (!Number.isFinite(minX)) return
    const map = new MapLibreMap({
      container: boxRef.current,
      style: MAP_STYLE,
      bounds: [[minX, minY], [maxX, maxY]],
      fitBoundsOptions: { padding: 46 },
      attributionControl: { compact: true },
      interactive: true,
    })
    map.on('error', () => setFailed(true))
    map.on('load', () => {
      const empty = { type: 'FeatureCollection' as const, features: [] }
      map.addSource('sr-shape', { type: 'geojson', data: empty })
      map.addSource('sr-pitches', { type: 'geojson', data: empty })
      map.addSource('sr-mass', { type: 'geojson', data: empty })

      const colour = tier === 1 ? REDLINE : tier === 4 ? OSM_BUILT : tier === 2 ? EXTENT2 : EXTENT3
      map.addLayer({
        id: 'sr-fill', type: 'fill', source: 'sr-shape',
        paint: { 'fill-color': colour, 'fill-opacity': 0, 'fill-opacity-transition': { duration: 600, delay: 0 } },
      })
      map.addLayer({
        id: 'sr-line', type: 'line', source: 'sr-shape',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': colour,
          'line-width': 2.6,
          'line-opacity': 0,
          'line-opacity-transition': { duration: 600, delay: 0 },
          /* Real geometry (red line, built footprint) is solid; projections are not. */
          ...(tier === 2 ? { 'line-dasharray': [2.6, 1.7] } : {}),
          ...(tier === 3 ? { 'line-dasharray': [0.6, 1.6] } : {}),
        },
      })
      map.addLayer({
        id: 'sr-pitch-fill', type: 'fill', source: 'sr-pitches',
        paint: {
          'fill-color': ['case', ['==', ['get', 'stripe'], 1], '#3f9142', '#357c38'],
          'fill-opacity': 0, 'fill-opacity-transition': { duration: 700, delay: 0 },
        },
      })
      map.addLayer({
        id: 'sr-pitch-line', type: 'line', source: 'sr-pitches',
        paint: {
          'line-color': '#ffffff', 'line-width': 1,
          'line-opacity': 0, 'line-opacity-transition': { duration: 700, delay: 200 },
        },
      })
      map.addLayer({
        id: 'sr-mass', type: 'fill-extrusion', source: 'sr-mass',
        /* A zero-height extrusion still paints its footprint flat on the ground,
           so the block has to be hidden outright until its own stage. */
        layout: { visibility: 'none' },
        paint: {
          'fill-extrusion-color': footprint != null ? '#1c5cab' : '#7a8698',
          'fill-extrusion-opacity': 0.88,
          'fill-extrusion-height': 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-height-transition': { duration: 1000, delay: 150 },
        },
      })

      /* Data is loaded up front; the stages reveal it, so stepping back and
         forth never refetches or re-tiles anything. */
      ;(map.getSource('sr-shape') as never as { setData: (d: unknown) => void })
        .setData({ type: 'FeatureCollection', features: [shape] })
      ;(map.getSource('sr-pitches') as never as { setData: (d: unknown) => void })
        .setData(pitchGrid([shape], pitchM2))
      const centre = centroidOf(polys)
      if (height != null && centre) {
        const spec: MassSpec = {
          slug: p.project.slug,
          name: p.project.display_name ?? p.project.canonical_name,
          centre,
          footprintM2: footprint ?? NOMINAL_BLOCK_M2,
          footprintSourced: footprint != null,
          heightM: height,
          buildings: footprint != null ? qv(p.site?.number_of_buildings) ?? 1 : 1,
        }
        ;(map.getSource('sr-mass') as never as { setData: (d: unknown) => void })
          .setData(buildingMasses([spec]))
      }
      setReady(true)
    })
    mapRef.current = map
    return () => {
      massLabelRef.current?.remove()
      massLabelRef.current = null
      map.remove()
      mapRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.project.slug])

  /* ---------- apply the current stage ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !map.isStyleLoaded() || !map.getLayer('sr-fill')) return
    const key = allStages[stage]?.key
    const at = (k: string) => allStages.findIndex((s) => s.key === k)
    const on = (k: string) => at(k) >= 0 && stage >= at(k)

    map.setPaintProperty('sr-fill', 'fill-opacity', on('extent') ? (tier === 3 ? 0.05 : tier === 4 ? 0.24 : 0.14) : 0)
    map.setPaintProperty('sr-line', 'line-opacity', on('extent') ? 0.95 : 0)
    map.setPaintProperty('sr-pitch-fill', 'fill-opacity', on('pitches') ? 0.62 : 0)
    map.setPaintProperty('sr-pitch-line', 'line-opacity', on('pitches') ? 0.85 : 0)

    const showMass = on('height')
    if (showMass) {
      map.setLayoutProperty('sr-mass', 'visibility', 'visible')
      requestAnimationFrame(() => {
        if (mapRef.current !== map || !map.getLayer('sr-mass')) return
        map.setPaintProperty('sr-mass', 'fill-extrusion-height',
          ['coalesce', ['to-number', ['get', 'height']], 12] as never)
      })
    } else {
      map.setPaintProperty('sr-mass', 'fill-extrusion-height', 0)
      map.setLayoutProperty('sr-mass', 'visibility', 'none')
    }
    map.easeTo({ pitch: showMass ? 58 : 0, duration: 750 })

    /* The pitch fill would otherwise sit over the block it is meant to sit under. */
    map.setPaintProperty('sr-pitch-fill', 'fill-opacity', on('pitches') ? (showMass ? 0.34 : 0.62) : 0)

    if (key === 'locate') {
      const polys = polysOf(shape!)
      const [minX, minY, maxX, maxY] = bboxOf(polys)
      map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 46, duration: 700 })
    }
  }, [stage, ready, allStages]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- height caption marker ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || height == null) return
    const showMass = allStages[stage]?.key === 'height'
    massLabelRef.current?.remove()
    massLabelRef.current = null
    if (!showMass) return
    const centre = centroidOf(polysOf(shape!))
    if (!centre) return
    const el = document.createElement('div')
    el.className = 'height-label'
    el.innerHTML = `<strong>${height} m</strong><span>≈ ${Math.max(1, Math.round(height / STOREY_M))} storeys</span>`
    massLabelRef.current = new Marker({ element: el, offset: [0, -66] }).setLngLat(centre).addTo(map)
  }, [stage, ready, height, shape, allStages])

  if (!shape) return null

  return (
    <section className="section reveal-section">
      <div className="reveal-head">
        <h2>This site, to scale</h2>
        <div className="reveal-steps" role="tablist" aria-label="Site reveal stages">
          {allStages.map((s, i) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={i === stage}
              className={i === stage ? 'on' : i < stage ? 'done' : ''}
              onClick={() => setStage(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="reveal-map">
        <div ref={boxRef} className="reveal-canvas" aria-hidden="true" />
        {failed && <p className="reveal-fallback">The basemap could not be loaded.</p>}
      </div>
      <p className="reveal-caption">{allStages[stage]?.caption}</p>
      <div className="reveal-actions">
        <button
          className="reveal-btn"
          disabled={stage === 0}
          onClick={() => setStage((v) => Math.max(0, v - 1))}
        >
          ← Back
        </button>
        <button
          className="reveal-btn primary"
          disabled={stage >= allStages.length - 1}
          onClick={() => setStage((v) => Math.min(allStages.length - 1, v + 1))}
        >
          Next →
        </button>
      </div>
      <p className="figure-note">
        {tier === 1
          ? 'The outline is the official red line. The pitch grid and any building block are drawn by this site from sourced areas and heights — the block’s layout is illustrative.'
          : tier === 4
            ? 'The outline is a surveyed building, so its shape and position are evidence — of what is built, not of any application boundary. The pitch grid is drawn by this site.'
            : 'The outline is a projection: only its area is sourced. Its shape, orientation and parcel are drawn by this site and are not evidence of where the site’s edges lie.'}
      </p>
    </section>
  )
}
