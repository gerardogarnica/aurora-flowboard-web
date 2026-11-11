import type { WorkItemSearchFilters } from '../types/work-item.types'

export type MyWorkTab = 'all' | 'stalled' | 'in-flight' | 'critical-high' | 'reported'

type MyWorkFilters = Pick<WorkItemSearchFilters, 'assignee' | 'createdBy' | 'stage' | 'stalled' | 'priority'>

export const MY_WORK_TABS: { value: MyWorkTab; label: string; filters: MyWorkFilters; emptyMessage: string }[] = [
  { value: 'all', label: 'All', filters: { assignee: 'me' }, emptyMessage: 'Nothing assigned to you' },
  {
    value: 'stalled',
    label: 'Stalled',
    filters: { assignee: 'me', stalled: true },
    emptyMessage: 'Nothing of yours has stopped moving',
  },
  {
    value: 'in-flight',
    label: 'In flight',
    filters: { assignee: 'me', stage: 'InFlight' },
    emptyMessage: 'Nothing of yours is in flight',
  },
  {
    value: 'critical-high',
    label: 'Critical & high',
    filters: { assignee: 'me', priority: ['High', 'Critical'] },
    emptyMessage: 'No critical or high priority items',
  },
  {
    value: 'reported',
    label: 'Reported by me',
    filters: { createdBy: 'me' },
    emptyMessage: 'No open items reported by you',
  },
]

const DEFAULT_TAB = MY_WORK_TABS[0]

/** Absent or unknown means `All`. */
export function getMyWorkTabConfig(value: string | null) {
  return MY_WORK_TABS.find((tab) => tab.value === value) ?? DEFAULT_TAB
}

export function getMyWorkFilters(tab: MyWorkTab, page: number, pageSize: number): WorkItemSearchFilters {
  return { ...getMyWorkTabConfig(tab).filters, sort: 'stageThenTimeInState', page, pageSize }
}

/** Query string for a tab, starting again from page 1. `All` is the bare URL. */
export function writeMyWorkTab(params: URLSearchParams, tab: MyWorkTab): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('page')
  if (tab === DEFAULT_TAB.value) next.delete('tab')
  else next.set('tab', tab)
  return next
}
