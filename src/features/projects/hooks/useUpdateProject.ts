import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { updateProject } from '../services/project.service'
import type { Project, ProjectDetailResponse, UpdateProjectRequest } from '../types/project.types'

interface UpdateProjectVars {
  projectId: string
  payload: UpdateProjectRequest
}

export function useUpdateProject() {
  return useOptimisticMutation({
    mutationFn: ({ projectId, payload }: UpdateProjectVars) => updateProject(projectId, payload),
    patches: ({ projectId, payload }) => [
      cachePatch<ProjectDetailResponse>(queryKeys.projects.detail(projectId), (old) => ({ ...old, ...payload })),
      cachePatch<Project[]>(queryKeys.projects.list(), (old) =>
        old.map((p) => (p.projectId === projectId ? { ...p, ...payload } : p)),
      ),
    ],
    // Runs after errors too, so a 403 (stale membership) or 404 (project gone) resyncs both
    // caches without needing its own branch. mySummary feeds the Sidebar, which renders the
    // project name and color — invalidating the list alone leaves it stale. The board carries
    // no project header data, so it stays untouched.
    invalidate: ({ projectId }) => [
      { queryKey: queryKeys.projects.detail(projectId) },
      { queryKey: queryKeys.projects.list() },
      { queryKey: queryKeys.mySummary() },
    ],
    errorMessage: 'Failed to update project',
  })
}
