import { useQuery } from '@tanstack/react-query'
import { getWorkItem } from '../services/work-item.service'

export function useWorkItem(code: string | undefined) {
  return useQuery({
    queryKey: ['work-item', code],
    queryFn: () => getWorkItem(code!),
    enabled: !!code,
  })
}
