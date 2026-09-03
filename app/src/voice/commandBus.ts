import type { Map as MapLibreMap } from 'maplibre-gl'
import type { LensId } from '../types'
import type { Filters } from '../lib/filterState'

/* The voice agent's tools run outside React, but everything they need to
   change lives as state inside MapPage. This bus is the seam between the two:
   MapPage registers a getter for its current handler set (so the handlers are
   never stale), and tools call `dashboard()` to act. */

export interface DashboardState {
  lens: LensId
  filters: Filters
  selectedSlug: string | null
  focusSlug: string | null
  satellite: boolean
  threeD: boolean
  showPitches: boolean
  tourRunning: boolean
  /** Slugs surviving the current filters — what the map is actually showing. */
  visibleSlugs: string[]
  camera: { center: [number, number]; zoom: number } | null
}

export interface DashboardHandlers {
  setLens(id: LensId): void
  /** Merge a partial filter change into the current filters. */
  setFilters(next: Partial<Filters>): void
  clearFilters(): void
  /** Select a site and fly the camera to it (clears filters that hide it). */
  flyToSite(slug: string): void
  /** Deselect and fit the national view. */
  showScotland(): void
  setLayer(layer: 'satellite' | 'threeD' | 'pitches', on: boolean): void
  /** Open the community-objections popup for a site (null closes). */
  openObjections(slug: string | null): void
  /** Navigate to the site's full profile page. */
  openProfile(slug: string): void
  /** Abandon any choreographed flight in progress, so a new camera move is
      not overridden when the old flight's arrival handler finally fires. */
  cancelFlight(): void
  startTour(): void
  /** Apply one beat of the guided-tour script (state + camera) WITHOUT the
      scripted overlay — the voice guide narrates it instead. Returns the
      beat's script text, or null when the index is out of range. */
  runTourBeat(index: number): { kicker: string; title: string; body: string; index: number; total: number } | null
  getState(): DashboardState
  /** The live MapLibre map, for visual effects (spotlight, reveal). */
  getMap(): MapLibreMap | null
}

let getHandlers: (() => DashboardHandlers) | null = null

export function registerDashboard(get: () => DashboardHandlers): () => void {
  getHandlers = get
  return () => { if (getHandlers === get) getHandlers = null }
}

export function dashboard(): DashboardHandlers {
  if (!getHandlers) throw new Error('The map page is not open, so the dashboard cannot be controlled right now.')
  return getHandlers()
}

/* Dev-only escape hatch so the command bus can be driven from the console and
   from Playwright without a live voice session. */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __sdoDashboard?: () => DashboardHandlers }).__sdoDashboard = dashboard
}

/* Adaptive UI: MapPage listens here to briefly surface the chrome the agent
   just touched (stats strip after a lens change, chips after a filter). */

type ActionListener = (action: string) => void
const listeners = new Set<ActionListener>()

export function onAgentAction(cb: ActionListener): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function noteAgentAction(action: string): void {
  for (const cb of listeners) cb(action)
}
