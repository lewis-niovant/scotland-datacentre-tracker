import type { ProjectRecord } from '../types'

const FORMAL_APPLICATION_TYPES = new Set([
  'full_application',
  'permission_in_principle',
  'msc',
  'variation',
  's36',
  's37',
])

/**
 * Whether a project has a referenced formal application still awaiting its
 * decision. PAN, EIA screening/scoping and appeal records are deliberately
 * excluded: they are live planning activity, but not live applications.
 */
export function hasLiveFormalApplication(project: ProjectRecord): boolean {
  return (project.planning_cases ?? []).some((planningCase) =>
    typeof planningCase.reference === 'string'
    && planningCase.reference.trim().length > 0
    && planningCase.decision === 'pending'
    && typeof planningCase.application_type === 'string'
    && FORMAL_APPLICATION_TYPES.has(planningCase.application_type))
}
