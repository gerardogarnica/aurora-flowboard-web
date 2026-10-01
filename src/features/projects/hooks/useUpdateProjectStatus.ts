import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateProjectStatus } from '../services/project.service'
import type { Project, ProjectApiStatus } from '../types/project.types'
import { queryKeys } from '@/shared/lib/query-keys'

interface UpdateStatusVars {
  projectId: string
  status: ProjectApiStatus
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, status }: UpdateStatusVars) =>
      updateProjectStatus(projectId, status),

    onMutate: async ({ projectId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.list() })
      const previous = queryClient.getQueryData<Project[]>(queryKeys.projects.list())
      queryClient.setQueryData<Project[]>(queryKeys.projects.list(), (old = []) =>
        old.map((p) => (p.projectId === projectId ? { ...p, status } : p)),
      )
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.projects.list(), context.previous)
      }
      toast.error('Failed to update status — changes reverted')
    },

    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.mySummary() })
    },
  })
}
