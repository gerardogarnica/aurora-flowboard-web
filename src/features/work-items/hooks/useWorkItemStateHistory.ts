import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getWorkItemStateHistory } from '../services/work-item.service'
import { ACTIVITY_PAGE_SIZE } from '../constants/work-item-display'

export function useWorkItemStateHistory(workItemId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ['work-item-activity', workItemId, 'state-history', page],
    queryFn: () => getWorkItemStateHistory(workItemId, page, ACTIVITY_PAGE_SIZE),
    enabled: enabled && !!workItemId,
    placeholderData: keepPreviousData,
  })
}
