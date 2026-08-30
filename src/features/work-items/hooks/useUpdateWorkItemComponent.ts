import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateWorkItemComponent } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

interface UpdateComponentVars {
  componentId: string | null
  componentName: string | null
}

export function useUpdateWorkItemComponent(workItemId: string, code: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId }: UpdateComponentVars) => updateWorkItemComponent(workItemId, componentId),

    onMutate: async ({ componentId, componentName }) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', code] })
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', code])
      const previousBoard = queryClient.getQueryData<ProjectBoardColumn[]>(['project-board', projectId])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', code], (old) =>
        old ? { ...old, componentId, componentName } : old,
      )

      queryClient.setQueryData<ProjectBoardColumn[]>(['project-board', projectId], (old) =>
        old?.map((col) => ({
          ...col,
          workItems: col.workItems.map((wi) =>
            wi.workItemId === workItemId ? { ...wi, component: componentName } : wi,
          ),
        })),
      )

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
