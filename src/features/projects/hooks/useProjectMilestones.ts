import { useQuery } from '@tanstack/react-query'
import { getMilestonesByProject } from '../services/milestone.service'

export function useProjectMilestones(projectId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => getMilestonesByProject(projectId),
    enabled: !!projectId && (options.enabled ?? true),
  })
}
