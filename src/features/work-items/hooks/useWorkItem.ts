import { useQuery } from '@tanstack/react-query'
import { getWorkItem } from '../services/work-item.service'

export function useWorkItem(workItemId: string | undefined) {
  return useQuery({
    queryKey: ['work-item', workItemId],
    queryFn: () => getWorkItem(workItemId!),
    enabled: !!workItemId,
  })
}
