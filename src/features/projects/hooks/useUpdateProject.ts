import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateProject } from '../services/project.service'
import type { Project, ProjectDetailResponse, UpdateProjectRequest } from '../types/project.types'
import { queryKeys } from '@/shared/lib/query-keys'

interface UpdateProjectVars {
  projectId: string
  payload: UpdateProjectRequest
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, payload }: UpdateProjectVars) => updateProject(projectId, payload),

    onMutate: async ({ projectId, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.detail(projectId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.list() })

      const previousDetail = queryClient.getQueryData<ProjectDetailResponse>(queryKeys.projects.detail(projectId))
      const previousList = queryClient.getQueryData<Project[]>(queryKeys.projects.list())

      queryClient.setQueryData<ProjectDetailResponse>(queryKeys.projects.detail(projectId), (old) =>
        old ? { ...old, ...payload } : old,
      )
      queryClient.setQueryData<Project[]>(queryKeys.projects.list(), (old = []) =>
        old.map((p) => (p.projectId === projectId ? { ...p, ...payload } : p)),
      )

      return { previousDetail, previousList }
    },

    onError: (err, { projectId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.projects.detail(projectId), context.previousDetail)
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.projects.list(), context.previousList)
      }
      const reason = err instanceof ApiError ? err.message : 'Failed to update project'
      toast.error(`${reason} — changes reverted`)
    },

    // Runs after errors too, so a 403 (stale membership) or 404 (project gone) resyncs both
    // caches without needing its own branch. queryKeys.mySummary() feeds the Sidebar, which
    // renders the project name and color — invalidating queryKeys.projects.list() alone leaves it stale.
    // The board carries no project header data, so queryKeys.projects.boards() stays untouched.
    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.mySummary() })
    },
  })
}
