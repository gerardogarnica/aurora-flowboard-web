import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createWorkItem } from '../services/work-item.service'
import type { CreateWorkItemRequest } from '../types/work-item.types'

export function useCreateWorkItem(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateWorkItemRequest) => createWorkItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] })
    },
  })
}
