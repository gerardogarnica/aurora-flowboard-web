import { useQuery } from '@tanstack/react-query'
import { getMySummary } from '../services/auth.service'

export function useMySummary() {
  return useQuery({
    queryKey: ['my-summary'],
    queryFn: getMySummary,
    staleTime: Infinity,
  })
}
