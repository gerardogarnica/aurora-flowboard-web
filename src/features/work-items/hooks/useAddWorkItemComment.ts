import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { addWorkItemComment } from '../services/work-item.service'

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
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item-activity', workItemId] })
      // The board card shows commentCount.
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
