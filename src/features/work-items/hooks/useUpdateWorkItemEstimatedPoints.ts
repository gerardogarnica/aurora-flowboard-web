import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateWorkItemEstimatedPoints } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

export function useUpdateWorkItemEstimatedPoints(workItemId: string, code: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (estimatedPoints: number | null) => updateWorkItemEstimatedPoints(workItemId, estimatedPoints),

    onMutate: async (estimatedPoints) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', code] })
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', code])
      const previousBoard = queryClient.getQueryData<ProjectBoardColumn[]>(['project-board', projectId])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', code], (old) =>
        old ? { ...old, estimatedPoints } : old,
      )

      queryClient.setQueryData<ProjectBoardColumn[]>(['project-board', projectId], (old) =>
        old?.map((col) => ({
          ...col,
          workItems: col.workItems.map((wi) =>
            wi.workItemId === workItemId ? { ...wi, estimatedPoints } : wi,
          ),
        })),
      )

      return { previousItem, previousBoard }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(['work-item', code], context.previousItem)
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(['project-board', projectId], context.previousBoard)
      }
      toast.error('Failed to update estimate points — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item', code] })
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
