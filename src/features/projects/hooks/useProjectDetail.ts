import { useQuery } from '@tanstack/react-query'
import { getProjectById } from '../services/project.service'

export function useProjectDetail(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  })
}
