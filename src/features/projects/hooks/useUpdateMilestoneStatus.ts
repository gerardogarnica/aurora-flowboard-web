import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { updateMilestoneStatus } from '../services/milestone.service'
import type { MilestoneAction } from '../constants/milestone-status'
import type { ProjectMilestone } from '../types/milestone.types'

interface UpdateMilestoneStatusVars {
  milestoneId: string
  projectId: string
  status: MilestoneAction
}

export function useUpdateMilestoneStatus() {
  return useOptimisticMutation({
    mutationFn: ({ milestoneId, status }: UpdateMilestoneStatusVars) => updateMilestoneStatus(milestoneId, status),
    patches: ({ milestoneId, projectId, status }) => [
      cachePatch<ProjectMilestone[]>(queryKeys.projects.milestones(projectId), (old) =>
        old.map((m) => (m.id === milestoneId ? { ...m, status } : m)),
      ),
    ],
    // The Home lists only Active milestones.
    invalidate: ({ projectId }) => [
      { queryKey: queryKeys.projects.milestones(projectId) },
      { queryKey: queryKeys.dashboard() },
    ],
    errorMessage: 'Failed to update milestone status',
  })
}
