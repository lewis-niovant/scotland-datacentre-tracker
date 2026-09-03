import type { StatusGroup } from '../types'

export interface Filters {
  groups: StatusGroup[]
  developer: string
  authority: string
}

export const EMPTY_FILTERS: Filters = { groups: [], developer: '', authority: '' }
