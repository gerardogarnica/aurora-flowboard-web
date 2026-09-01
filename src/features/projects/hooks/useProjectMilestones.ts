import { useQuery } from '@tanstack/react-query'
import { getMilestonesByProject } from '../services/milestone.service'

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => getMilestonesByProject(projectId),
    enabled: !!projectId,
  })
}
