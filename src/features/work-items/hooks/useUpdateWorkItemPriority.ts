import { updateWorkItemPriority } from '../services/work-item.service'
import type { Priority } from '../types/work-item.types'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

export function useUpdateWorkItemPriority(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: (priority: Priority) => updateWorkItemPriority(workItemId, priority),
    patchDetail: (priority) => ({ priority }),
    patchCard: (priority) => ({ priority }),
  })
}
