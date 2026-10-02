import { updateWorkItemDescription } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

// No projectId: board cards don't show the description, so the board is left alone.
export function useUpdateWorkItemDescription(workItemId: string, code: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    mutationFn: (description: string) => updateWorkItemDescription(workItemId, description),
    patchDetail: (description) => ({ description }),
  })
}
