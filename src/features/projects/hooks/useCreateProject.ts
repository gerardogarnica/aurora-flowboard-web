import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '../services/project.service'
import type { CreateProjectPayload } from '../types/project.types'

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
