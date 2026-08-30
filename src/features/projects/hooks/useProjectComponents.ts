import { useQuery } from '@tanstack/react-query'
import { getComponentsByProject } from '../services/project.service'

export function useProjectComponents(projectId: string) {
  return useQuery({
    queryKey: ['project-components', projectId],
    queryFn: () => getComponentsByProject(projectId),
    enabled: !!projectId,
  })
}
