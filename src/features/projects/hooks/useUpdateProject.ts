import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { ApiError } from '@/shared/lib/api-client'
import { updateProject } from '../services/project.service'
import type { Project, ProjectDetailResponse, UpdateProjectRequest } from '../types/project.types'

interface UpdateProjectVars {
  projectId: string
  payload: UpdateProjectRequest
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, payload }: UpdateProjectVars) => updateProject(projectId, payload),

    onMutate: async ({ projectId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] })
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      const previousDetail = queryClient.getQueryData<ProjectDetailResponse>(['project', projectId])
      const previousList = queryClient.getQueryData<Project[]>(['projects'])

      queryClient.setQueryData<ProjectDetailResponse>(['project', projectId], (old) =>
        old ? { ...old, ...payload } : old,
      )
      queryClient.setQueryData<Project[]>(['projects'], (old = []) =>
        old.map((p) => (p.projectId === projectId ? { ...p, ...payload } : p)),
      )

      return { previousDetail, previousList }
    },

    onError: (err, { projectId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(['project', projectId], context.previousDetail)
      }
      if (context?.previousList) {
        queryClient.setQueryData(['projects'], context.previousList)
      }
      const reason = err instanceof ApiError ? err.message : 'Failed to update project'
      toast.error(`${reason} — changes reverted`)
    },

    // Runs after errors too, so a 403 (stale membership) or 404 (project gone) resyncs both
    // caches without needing its own branch. MY_SUMMARY_QUERY_KEY feeds the Sidebar, which
    // renders the project name and color — invalidating ['projects'] alone leaves it stale.
    // The board carries no project header data, so ['project-board'] stays untouched.
    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
    },
  })
}
