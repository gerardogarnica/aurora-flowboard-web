import { updateWorkItemMilestone } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

interface UpdateMilestoneVars {
  milestoneId: string | null
  milestoneName: string | null
  milestoneColor: string | null
}

export function useUpdateWorkItemMilestone(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: ({ milestoneId }: UpdateMilestoneVars) => updateWorkItemMilestone(workItemId, milestoneId),
    patchDetail: ({ milestoneId, milestoneName, milestoneColor }) => ({ milestoneId, milestoneName, milestoneColor }),
    // The card has no milestone id, only what it renders.
    patchCard: ({ milestoneName, milestoneColor }) => ({ milestoneName, milestoneColor }),
  })
}
