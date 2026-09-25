import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { deleteWorkItemComment } from '../services/work-item.service'
import type { WorkItemComment } from '../types/work-item.types'
import type { PagedResult } from '@/shared/types/paged-result.types'

export function useDeleteWorkItemComment(workItemId: string, projectId: string) {
  const queryClient = useQueryClient()
  const commentsKey = ['work-item-activity', workItemId, 'comments']

  return useMutation({
    mutationFn: (commentId: string) => deleteWorkItemComment(workItemId, commentId),

    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: commentsKey })

      const previousPages = queryClient.getQueriesData<PagedResult<WorkItemComment>>({ queryKey: commentsKey })
      const isCached = previousPages.some(([, page]) => page?.items.some((c) => c.commentId === commentId))

      if (isCached) {
        // The count shrinks on every cached page, and totalPages with it: when the last row
        // of the last page goes, ActivityPanel sees page > totalPages right away and steps
        // back, instead of flashing an empty page until the refetch lands.
        queryClient.setQueriesData<PagedResult<WorkItemComment>>({ queryKey: commentsKey }, (old) => {
          if (!old) return old
          const totalCount = Math.max(0, old.totalCount - 1)
          return {
            ...old,
            items: old.items.filter((c) => c.commentId !== commentId),
            totalCount,
            totalPages: Math.ceil(totalCount / old.pageSize),
          }
        })
      }

      return { previousPages }
    },

    onError: (err, _vars, context) => {
      context?.previousPages.forEach(([key, data]) => queryClient.setQueryData(key, data))
      // 404: already deleted elsewhere — the refetch below drops it for good.
      if (err instanceof ApiError && err.status === 404) {
        toast.error(err.message)
        return
      }
      const reason = err instanceof ApiError ? err.message : 'Something went wrong'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item-activity', workItemId] })
      // The board card shows commentCount.
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
