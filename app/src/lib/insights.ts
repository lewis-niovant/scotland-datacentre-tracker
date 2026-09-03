import type { Dataset } from './data'
import {
  STATUS_GROUP_META,
  STATUS_GROUPS,
  headlineCapacityMW,
  headlineEnergyGWh,
  headlineWaterM3,
  maturityNumber,
  publishedObjections,
  statusGroup,
} from './data'
import type { ProjectRecord, StatusGroup } from '../types'
import { hasLiveFormalApplication } from './planning'

export interface CapacitySummary {
  projects: number
  capacityMw: number
  capacityMinMw: number
  capacityMaxMw: number
  withCapacity: number
  claimStates: string[]
}

export interface StageInsight extends CapacitySummary {
  id: StatusGroup
  label: string
  colour: string
}

export interface RecentProjectUpdate {
  slug: string
  name: string
  authority: string
  status: string
  date: string
  headline: string
}

export interface OverviewInsights {
  totalProjects: number
  snapshotDate?: string
  operating: CapacitySummary
  activePipeline: CapacitySummary
  outsideActivePipeline: CapacitySummary
  stages: StageInsight[]
  planning: {
    projectsWithOfficialCase: number
    liveApplications: number
    formalOrBeyond: number
    earlyOrConcept: number
  }
  evidence: {
    totalSources: number
    officialSources: number
    recordCheckedProjects: number
    capacityProjects: number
    energyProjects: number
    waterProjects: number
    communityProjects: number
    recordedUnknowns: number
  }
  community: {
    projectsWithConcerns: number
    projectsWithPublishedObjections: number
    publishedObjectionsMinimum: number
    stakeholderPositions: number
    campaignGroups: string[]
  }
  recentUpdates: RecentProjectUpdate[]
}

const ACTIVE_PIPELINE_GROUPS = new Set<StatusGroup>(['consented', 'pending', 'pre_app'])

export function isActivePipelineProject(project: ProjectRecord): boolean {
  return ACTIVE_PIPELINE_GROUPS.has(statusGroup(project.project.status))
    && !(project.project.maturity_flags ?? []).includes('paused')
}

function summariseCapacity(projects: ProjectRecord[]): CapacitySummary {
  let capacityMinMw = 0
  let capacityMaxMw = 0
  let withCapacity = 0
  const claimStates = new Set<string>()

  for (const project of projects) {
    const capacity = headlineCapacityMW(project)
    if (!capacity) continue
    capacityMinMw += capacity.minimumMw
    capacityMaxMw += capacity.maximumMw
    withCapacity += 1
    claimStates.add(capacity.claim.state)
  }

  return {
    projects: projects.length,
    capacityMw: capacityMaxMw,
    capacityMinMw,
    capacityMaxMw,
    withCapacity,
    claimStates: [...claimStates].sort(),
  }
}

function hasOfficialPlanningCase(project: ProjectRecord): boolean {
  return (project.planning_cases ?? []).some((planningCase) => Boolean(planningCase.reference))
}

/**
 * Produce the small set of findings used by the public overview. All figures
 * are recomputed from the loaded snapshot so the narrative cannot drift when
 * the research data changes.
 */
export function deriveOverviewInsights(ds: Dataset): OverviewInsights {
  const projects = ds.observatory.projects
  const operatingProjects = projects.filter((project) => statusGroup(project.project.status) === 'operating')
  const pipelineProjects = projects.filter(isActivePipelineProject)
  const outsidePipelineProjects = projects.filter((project) => {
    const group = statusGroup(project.project.status)
    return group !== 'operating' && !isActivePipelineProject(project)
  })

  const stages = STATUS_GROUPS.map((id): StageInsight => {
    const inStage = projects.filter((project) => statusGroup(project.project.status) === id)
    return {
      id,
      label: STATUS_GROUP_META[id].label,
      colour: STATUS_GROUP_META[id].color,
      ...summariseCapacity(inStage),
    }
  }).filter((stage) => stage.projects > 0)

  const sources = Object.values(ds.observatory.sources ?? {})
  const projectsWithConcerns = projects.filter(
    (project) => (project.community?.principal_concerns?.length ?? 0) > 0,
  )
  const projectsWithObjections = projects.filter((project) => publishedObjections(project) != null)
  const campaignGroups = new Set<string>()
  let stakeholderPositions = 0
  let publishedObjectionsMinimum = 0

  for (const project of projects) {
    for (const group of project.community?.campaign_groups ?? []) campaignGroups.add(group)
    stakeholderPositions += project.community?.stakeholder_positions?.length ?? 0
    publishedObjectionsMinimum += publishedObjections(project) ?? 0
  }

  const recentUpdates = projects
    .flatMap((project): RecentProjectUpdate[] => {
      const update = project.project.latest_development
      if (!update?.date || !update.headline) return []
      return [{
        slug: project.project.slug,
        name: project.project.display_name ?? project.project.canonical_name,
        authority: project.project.local_authority,
        status: project.project.status,
        date: update.date,
        headline: update.headline,
      }]
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  return {
    totalProjects: projects.length,
    snapshotDate: ds.observatory.constants?.snapshot_date ?? ds.observatory.generated_from_snapshot,
    operating: summariseCapacity(operatingProjects),
    activePipeline: summariseCapacity(pipelineProjects),
    outsideActivePipeline: summariseCapacity(outsidePipelineProjects),
    stages,
    planning: {
      projectsWithOfficialCase: projects.filter(hasOfficialPlanningCase).length,
      liveApplications: projects.filter(hasLiveFormalApplication).length,
      formalOrBeyond: projects.filter((project) => maturityNumber(project.project.maturity_level) >= 2).length,
      earlyOrConcept: projects.filter((project) => maturityNumber(project.project.maturity_level) < 2).length,
    },
    evidence: {
      totalSources: sources.length,
      officialSources: sources.filter((source) => (source.reliability_tier ?? 99) <= 2).length,
      recordCheckedProjects: projects.filter((project) => project.project.verification_level === 'verified').length,
      capacityProjects: projects.filter((project) => headlineCapacityMW(project) != null).length,
      energyProjects: projects.filter((project) => headlineEnergyGWh(project) != null).length,
      waterProjects: projects.filter((project) => headlineWaterM3(project) != null).length,
      communityProjects: projects.filter((project) => project.community != null).length,
      recordedUnknowns: projects.reduce((total, project) => total + (project.project.unknowns?.length ?? 0), 0),
    },
    community: {
      projectsWithConcerns: projectsWithConcerns.length,
      projectsWithPublishedObjections: projectsWithObjections.length,
      publishedObjectionsMinimum,
      stakeholderPositions,
      campaignGroups: [...campaignGroups].sort((a, b) => a.localeCompare(b)),
    },
    recentUpdates,
  }
}
