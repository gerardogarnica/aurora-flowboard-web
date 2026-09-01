import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { retireComponent } from '../services/component.service'
import type { ProjectComponent } from '../types/component.types'

interface RetireVars {
  componentId: string
  projectId: string
}

export function useRetireComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId }: RetireVars) => retireComponent(componentId),

    onMutate: async ({ componentId, projectId }) => {
      await queryClient.cancelQueries({ queryKey: ['project-components', projectId] })
      const previous = queryClient.getQueryData<ProjectComponent[]>(['project-components', projectId])
      queryClient.setQueryData<ProjectComponent[]>(['project-components', projectId], (old = []) =>
        old.map((c) => (c.id === componentId ? { ...c, status: 'Retired' } : c)),
      )
      return { previous }
    },

    onError: (err, { projectId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-components', projectId], context.previous)
      }
      const reason = err instanceof ApiError ? err.message : 'Failed to retire component'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-components', projectId] })
    },
  })
}
