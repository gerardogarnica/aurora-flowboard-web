import { useQuery } from '@tanstack/react-query'
import { getProjectBoard } from '../services/project.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProjectBoard(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.board(projectId),
    queryFn: () => getProjectBoard(projectId),
    enabled: !!projectId,
  })
}
