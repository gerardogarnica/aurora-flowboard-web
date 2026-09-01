import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMilestone } from '../services/milestone.service'
import type { MilestoneRequest } from '../types/milestone.types'

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MilestoneRequest) => createMilestone(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] })
    },
  })
}
