import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComponent } from '../services/component.service'
import type { CreateComponentRequest } from '../types/component.types'
import { queryKeys } from '@/shared/lib/query-keys'

export function useCreateComponent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateComponentRequest) => createComponent(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.components(projectId) })
    },
  })
}
