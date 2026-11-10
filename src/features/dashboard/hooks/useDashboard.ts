import { useQuery } from '@tanstack/react-query'
import { FLOW_QUERY_OPTIONS } from '@/shared/constants/flow-query-options'
import { queryKeys } from '@/shared/lib/query-keys'
import { getDashboard } from '../services/dashboard.service'

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: getDashboard,
    ...FLOW_QUERY_OPTIONS,
  })
}
