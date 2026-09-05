import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getWorkItemComments } from '../services/work-item.service'
import { ACTIVITY_PAGE_SIZE } from '../constants/work-item-display'

export function useWorkItemComments(workItemId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ['work-item-activity', workItemId, 'comments', page],
    queryFn: () => getWorkItemComments(workItemId, page, ACTIVITY_PAGE_SIZE),
    enabled: enabled && !!workItemId,
    placeholderData: keepPreviousData,
  })
}
