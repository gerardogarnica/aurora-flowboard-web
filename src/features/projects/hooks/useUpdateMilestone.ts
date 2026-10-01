import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { updateMilestone } from '../services/milestone.service'
import type { MilestoneRequest, ProjectMilestone } from '../types/milestone.types'

interface UpdateMilestoneVars {
  milestoneId: string
  projectId: string
  payload: MilestoneRequest
}

export function useUpdateMilestone() {
  return useOptimisticMutation({
    mutationFn: ({ milestoneId, payload }: UpdateMilestoneVars) => updateMilestone(milestoneId, payload),
    patches: ({ milestoneId, projectId, payload }) => [
      cachePatch<ProjectMilestone[]>(queryKeys.projects.milestones(projectId), (old) =>
        old.map((m) => (m.id === milestoneId ? { ...m, ...payload } : m)),
      ),
    ],
    // Board cards and the work-item detail show the milestone's name and color.
    invalidate: ({ projectId }) => [
      { queryKey: queryKeys.projects.milestones(projectId) },
      { queryKey: queryKeys.projects.board(projectId), refetchType: 'all' },
      { queryKey: queryKeys.workItems.all() },
    ],
    errorMessage: 'Failed to update milestone',
  })
}
