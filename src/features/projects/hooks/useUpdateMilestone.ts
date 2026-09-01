import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateMilestone } from '../services/milestone.service'
import type { MilestoneRequest, ProjectMilestone } from '../types/milestone.types'

interface UpdateMilestoneVars {
  milestoneId: string
  projectId: string
  payload: MilestoneRequest
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ milestoneId, payload }: UpdateMilestoneVars) => updateMilestone(milestoneId, payload),

    onMutate: async ({ milestoneId, projectId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['project-milestones', projectId] })
      const previous = queryClient.getQueryData<ProjectMilestone[]>(['project-milestones', projectId])
      queryClient.setQueryData<ProjectMilestone[]>(['project-milestones', projectId], (old = []) =>
        old.map((m) => (m.id === milestoneId ? { ...m, ...payload } : m)),
      )
      return { previous }
    },

    onError: (err, { projectId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-milestones', projectId], context.previous)
      }
      const reason = err instanceof ApiError ? err.message : 'Failed to update milestone'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] })
    },
  })
}
