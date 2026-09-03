import type { ProjectRecord, StatusGroup } from '../types'
import {
  fmtInt, fmtMWRange, fmtRangeMW, headlineCapacityMW, projectCoords, publishedObjections,
  statusGroup, sumHeadlineCapacity,
} from './data'
import { isActivePipelineProject } from './insights'

const STORAGE_KEY = 'sdo-intro-dismissed-v1'

export function introDismissed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

export function rememberIntroDismissed(): void {
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
}

export interface TourState {
  groups: StatusGroup[]
  showPitches: boolean
  threeD: boolean
  /** Slug whose objection bubble should open itself on this beat. */
  openObjections?: string | null
  camera: { center?: [number, number]; zoom?: number; pitch?: number; national?: boolean }
}

export interface Beat {
  kicker: string
  title: string
  body: string
  state: TourState
}

const BASE: TourState = {
  groups: [], showPitches: false, threeD: false, openObjections: null,
  camera: { national: true },
}

/** Builds the script from the live dataset. `boundarySlugs` are the projects
    holding an official red line, so the tour can pick a site whose beats all
    have something to show. */
export function buildScript(projects: ProjectRecord[], boundarySlugs: Set<string>): Beat[] {
  const hasBoundary = (slug: string) => boundarySlugs.has(slug)
  const total = projects.length
  const operating = projects.filter((p) => statusGroup(p.project.status) === 'operating')
  const activePipeline = projects.filter(isActivePipelineProject)
  const outsidePipeline = projects.filter(
    (p) => statusGroup(p.project.status) !== 'operating' && !isActivePipelineProject(p),
  )
  const pipelineCapacity = sumHeadlineCapacity(activePipeline)
  /* These status groups contain the active projects. Paused and finally refused
     records map to different groups, so they stay out of this tour beat. */
  const PROPOSAL_GROUPS: StatusGroup[] = [
    ...new Set(activePipeline.map((p) => statusGroup(p.project.status))),
  ]

  /* The headline site is chosen for the strength of its record, not for the
     biggest number. Score the evidence first, break ties on capacity. */
  const evidenceScore = (p: ProjectRecord) =>
    (hasBoundary(p.project.slug) ? 4 : 0)
    + (typeof p.site?.max_building_height_m?.value === 'number' ? 2 : 0)
    + (publishedObjections(p) != null ? 2 : 0)
    + ((p.community?.principal_concerns?.length ?? 0) > 0 ? 1 : 0)

  const biggest = projects
    .filter(isActivePipelineProject)
    .reduce<ProjectRecord | null>((best, p) => {
      if (!best) return p
      const d = evidenceScore(p) - evidenceScore(best)
      if (d !== 0) return d > 0 ? p : best
      return (headlineCapacityMW(p)?.mw ?? 0) > (headlineCapacityMW(best)?.mw ?? 0) ? p : best
    }, null)
  const bigName = biggest ? biggest.project.display_name ?? biggest.project.canonical_name : ''
  const bigCapacity = biggest ? headlineCapacityMW(biggest) : null
  const bigCoords = biggest ? projectCoords(biggest) : null
  const bigHeight = biggest?.site?.max_building_height_m?.value
  const bigObjections = biggest ? publishedObjections(biggest) : null
  const bigSlug = biggest?.project.slug ?? null

  const beats: Beat[] = [
    {
      kicker: 'Scotland Data Centre Observatory',
      title: `${total} data centre projects, mapped`,
      body: `From halls already running to gigawatt-scale concepts. The active pipeline carries ${pipelineCapacity.projects ? fmtMWRange(pipelineCapacity.minimumMw, pipelineCapacity.maximumMw) : 'no usable total'} in mixed headline capacity claims. Every figure is sourced and labelled with how much weight it can bear.`,
      state: { ...BASE },
    },
    {
      kicker: 'What exists today',
      title: `${operating.length} are actually operating`,
      body: 'These are the data centres Scotland already has. Filter chips work like this — tap one and everything on the map, including the totals above, moves with it.',
      state: { ...BASE, groups: ['operating'] },
    },
    {
      kicker: 'What is being proposed',
      title: `${activePipeline.length} are in the active pipeline`,
      body: `${outsidePipeline.length} other non-operating records are kept separately: finally refused, paused, speculative or grid-only. Pipeline inclusion is not a prediction that a project will be built.`,
      state: { ...BASE, groups: PROPOSAL_GROUPS },
    },
  ]

  if (biggest && bigCoords) {
    beats.push({
      kicker: 'An evidence-rich case',
      title: `${bigName}${bigCapacity ? ` — ${fmtRangeMW(bigCapacity.claim)} claimed` : ''}`,
      body: 'Zoom in and the official red-line boundary appears: the outline submitted with the planning application, from Spatial Hub Scotland.',
      state: { ...BASE, groups: PROPOSAL_GROUPS, camera: { center: bigCoords, zoom: 13.4 } },
    })
    beats.push({
      kicker: 'How big is that?',
      title: 'Counted in football pitches',
      body: 'The grid fills the real boundary with 105 × 68 m pitches, so the area means something without needing to picture a hectare.',
      state: { ...BASE, groups: PROPOSAL_GROUPS, showPitches: true, camera: { center: bigCoords, zoom: 13.4 } },
    })
    if (typeof bigHeight === 'number') {
      beats.push({
        kicker: 'And how tall',
        title: `Buildings up to ${bigHeight} m`,
        body: `Roughly ${Math.round(bigHeight / 3.5)} storeys. The 3D button tilts the map and stands the published height up on the site.`,
        state: { ...BASE, groups: PROPOSAL_GROUPS, threeD: true, camera: { center: bigCoords, zoom: 15.1, pitch: 62 } },
      })
    }
    beats.push({
      kicker: 'What people said',
      title: bigObjections != null
        ? `${fmtInt(bigObjections)}+ published objections`
        : 'Communities have objected',
      body: 'Zoom in anywhere and megaphone bubbles appear on sites where objections are on record. Open one to read the concerns raised, the developer’s response, and a link to every source.',
      state: {
        ...BASE, openObjections: bigSlug,
        camera: { center: bigCoords, zoom: 12.6 },
      },
    })
  }

  beats.push({
    kicker: 'Over to you',
    title: 'The map is yours',
    body: 'Zoom into any one site and the map switches itself to a close-up view — satellite imagery, football pitches, 3D. Tap any site for its full profile and its sources, and replay this tour any time with the ? button.',
    state: { ...BASE },
  })
  return beats
}
