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
    // The age restarts now; a rejected move rolls it back with the rest of the patch.
    patchDetail: ({ toStateId, toStateName }) => ({
      flowStateId: toStateId,
      flowStateName: toStateName,
      enteredCurrentStateOnUtc: new Date().toISOString(),
    }),
    patchCard: ({ toStateId, toStateName }) => ({
      flowStateId: toStateId,
      flowStateName: toStateName,
      enteredCurrentStateOnUtc: new Date().toISOString(),
    }),
    moveToState: ({ toStateId }) => toStateId,
    // Moving into or out of a completed state changes the open/closed counts on the project
    // cards and the Sidebar's "My Issues" counter.
    alsoInvalidate: () => [queryKeys.mySummary(), queryKeys.projects.list()],
  })
}
