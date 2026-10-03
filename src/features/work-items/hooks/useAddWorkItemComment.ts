import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addWorkItemComment } from '../services/work-item.service'
import { queryKeys } from '@/shared/lib/query-keys'
import { getErrorMessage } from '@/shared/lib/error-message'

/**
 * Not optimistic: the POST answers 202 without the new comment's id, so there is no
 * reliable row to insert. The caller clears its draft and returns to page 1 on success;
 * the invalidation below brings the new comment in.
 */
export function useAddWorkItemComment(workItemId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => addWorkItemComment(workItemId, content),

    onError: (err) => {
      toast.error(getErrorMessage(err))
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItems.activity(workItemId) })
      // The board card shows commentCount.
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.board(projectId) })
    },
  })
}
