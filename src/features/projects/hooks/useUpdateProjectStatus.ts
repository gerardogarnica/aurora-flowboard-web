import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateProjectStatus } from '../services/project.service'
import type { Project, ProjectApiStatus } from '../types/project.types'

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
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previous = queryClient.getQueryData<Project[]>(['projects'])
      queryClient.setQueryData<Project[]>(['projects'], (old = []) =>
        old.map((p) => (p.projectId === projectId ? { ...p, status } : p)),
      )
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects'], context.previous)
      }
      toast.error('Failed to update status — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
