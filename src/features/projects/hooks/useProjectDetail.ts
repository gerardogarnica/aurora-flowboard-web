import { useQuery } from '@tanstack/react-query'
import { getProjectById } from '../services/project.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProjectDetail(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  })
}
