import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getWorkItemChangeLogs } from '../services/work-item.service'
import { ACTIVITY_PAGE_SIZE } from '../constants/work-item-display'
import { queryKeys } from '@/shared/lib/query-keys'

export function useWorkItemChangeLogs(workItemId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.workItems.activityPage(workItemId, 'change-logs', page),
    queryFn: () => getWorkItemChangeLogs(workItemId, page, ACTIVITY_PAGE_SIZE),
    enabled: enabled && !!workItemId,
    placeholderData: keepPreviousData,
  })
}
