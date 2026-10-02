import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createWorkItem } from '../services/work-item.service'
import type { CreateWorkItemRequest } from '../types/work-item.types'
import { queryKeys } from '@/shared/lib/query-keys'

export function useCreateWorkItem(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateWorkItemRequest) => createWorkItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.board(projectId) })
      // A new item adds to the project card's open count and, when assigned to the current
      // user, to the Sidebar's "My Issues" counter.
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.mySummary() })
    },
  })
}
