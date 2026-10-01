import { updateWorkItemType } from '../services/work-item.service'
import type { WorkItemType } from '../types/work-item.types'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

export function useUpdateWorkItemType(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: (type: WorkItemType) => updateWorkItemType(workItemId, type),
    patchDetail: (type) => ({ type }),
    patchCard: (type) => ({ type }),
  })
}
