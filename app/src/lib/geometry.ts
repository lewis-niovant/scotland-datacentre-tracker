/* Client-side geometry helpers.

   Everything here is derived, not sourced: the football-pitch grid and the
   indicative building masses are *drawn by this app* from sourced numbers
   (official red-line polygons, published footprints and heights). Captions in
   the UI must say so — see AboutPage's "no false precision" commitment. */

import type { GeoCollection, GeoFeature } from '../types'

export type Position = [number, number]
export type Ring = Position[]
/** A polygon: outer ring first, then any holes. */
export type Poly = Ring[]

const M_PER_DEG_LAT = 110540
function mPerDegLon(lat: number): number {
  return 111320 * Math.cos((lat * Math.PI) / 180)
}

/* ------------------------------------------------------------------ */
/* Extraction                                                         */
/* ------------------------------------------------------------------ */

export function polysOf(f: GeoFeature): Poly[] {
  const g = f.geometry as { type: string; coordinates: unknown }
  if (g?.type === 'Polygon') return [g.coordinates as Poly]
  if (g?.type === 'MultiPolygon') return g.coordinates as Poly[]
  return []
}

export function boundaryFeatures(geo: GeoCollection): GeoFeature[] {
  return geo.features.filter(
    (f) =>
      f?.properties?.kind === 'boundary' &&
      (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'),
  )
}

/** The boundary a profile page should quote: the primary one, else the largest. */
export function primaryBoundary(geo: GeoCollection, slug: string): GeoFeature | null {
  const mine = boundaryFeatures(geo).filter((f) => f.properties.slug === slug)
  if (!mine.length) return null
  return (
    mine.find((f) => f.properties.is_primary) ??
    mine.reduce((a, b) => ((b.properties.official_area_m2 ?? 0) > (a.properties.official_area_m2 ?? 0) ? b : a))
  )
}

export function bboxOf(polys: Poly[]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const poly of polys) {
    for (const [x, y] of poly[0] ?? []) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return [minX, minY, maxX, maxY]
}

/** Area-free centroid: mean of the largest outer ring's vertices. Good enough
    for placing indicative masses; never presented as a surveyed location. */
export function centroidOf(polys: Poly[]): Position | null {
  let best: Ring | null = null
  for (const poly of polys) {
    const r = poly[0]
    if (r && (!best || r.length > best.length)) best = r
  }
  if (!best || !best.length) return null
  let sx = 0, sy = 0
  for (const [x, y] of best) { sx += x; sy += y }
  return [sx / best.length, sy / best.length]
}

/* ------------------------------------------------------------------ */
/* Point in polygon (ray casting, holes respected)                    */
/* ------------------------------------------------------------------ */

function inRing(pt: Position, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function pointInPoly(pt: Position, poly: Poly): boolean {
  if (!poly.length || !inRing(pt, poly[0])) return false
  for (let h = 1; h < poly.length; h++) if (inRing(pt, poly[h])) return false
  return true
}

export function pointInAny(pt: Position, polys: Poly[]): boolean {
  return polys.some((poly) => pointInPoly(pt, poly))
}

/* ------------------------------------------------------------------ */
/* Football-pitch grid                                                */
/* ------------------------------------------------------------------ */

/** Pitch dimensions derived from the dataset constant, so a change to
    `constants.comparisons.football_pitch_m2` flows through. */
export function pitchDims(pitchM2: number): { w: number; h: number } {
  const s = Math.sqrt(pitchM2 / (105 * 68))
  return { w: 105 * s, h: 68 * s }
}

const MAX_CELLS = 4000

/** Tiles complete pitch-sized cells across each boundary's bbox and keeps the
    ones whose centre falls inside the polygon. */
export function pitchGrid(features: GeoFeature[], pitchM2: number): GeoCollection {
  const out: GeoFeature[] = []
  for (const f of features) {
    const polys = polysOf(f)
    if (!polys.length) continue
    const [minX, minY, maxX, maxY] = bboxOf(polys)
    if (!Number.isFinite(minX)) continue
    const midLat = (minY + maxY) / 2
    const { w, h } = pitchDims(pitchM2)
    const dLon = w / mPerDegLon(midLat)
    const dLat = h / M_PER_DEG_LAT
    if (!Number.isFinite(dLon) || dLon <= 0) continue
    const cols = Math.floor((maxX - minX) / dLon)
    const rows = Math.floor((maxY - minY) / dLat)
    if (cols * rows > 250000) continue // pathological; skip rather than hang
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = minX + c * dLon
        const y0 = minY + r * dLat
        const cx = x0 + dLon / 2
        const cy = y0 + dLat / 2
        if (!pointInAny([cx, cy], polys)) continue
        out.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [x0, y0], [x0 + dLon, y0], [x0 + dLon, y0 + dLat], [x0, y0 + dLat], [x0, y0],
            ]],
          },
          properties: { kind: 'building', slug: f.properties.slug },
        })
        if (out.length >= MAX_CELLS) return { type: 'FeatureCollection', features: out }
      }
    }
  }
  return { type: 'FeatureCollection', features: out }
}

/* ------------------------------------------------------------------ */
/* Indicative building masses                                         */
/* ------------------------------------------------------------------ */

export interface MassSpec {
  slug: string
  name: string
  centre: Position
  footprintM2: number
  heightM: number
  buildings: number
}

/** Splits the published footprint into `buildings` equal square masses laid out
    on a compact grid around `centre`. Footprint and height are sourced; the
    layout is invented and captioned as such everywhere it is shown. */
export function buildingMasses(specs: MassSpec[]): GeoCollection {
  const features: GeoFeature[] = []
  for (const s of specs) {
    const n = Math.max(1, Math.min(12, Math.round(s.buildings)))
    const side = Math.sqrt(s.footprintM2 / n)
    if (!Number.isFinite(side) || side <= 0) continue
    const gap = side * 0.3
    const cols = Math.ceil(Math.sqrt(n))
    const rows = Math.ceil(n / cols)
    const [lon, lat] = s.centre
    const dx = 1 / mPerDegLon(lat)
    const dy = 1 / M_PER_DEG_LAT
    const totalW = cols * side + (cols - 1) * gap
    const totalH = rows * side + (rows - 1) * gap
    for (let i = 0; i < n; i++) {
      const c = i % cols
      const r = Math.floor(i / cols)
      const ox = -totalW / 2 + c * (side + gap)
      const oy = -totalH / 2 + r * (side + gap)
      const x0 = lon + ox * dx
      const y0 = lat + oy * dy
      const x1 = lon + (ox + side) * dx
      const y1 = lat + (oy + side) * dy
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] },
        properties: {
          kind: 'building',
          slug: s.slug,
          name: s.name,
          height: s.heightM,
          indicative: true,
        },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}
