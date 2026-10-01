import { useQuery } from '@tanstack/react-query'
import { getProjects } from '../services/project.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: getProjects,
  })
}
