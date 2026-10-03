import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { updateProjectStatus } from '../services/project.service'
import type { Project, ProjectApiStatus } from '../types/project.types'

interface UpdateStatusVars {
  projectId: string
  status: ProjectApiStatus
}

export function useUpdateProjectStatus() {
  return useOptimisticMutation({
    mutationFn: ({ projectId, status }: UpdateStatusVars) => updateProjectStatus(projectId, status),
    patches: ({ projectId, status }) => [
      cachePatch<Project[]>(queryKeys.projects.list(), (old) =>
        old.map((p) => (p.projectId === projectId ? { ...p, status } : p)),
      ),
    ],
    // The Sidebar renders each project's status as its glow dot.
    invalidate: ({ projectId }) => [
      { queryKey: queryKeys.projects.list() },
      { queryKey: queryKeys.projects.detail(projectId) },
      { queryKey: queryKeys.mySummary() },
    ],
    errorMessage: 'Failed to update status',
  })
}
