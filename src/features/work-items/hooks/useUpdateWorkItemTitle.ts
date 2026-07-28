import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateWorkItemTitle } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { FlowStateBoardResponse } from '@/features/projects/types/board.types'

export function useUpdateWorkItemTitle(workItemId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title: string) => updateWorkItemTitle(workItemId, title),

    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', workItemId] })
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', workItemId])
      const previousBoard = queryClient.getQueryData<FlowStateBoardResponse[]>(['project-board', projectId])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', workItemId], (old) =>
        old ? { ...old, title } : old,
      )

      queryClient.setQueryData<FlowStateBoardResponse[]>(['project-board', projectId], (old) =>
        old?.map((col) => ({
          ...col,
          workItems: col.workItems.map((wi) => (wi.workItemId === workItemId ? { ...wi, title } : wi)),
        })),
      )

      return { previousItem, previousBoard }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(['work-item', workItemId], context.previousItem)
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(['project-board', projectId], context.previousBoard)
      }
      toast.error('Failed to update title — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item', workItemId] })
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
