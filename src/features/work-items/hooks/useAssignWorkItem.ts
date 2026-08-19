import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { assignWorkItem, unassignWorkItem } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

interface AssignWorkItemVars {
  assigneeId: string | null
  assigneeFullName: string | null
  assigneeInitials: string | null
}

export function useAssignWorkItem(workItemId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assigneeId }: AssignWorkItemVars) =>
      assigneeId ? assignWorkItem(workItemId, assigneeId) : unassignWorkItem(workItemId),

    onMutate: async ({ assigneeId, assigneeFullName, assigneeInitials }) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', workItemId] })
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', workItemId])
      const previousBoard = queryClient.getQueryData<ProjectBoardColumn[]>(['project-board', projectId])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', workItemId], (old) =>
        old ? { ...old, assigneeId, assigneeFullName } : old,
      )

      queryClient.setQueryData<ProjectBoardColumn[]>(['project-board', projectId], (old) =>
        old?.map((col) => ({
          ...col,
          workItems: col.workItems.map((wi) =>
            wi.workItemId === workItemId ? { ...wi, assigneeId, assigneeFullName, assigneeInitials } : wi,
          ),
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
      toast.error('Failed to update assignee — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item', workItemId] })
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
