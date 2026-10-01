import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateWorkItemComponent } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'
import { queryKeys } from '@/shared/lib/query-keys'

interface UpdateComponentVars {
  componentId: string | null
  componentName: string | null
}

export function useUpdateWorkItemComponent(workItemId: string, code: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId }: UpdateComponentVars) => updateWorkItemComponent(workItemId, componentId),

    onMutate: async ({ componentId, componentName }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workItems.detail(code) })
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.board(projectId) })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(queryKeys.workItems.detail(code))
      const previousBoard = queryClient.getQueryData<ProjectBoardColumn[]>(queryKeys.projects.board(projectId))

      queryClient.setQueryData<WorkItemDetailResponse>(queryKeys.workItems.detail(code), (old) =>
        old ? { ...old, componentId, componentName } : old,
      )

      queryClient.setQueryData<ProjectBoardColumn[]>(queryKeys.projects.board(projectId), (old) =>
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
        queryClient.setQueryData(queryKeys.workItems.detail(code), context.previousItem)
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.projects.board(projectId), context.previousBoard)
      }
      const reason = err instanceof ApiError ? err.message : 'Something went wrong'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItems.detail(code) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workItems.activity(workItemId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.board(projectId) })
    },
  })
}
