import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateWorkItemComment } from '../services/work-item.service'
import type { WorkItemComment } from '../types/work-item.types'
import type { PagedResult } from '@/shared/types/paged-result.types'
import { queryKeys } from '@/shared/lib/query-keys'
import { getErrorMessage } from '@/shared/lib/error-message'

interface UpdateCommentVariables {
  commentId: string
  content: string
}

export function useUpdateWorkItemComment(workItemId: string) {
  const queryClient = useQueryClient()
  const commentsKey = queryKeys.workItems.activityResource(workItemId, 'comments')

  return useMutation({
    mutationFn: ({ commentId, content }: UpdateCommentVariables) =>
      updateWorkItemComment(workItemId, commentId, content),

    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: commentsKey })

      // Every cached page, not just the visible one — the comment could sit on any of them.
      const previousPages = queryClient.getQueriesData<PagedResult<WorkItemComment>>({ queryKey: commentsKey })
      const updatedOnUtc = new Date().toISOString()

      queryClient.setQueriesData<PagedResult<WorkItemComment>>({ queryKey: commentsKey }, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((c) => (c.commentId === commentId ? { ...c, content, updatedOnUtc } : c)),
            }
          : old,
      )

      return { previousPages }
    },

    onError: (err, _vars, context) => {
      context?.previousPages.forEach(([key, data]) => queryClient.setQueryData(key, data))
      // 404 means the comment was deleted elsewhere — the refetch below removes it, so
      // "reverted" would be misleading.
      if (err instanceof ApiError && err.status === 404) {
        toast.error(err.message)
        return
      }
      const reason = getErrorMessage(err)
      toast.error(`${reason} — changes reverted`)
    },

    // Editing does not change commentCount, so the board is left alone.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItems.activity(workItemId) })
    },
  })
}
