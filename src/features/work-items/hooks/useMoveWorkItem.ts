import { queryKeys } from '@/shared/lib/query-keys'
import { moveWorkItem } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

interface MoveWorkItemVars {
  toStateId: string
  toStateName: string
}

export function useMoveWorkItem(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: ({ toStateId }: MoveWorkItemVars) => moveWorkItem(workItemId, toStateId),
    patchDetail: ({ toStateId, toStateName }) => ({ flowStateId: toStateId, flowStateName: toStateName }),
    patchCard: ({ toStateId, toStateName }) => ({ flowStateId: toStateId, flowStateName: toStateName }),
    moveToState: ({ toStateId }) => toStateId,
    // Moving into or out of a completed state changes the open/closed counts on the project
    // cards and the Sidebar's "My Issues" counter.
    alsoInvalidate: () => [queryKeys.mySummary(), queryKeys.projects.list()],
  })
}
