import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '../services/project.service'
import type { CreateProjectRequest } from '../types/project.types'

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
