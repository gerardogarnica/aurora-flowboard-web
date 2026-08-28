import { useQuery } from '@tanstack/react-query'
import { getMySummary } from '../services/auth.service'

export const MY_SUMMARY_QUERY_KEY = ['my-summary'] as const

export function useMySummary() {
  return useQuery({
    queryKey: MY_SUMMARY_QUERY_KEY,
    queryFn: getMySummary,
  })
}
