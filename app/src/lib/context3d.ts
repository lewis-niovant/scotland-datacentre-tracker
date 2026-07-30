import type { Map as MapLibreMap } from 'maplibre-gl'

/* Satellite imagery, terrain and surrounding-building context.

   The whole point of showing a data centre's height is comparison: a 25 m hall
   means nothing on a blank grey map and everything next to the houses across
   the road. Three keyless layers provide that context:

   - Esri World Imagery raster tiles (attribution required, no API key), slotted
     UNDER the basemap's labels so place and street names stay readable.
   - AWS Open Data terrain tiles (Terrarium encoding) as a raster-dem source,
     so the ground itself has relief when tilted.
   - The basemap's own OpenMapTiles `building` layer extruded with OSM
     `render_height`, so the real buildings around a site stand up next to the
     indicative mass and the size contrast is visible rather than asserted. */

export const SAT_LAYER = 'ctx-satellite'
const SAT_SOURCE = 'ctx-satellite'
const DEM_SOURCE = 'ctx-dem'
export const OSM3D_LAYER = 'ctx-osm-buildings'

const ESRI_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_ATTRIB =
  'Imagery © Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community'
const DEM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
const DEM_ATTRIB = 'Terrain © Mapzen / AWS Open Data'

/** The style's vector source, found via any layer drawing the `building`
    source-layer, else the first vector source. Detected rather than hardcoded
    so a basemap style update cannot silently break the 3D context. */
function vectorSourceName(map: MapLibreMap): string | null {
  const style = map.getStyle()
  for (const l of style.layers ?? []) {
    const withSrc = l as { 'source-layer'?: string; source?: string }
    if (withSrc['source-layer'] === 'building' && typeof withSrc.source === 'string') {
      return withSrc.source
    }
  }
  const v = Object.entries(style.sources ?? {})
    .find(([, s]) => (s as { type?: string }).type === 'vector')
  return v ? v[0] : null
}

/** Adds the context sources and layers, all hidden. Call once, after 'load'. */
export function addContextLayers(map: MapLibreMap): void {
  if (map.getSource(SAT_SOURCE)) return
  map.addSource(SAT_SOURCE, {
    type: 'raster', tiles: [ESRI_TILES], tileSize: 256, maxzoom: 19, attribution: ESRI_ATTRIB,
  })
  map.addSource(DEM_SOURCE, {
    type: 'raster-dem', tiles: [DEM_TILES], encoding: 'terrarium',
    tileSize: 256, maxzoom: 15, attribution: DEM_ATTRIB,
  })
  /* Under the first symbol layer: imagery replaces the cartography but the
     basemap's labels keep working on top of it. */
  const firstSymbol = (map.getStyle().layers ?? []).find((l) => l.type === 'symbol')?.id
  map.addLayer({
    id: SAT_LAYER, type: 'raster', source: SAT_SOURCE,
    layout: { visibility: 'none' },
    paint: { 'raster-fade-duration': 300 },
  }, firstSymbol)

  const src = vectorSourceName(map)
  if (src) {
    map.addLayer({
      id: OSM3D_LAYER, type: 'fill-extrusion', source: src, 'source-layer': 'building',
      minzoom: 13,
      layout: { visibility: 'none' },
      paint: {
        /* Muted and matte: context, never the subject. */
        'fill-extrusion-color': '#b9b2a8',
        'fill-extrusion-opacity': 0.72,
        'fill-extrusion-height': ['coalesce', ['to-number', ['get', 'render_height']], 5],
        'fill-extrusion-base': ['coalesce', ['to-number', ['get', 'render_min_height']], 0],
      },
    })
  }
}

export function setSatellite(map: MapLibreMap, on: boolean): void {
  if (map.getLayer(SAT_LAYER)) {
    map.setLayoutProperty(SAT_LAYER, 'visibility', on ? 'visible' : 'none')
  }
}

/** Surrounding OSM buildings and ground relief, together: they only make sense
    tilted, and they are what makes a published height legible as height. */
export function setContext3D(map: MapLibreMap, opts: { buildings: boolean; terrain: boolean }): void {
  if (map.getLayer(OSM3D_LAYER)) {
    map.setLayoutProperty(OSM3D_LAYER, 'visibility', opts.buildings ? 'visible' : 'none')
  }
  try {
    map.setTerrain(opts.terrain && map.getSource(DEM_SOURCE)
      ? { source: DEM_SOURCE, exaggeration: 1 }
      : null)
  } catch { /* terrain unsupported: flat map is a fine fallback */ }
}
