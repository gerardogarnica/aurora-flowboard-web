import { useQuery } from '@tanstack/react-query'
import { getComponentsByProject } from '../services/component.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProjectComponents(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.components(projectId),
    queryFn: () => getComponentsByProject(projectId),
    enabled: !!projectId,
  })
}
