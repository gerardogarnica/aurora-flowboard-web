import { updateWorkItemTitle } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

export function useUpdateWorkItemTitle(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: (title: string) => updateWorkItemTitle(workItemId, title),
    patchDetail: (title) => ({ title }),
    patchCard: (title) => ({ title }),
  })
}
