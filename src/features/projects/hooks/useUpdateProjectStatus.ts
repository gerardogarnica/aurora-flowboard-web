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
    // The Sidebar renders each project's status as its glow dot. Completing or archiving a project
    // also takes its items out of the Home, My Issues and the My Issues counter.
    invalidate: ({ projectId }) => [
      { queryKey: queryKeys.projects.list() },
      { queryKey: queryKeys.projects.detail(projectId) },
      { queryKey: queryKeys.mySummary() },
      { queryKey: queryKeys.dashboard() },
      { queryKey: queryKeys.workItems.searches() },
    ],
    errorMessage: 'Failed to update status',
  })
}
