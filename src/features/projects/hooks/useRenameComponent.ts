import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { renameComponent } from '../services/component.service'
import type { ProjectComponent } from '../types/component.types'

interface RenameVars {
  componentId: string
  projectId: string
  name: string
}

export function useRenameComponent() {
  return useOptimisticMutation({
    mutationFn: ({ componentId, name }: RenameVars) => renameComponent(componentId, { name }),
    patches: ({ componentId, projectId, name }) => [
      cachePatch<ProjectComponent[]>(queryKeys.projects.components(projectId), (old) =>
        old.map((c) => (c.id === componentId ? { ...c, name } : c)),
      ),
    ],
    invalidate: ({ projectId }) => [
      { queryKey: queryKeys.projects.components(projectId) },
      { queryKey: queryKeys.projects.board(projectId), refetchType: 'all' },
      { queryKey: queryKeys.workItems.all() },
    ],
  })
}
