import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { createProject } from '../services/project.service'
import type { CreateProjectRequest } from '../types/project.types'

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
    },
  })
}
