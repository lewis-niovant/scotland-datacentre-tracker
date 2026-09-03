import type { ProjectRecord } from '../types'

/** Sites with nothing recorded get no community-story marker: an empty marker
    would imply "no objections" when it usually means "not yet researched". */
export function hasObjectionStory(p: ProjectRecord): boolean {
  return (p.community?.principal_concerns?.length ?? 0) > 0
}
