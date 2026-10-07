import { useCallback, useState } from 'react'
import { useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { moveWorkItem } from '../services/work-item.service'
import { workItemInvalidations, workItemPatches } from './useOptimisticWorkItemMutation'

export interface MoveBoardWorkItemVars {
  workItemId: string
  code: string
  toStateId: string
  toStateName: string
}

const NO_PENDING: ReadonlySet<string> = new Set()

/**
 * The board's drag-and-drop move: one hook for every card, so the work item comes with each call
 * instead of with the hook. `pendingIds` holds the cards whose move hasn't settled, so the board
 * can stop them from being dragged again mid-request.
 */
export function useMoveBoardWorkItem(projectId: string) {
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(NO_PENDING)

  const { mutateAsync } = useOptimisticMutation<MoveBoardWorkItemVars>({
    mutationFn: ({ workItemId, toStateId }) => moveWorkItem(workItemId, toStateId),
    patches: ({ workItemId, code, toStateId, toStateName }) =>
      workItemPatches(
        { workItemId, code, projectId },
        {
          detail: { flowStateId: toStateId, flowStateName: toStateName },
          card: { flowStateId: toStateId, flowStateName: toStateName },
          toStateId,
        },
      ),
    // A drag only moves between Active states, so the open/closed counters behind
    // queryKeys.mySummary() and queryKeys.projects.list() don't change. Add them here if the
    // board ever gets a Completed drop zone.
    invalidate: ({ workItemId, code }, error) => workItemInvalidations({ workItemId, code, projectId }, error),
    errorMessage: "Couldn't move the work item",
  })

  const move = useCallback(
    (vars: MoveBoardWorkItemVars) => {
      setPendingIds((prev) => new Set(prev).add(vars.workItemId))
      // mutateAsync settles per call; mutate's per-call callbacks would fire only for the last
      // card when two moves overlap. The error is already rolled back and toasted.
      mutateAsync(vars)
        .catch(() => {})
        .finally(() =>
          setPendingIds((prev) => {
            const next = new Set(prev)
            next.delete(vars.workItemId)
            return next
          }),
        )
    },
    [mutateAsync],
  )

  return { move, pendingIds }
}
