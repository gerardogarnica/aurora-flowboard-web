import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '../services/project.service'
import type { CreateProjectRequest } from '../types/project.types'
import { queryKeys } from '@/shared/lib/query-keys'

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.mySummary() })
    },
  })
}
