import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateMilestoneStatus } from '../services/project.service'
import type { MilestoneAction } from '../constants/milestone-status'
import type { ProjectMilestone } from '../types/project.types'

interface UpdateMilestoneStatusVars {
  milestoneId: string
  projectId: string
  status: MilestoneAction
}

export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ milestoneId, status }: UpdateMilestoneStatusVars) =>
      updateMilestoneStatus(milestoneId, status),

    onMutate: async ({ milestoneId, projectId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['project-milestones', projectId] })
      const previous = queryClient.getQueryData<ProjectMilestone[]>(['project-milestones', projectId])
      queryClient.setQueryData<ProjectMilestone[]>(['project-milestones', projectId], (old = []) =>
        old.map((m) => (m.id === milestoneId ? { ...m, status } : m)),
      )
      return { previous }
    },

    onError: (err, { projectId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-milestones', projectId], context.previous)
      }
      const reason = err instanceof ApiError ? err.message : 'Failed to update milestone status'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] })
    },
  })
}
