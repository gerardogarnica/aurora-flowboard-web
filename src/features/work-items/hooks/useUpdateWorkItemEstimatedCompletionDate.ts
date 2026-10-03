import { updateWorkItemEstimatedCompletionDate } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

export function useUpdateWorkItemEstimatedCompletionDate(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: (estimatedCompletionDate: string | null) =>
      updateWorkItemEstimatedCompletionDate(workItemId, estimatedCompletionDate),
    patchDetail: (estimatedCompletionDate) => ({ estimatedCompletionDate }),
    patchCard: (estimatedCompletionDate) => ({ estimatedCompletionDate }),
  })
}
