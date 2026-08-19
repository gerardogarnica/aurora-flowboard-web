import { useQuery } from '@tanstack/react-query'
import { getProjectBoard } from '../services/project.service'

export function useProjectBoard(projectId: string) {
  return useQuery({
    queryKey: ['project-board', projectId],
    queryFn: () => getProjectBoard(projectId),
    enabled: !!projectId,
  })
}
