import { useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { ProjectRecord, StatusGroup } from '../types'
import { fmtInt, fmtMW, headlineCapacityMW, projectCoords, publishedObjections, statusGroup } from '../lib/data'

/* The guided tour: a short scripted flight that shows what the map can do by
   doing it, rather than describing it in a card of tips.

   Each beat declares the state it wants — camera, filters, overlays — and the
   page applies it. The tour never holds state the user cannot then change: when
   it ends, whatever is on screen is a live map they now know how to drive.

   Every number quoted is read from the dataset at runtime, so the script cannot
   drift away from the data the way hardcoded copy would. */

const STORAGE_KEY = 'sdo-intro-dismissed-v1'

export function introDismissed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

function remember() {
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
}

export interface TourState {
  groups: StatusGroup[]
  showPitches: boolean
  threeD: boolean
  showObjections: boolean
  /** Slug whose objection bubble should open itself on this beat. */
  openObjections?: string | null
  camera: { center?: [number, number]; zoom?: number; pitch?: number; national?: boolean }
}

export interface Beat {
  kicker: string
  title: string
  body: string
  state: TourState
  /** Milliseconds before auto-advancing. */
  hold: number
}

/** Everything that is not already running — the beat about proposals should
    show the proposals, not silently fall back to all 39. */
const PROPOSAL_GROUPS: StatusGroup[] = ['consented', 'pending', 'pre_app', 'refused', 'speculative']

const BASE: TourState = {
  groups: [], showPitches: false, threeD: false, showObjections: false, openObjections: null,
  camera: { national: true },
}

/** Builds the script from the live dataset. `boundarySlugs` are the projects
    holding an official red line, so the tour can pick a site whose beats all
    have something to show. */
export function buildScript(projects: ProjectRecord[], boundarySlugs: Set<string>): Beat[] {
  const hasBoundary = (slug: string) => boundarySlugs.has(slug)
  const total = projects.length
  const operating = projects.filter((p) => statusGroup(p.project.status) === 'operating')
  const totalMW = projects.reduce((t, p) => t + (headlineCapacityMW(p)?.mw ?? 0), 0)

  /* The headline site is chosen for the strength of its record, not for the
     biggest number. The beats that follow show a red-line boundary, a building
     height and published objections, so a site missing those makes the tour
     demonstrate features against blanks — which is exactly what picking purely
     on claimed MW did. Score the evidence first, break ties on capacity. */
  const evidenceScore = (p: ProjectRecord) =>
    (hasBoundary(p.project.slug) ? 4 : 0)
    + (typeof p.site?.max_building_height_m?.value === 'number' ? 2 : 0)
    + (publishedObjections(p) != null ? 2 : 0)
    + ((p.community?.principal_concerns?.length ?? 0) > 0 ? 1 : 0)

  const biggest = projects
    .filter((p) => statusGroup(p.project.status) !== 'operating')
    .reduce<ProjectRecord | null>((best, p) => {
      if (!best) return p
      const d = evidenceScore(p) - evidenceScore(best)
      if (d !== 0) return d > 0 ? p : best
      return (headlineCapacityMW(p)?.mw ?? 0) > (headlineCapacityMW(best)?.mw ?? 0) ? p : best
    }, null)
  const bigName = biggest ? biggest.project.display_name ?? biggest.project.canonical_name : ''
  const bigMW = biggest ? headlineCapacityMW(biggest)?.mw ?? 0 : 0
  const bigCoords = biggest ? projectCoords(biggest) : null
  const bigHeight = biggest?.site?.max_building_height_m?.value
  const bigObjections = biggest ? publishedObjections(biggest) : null
  const bigSlug = biggest?.project.slug ?? null

  const beats: Beat[] = [
    {
      kicker: 'Scotland Data Centre Observatory',
      title: `${total} data centre projects, mapped`,
      body: `From halls already running to gigawatt-scale concepts — ${fmtMW(totalMW)} of claimed capacity in total. Every figure is sourced, and every claim is labelled with how much weight it can bear.`,
      state: { ...BASE },
      hold: 5200,
    },
    {
      kicker: 'What exists today',
      title: `${operating.length} are actually operating`,
      body: 'These are the data centres Scotland already has. Filter chips work like this — tap one and everything on the map, including the totals above, moves with it.',
      state: { ...BASE, groups: ['operating'] },
      hold: 5200,
    },
    {
      kicker: 'What is being proposed',
      title: `The other ${total - operating.length} are proposals`,
      body: 'Announcements, screening opinions, live applications and speculative grid enquiries. Most will never be built — the map shows how far each has actually got.',
      state: { ...BASE, groups: PROPOSAL_GROUPS },
      hold: 5200,
    },
  ]

  if (biggest && bigCoords) {
    beats.push({
      kicker: 'The largest proposal',
      title: `${bigName} — ${fmtMW(bigMW)} claimed`,
      body: 'Zoom in and the official red-line boundary appears: the outline submitted with the planning application, from Spatial Hub Scotland.',
      state: { ...BASE, groups: PROPOSAL_GROUPS, camera: { center: bigCoords, zoom: 13.4 } },
      hold: 6000,
    })
    beats.push({
      kicker: 'How big is that?',
      title: 'Counted in football pitches',
      body: 'The grid fills the real boundary with 105 × 68 m pitches, so the area means something without needing to picture a hectare.',
      state: { ...BASE, groups: PROPOSAL_GROUPS, showPitches: true, camera: { center: bigCoords, zoom: 13.4 } },
      hold: 6000,
    })
    if (typeof bigHeight === 'number') {
      beats.push({
        kicker: 'And how tall',
        title: `Buildings up to ${bigHeight} m`,
        body: `Roughly ${Math.round(bigHeight / 3.5)} storeys. The 3D button tilts the map and stands the published height up on the site.`,
        state: { ...BASE, groups: PROPOSAL_GROUPS, threeD: true, camera: { center: bigCoords, zoom: 15.1, pitch: 62 } },
        hold: 6000,
      })
    }
    beats.push({
      kicker: 'What people said',
      title: bigObjections != null
        ? `${fmtInt(bigObjections)}+ published objections`
        : 'Communities have objected',
      body: 'Megaphone bubbles mark sites where objections are on record. Open one to read the concerns raised, the developer’s response, and a link to every source.',
      state: {
        ...BASE, showObjections: true, openObjections: bigSlug,
        camera: { center: bigCoords, zoom: 12.6 },
      },
      hold: 7000,
    })
  }

  beats.push({
    kicker: 'Over to you',
    title: 'The map is yours',
    body: 'Switch lenses to see the same sites by electricity, water, money or planning status. Tap any site for its full profile and its sources.',
    state: { ...BASE, showObjections: true },
    hold: 5200,
  })
  return beats
}

interface Props {
  projects: ProjectRecord[]
  /** Slugs with an official red line, used to pick the headline site. */
  boundarySlugs: Set<string>
  map: MapLibreMap | null
  onState: (s: TourState) => void
  onDone: () => void
}

export default function GuidedTour({ projects, boundarySlugs, map, onState, onDone }: Props) {
  const scriptRef = useRef<Beat[]>(buildScript(projects, boundarySlugs))
  const script = scriptRef.current
  const [i, setI] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const onStateRef = useRef(onState)
  onStateRef.current = onState

  const beat = script[i]
  const last = i >= script.length - 1

  const finish = () => {
    remember()
    setLeaving(true)
    window.setTimeout(onDone, 260)
  }

  /* Apply this beat's state, then move the camera. */
  useEffect(() => {
    if (!beat) return
    onStateRef.current(beat.state)
    if (!map) return
    const c = beat.state.camera
    if (c.national) {
      map.easeTo({ pitch: 0, duration: 900 })
      map.fitBounds([[-7.9, 54.6], [-0.6, 60.95]], {
        padding: { top: 190, bottom: 130, left: 44, right: 60 }, duration: 1400,
      })
    } else if (c.center) {
      map.easeTo({
        center: c.center, zoom: c.zoom ?? 13, pitch: c.pitch ?? 0, duration: 1900, essential: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, map])

  /* Auto-advance, but any interaction with the panel stops the clock — a reader
     who wants to sit on a beat should not be dragged off it. */
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (!beat || paused || leaving) return
    if (last) return
    const t = window.setTimeout(() => setI((v) => v + 1), beat.hold)
    return () => window.clearTimeout(t)
  }, [i, paused, leaving, beat, last])

  if (!beat) return null

  return (
    <div
      className={`tour${leaving ? ' leaving' : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label="Guided introduction"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tour-card">
        <div className="tour-progress" aria-hidden="true">
          {script.map((_, n) => (
            <span key={n} className={n === i ? 'on' : n < i ? 'done' : ''} />
          ))}
        </div>
        <p className="tour-kicker">{beat.kicker}</p>
        <h2>{beat.title}</h2>
        <p className="tour-body">{beat.body}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={finish}>
            {last ? 'Close' : 'Skip intro'}
          </button>
          {!last && (
            <button className="tour-next" onClick={() => setI((v) => v + 1)}>
              Next →
            </button>
          )}
          {last && <button className="tour-next" onClick={finish}>Explore the map</button>}
        </div>
      </div>
    </div>
  )
}
