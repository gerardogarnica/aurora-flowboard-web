import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getProjectChangeLogs } from '../services/project.service'
import { PROJECT_CHANGE_LOG_PAGE_SIZE } from '../constants/project-change-log'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProjectChangeLogs(projectId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.projects.changeLogPage(projectId, page),
    queryFn: () => getProjectChangeLogs(projectId, page, PROJECT_CHANGE_LOG_PAGE_SIZE),
    enabled: enabled && !!projectId,
    placeholderData: keepPreviousData,
  })
}
