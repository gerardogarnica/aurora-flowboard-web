import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { FLOW_QUERY_OPTIONS } from '@/shared/constants/flow-query-options'
import { queryKeys } from '@/shared/lib/query-keys'
import { searchWorkItems } from '../services/work-item.service'
import type { WorkItemSearchFilters } from '../types/work-item.types'

/** The previous list stays on screen while another tab or page loads. */
export function useWorkItemSearch(filters: WorkItemSearchFilters) {
  return useQuery({
    queryKey: queryKeys.workItems.search(filters),
    queryFn: () => searchWorkItems(filters),
    placeholderData: keepPreviousData,
    ...FLOW_QUERY_OPTIONS,
  })
}
