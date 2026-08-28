import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { moveWorkItem } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

interface MoveWorkItemVars {
  toStateId: string
  toStateName: string
}

export function useMoveWorkItem(workItemId: string, code: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ toStateId }: MoveWorkItemVars) => moveWorkItem(workItemId, toStateId),

    onMutate: async ({ toStateId, toStateName }) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', code] })
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', code])
      const previousBoard = queryClient.getQueryData<ProjectBoardColumn[]>(['project-board', projectId])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', code], (old) =>
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

    onError: (err, _vars, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(['work-item', code], context.previousItem)
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(['project-board', projectId], context.previousBoard)
      }
      const reason = err instanceof ApiError ? err.message : 'Something went wrong'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item', code] })
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
