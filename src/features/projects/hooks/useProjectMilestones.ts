import { useQuery } from '@tanstack/react-query'
import { getMilestonesByProject } from '../services/milestone.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProjectMilestones(projectId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.projects.milestones(projectId),
    queryFn: () => getMilestonesByProject(projectId),
    enabled: !!projectId && (options.enabled ?? true),
  })
}
