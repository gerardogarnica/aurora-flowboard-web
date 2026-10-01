import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getWorkItemTimeEntries } from '../services/work-item.service'
import { ACTIVITY_PAGE_SIZE } from '../constants/work-item-display'
import { queryKeys } from '@/shared/lib/query-keys'

export function useWorkItemTimeEntries(workItemId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.workItems.activityPage(workItemId, 'time-entries', page),
    queryFn: () => getWorkItemTimeEntries(workItemId, page, ACTIVITY_PAGE_SIZE),
    enabled: enabled && !!workItemId,
    placeholderData: keepPreviousData,
  })
}
