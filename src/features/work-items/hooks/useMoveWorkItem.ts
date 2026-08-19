import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { moveWorkItem } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

interface MoveWorkItemVars {
  toStateId: string
  toStateName: string
}

export function useMoveWorkItem(workItemId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ toStateId }: MoveWorkItemVars) => moveWorkItem(workItemId, toStateId),

    onMutate: async ({ toStateId, toStateName }) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', workItemId] })
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', workItemId])
      const previousBoard = queryClient.getQueryData<ProjectBoardColumn[]>(['project-board', projectId])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', workItemId], (old) =>
        old ? { ...old, flowStateId: toStateId, flowStateName: toStateName } : old,
      )

      queryClient.setQueryData<ProjectBoardColumn[]>(['project-board', projectId], (old) => {
        if (!old) return old
        const movedItem = old.flatMap((col) => col.workItems).find((wi) => wi.workItemId === workItemId)
        if (!movedItem) return old

        const patchedItem = { ...movedItem, flowStateId: toStateId, flowStateName: toStateName }

        return old.map((col) => {
          const workItems = col.workItems.filter((wi) => wi.workItemId !== workItemId)
          return col.flowStateId === toStateId
            ? { ...col, workItems: [...workItems, patchedItem] }
            : { ...col, workItems }
        })
      })

      return { previousItem, previousBoard }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(['work-item', workItemId], context.previousItem)
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(['project-board', projectId], context.previousBoard)
      }
      toast.error('Failed to update status — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item', workItemId] })
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
