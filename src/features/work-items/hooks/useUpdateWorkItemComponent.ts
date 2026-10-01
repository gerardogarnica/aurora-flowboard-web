import { updateWorkItemComponent } from '../services/work-item.service'
import { useOptimisticWorkItemMutation } from './useOptimisticWorkItemMutation'

interface UpdateComponentVars {
  componentId: string | null
  componentName: string | null
}

export function useUpdateWorkItemComponent(workItemId: string, code: string, projectId: string) {
  return useOptimisticWorkItemMutation({
    workItemId,
    code,
    projectId,
    mutationFn: ({ componentId }: UpdateComponentVars) => updateWorkItemComponent(workItemId, componentId),
    patchDetail: ({ componentId, componentName }) => ({ componentId, componentName }),
    // The card only carries the name, under `component`.
    patchCard: ({ componentName }) => ({ component: componentName }),
  })
}
