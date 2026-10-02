import { useQuery } from '@tanstack/react-query'
import { getMySummary } from '../services/auth.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useMySummary() {
  return useQuery({
    queryKey: queryKeys.mySummary(),
    queryFn: getMySummary,
  })
}
