import { queryKeys } from '@/shared/lib/query-keys'
import { assignWorkItem, unassignWorkItem } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

interface AssignWorkItemVars {
  assigneeId: string | null
  assigneeFullName: string | null
  assigneeInitials: string | null
}

export function useAssignWorkItem(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: ({ assigneeId }: AssignWorkItemVars) =>
      assigneeId ? assignWorkItem(workItemId, assigneeId) : unassignWorkItem(workItemId),
    patchDetail: (assignee) => assignee,
    patchCard: (assignee) => assignee,
    // Assigning to or away from the current user changes the Sidebar's "My Issues" counter.
    alsoInvalidate: () => [queryKeys.mySummary()],
  })
}
