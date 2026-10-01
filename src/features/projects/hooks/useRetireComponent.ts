import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { retireComponent } from '../services/component.service'
import type { ProjectComponent } from '../types/component.types'

interface RetireVars {
  componentId: string
  projectId: string
}

export function useRetireComponent() {
  return useOptimisticMutation({
    mutationFn: ({ componentId }: RetireVars) => retireComponent(componentId),
    patches: ({ componentId, projectId }) => [
      cachePatch<ProjectComponent[]>(queryKeys.projects.components(projectId), (old) =>
        old.map((c) => (c.id === componentId ? { ...c, status: 'Retired' } : c)),
      ),
    ],
    invalidate: ({ projectId }) => [{ queryKey: queryKeys.projects.components(projectId) }],
    errorMessage: 'Failed to retire component',
  })
}
