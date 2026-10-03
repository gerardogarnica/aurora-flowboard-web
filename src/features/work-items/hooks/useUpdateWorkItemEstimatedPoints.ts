import { updateWorkItemEstimatedPoints } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

export function useUpdateWorkItemEstimatedPoints(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: (estimatedPoints: number | null) => updateWorkItemEstimatedPoints(workItemId, estimatedPoints),
    patchDetail: (estimatedPoints) => ({ estimatedPoints }),
    patchCard: (estimatedPoints) => ({ estimatedPoints }),
  })
}
