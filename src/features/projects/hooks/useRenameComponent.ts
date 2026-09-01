import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { renameComponent } from '../services/component.service'
import type { ProjectComponent } from '../types/component.types'

interface RenameVars {
  componentId: string
  projectId: string
  name: string
}

export function useRenameComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, name }: RenameVars) => renameComponent(componentId, { name }),

    onMutate: async ({ componentId, projectId, name }) => {
      await queryClient.cancelQueries({ queryKey: ['project-components', projectId] })
      const previous = queryClient.getQueryData<ProjectComponent[]>(['project-components', projectId])
      queryClient.setQueryData<ProjectComponent[]>(['project-components', projectId], (old = []) =>
        old.map((c) => (c.id === componentId ? { ...c, name } : c)),
      )
      return { previous }
    },

    onError: (err, { projectId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-components', projectId], context.previous)
      }
      const reason = err instanceof ApiError ? err.message : 'Something went wrong'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-components', projectId] })
    },
  })
}
