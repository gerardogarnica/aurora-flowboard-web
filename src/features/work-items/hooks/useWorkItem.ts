import { skipToken, useQuery } from '@tanstack/react-query'
import { getWorkItem } from '../services/work-item.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useWorkItem(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workItems.detail(code ?? ''),
    queryFn: code ? () => getWorkItem(code) : skipToken,
  })
}
