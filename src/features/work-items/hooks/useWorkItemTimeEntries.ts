import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getWorkItemTimeEntries } from '../services/work-item.service'
import { ACTIVITY_PAGE_SIZE } from '../constants/work-item-display'

export function useWorkItemTimeEntries(workItemId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ['work-item-activity', workItemId, 'time-entries', page],
    queryFn: () => getWorkItemTimeEntries(workItemId, page, ACTIVITY_PAGE_SIZE),
    enabled: enabled && !!workItemId,
    placeholderData: keepPreviousData,
  })
}
