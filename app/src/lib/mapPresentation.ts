export const SCOTLAND_BOUNDS: [[number, number], [number, number]] = [[-7.9, 54.6], [-0.6, 60.95]]

/* Official red line — reserved to sourced Spatial Hub boundaries only. Projections
   are deliberately drawn in another colour AND another line style, so a projection
   can never be mistaken for a red line, including by a colour-blind reader. */
export const REDLINE = '#c0242d'
/** Tier 2 — projected extent from a sourced area on a reliable point. Dashed. */
export const EXTENT2 = '#9a5b12'
/** Tier 3 — projected extent, settlement-level location. Dotted, fainter, unfilled. */
export const EXTENT3 = '#6b6560'
/** Tier 4 — a surveyed OSM outline of what is actually built. */
export const OSM_BUILT = '#1f7a6f'
/** Zoom at which real boundaries appear (the national view stays clean). */
export const BOUNDARY_MIN_ZOOM = 9
/** Zoom at which the derived pitch grid appears. */
export const PITCH_MIN_ZOOM = 12
/** Block drawn for a site that publishes a height but no footprint: 120 m square. */
export const NOMINAL_BLOCK_M2 = 120 * 120
