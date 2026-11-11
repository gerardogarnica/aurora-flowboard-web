import { Link, useSearchParams } from 'react-router-dom'
import { MyWorkTabs } from '@/features/work-items/components/MyWorkTabs'
import { WorkItemList } from '@/features/work-items/components/WorkItemList'
import {
  getMyWorkFilters,
  getMyWorkTabConfig,
  writeMyWorkTab,
  type MyWorkTab,
} from '@/features/work-items/constants/my-work-tabs'
import { useWorkItemSearch } from '@/features/work-items/hooks/useWorkItemSearch'
import type { DashboardResponse } from '../types/dashboard.types'

const HOME_ITEMS = 10

export function MyWorkSection({ me }: { me: DashboardResponse['me'] | undefined }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { value: tab, emptyMessage } = getMyWorkTabConfig(searchParams.get('tab'))
  const query = useWorkItemSearch(getMyWorkFilters(tab, 1, HOME_ITEMS))
  const { data } = query

  const counts: Partial<Record<MyWorkTab, number>> | undefined = me && {
    all: me.open,
    stalled: me.stalled,
    'in-flight': me.inFlight,
    'critical-high': me.criticalHigh,
  }
  const myIssuesQuery = writeMyWorkTab(new URLSearchParams(), tab).toString()

  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3.5 pb-2.5">
        <h2 className="text-[13px] font-semibold tracking-wide uppercase">My work</h2>
        <span className="text-xs text-muted-foreground">In flight first, then backlog · longest in state first</span>
      </div>
      <MyWorkTabs
        tab={tab}
        counts={counts}
        listClassName="px-4"
        onTabChange={(next) => setSearchParams((prev) => writeMyWorkTab(prev, next), { replace: true })}
      >
        <WorkItemList query={query} emptyMessage={emptyMessage} />
      </MyWorkTabs>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
          {data && `Showing ${data.items.length} of ${data.totalCount} open items`}
        </span>
        <Link to={`/my-issues${myIssuesQuery && `?${myIssuesQuery}`}`} className="text-xs font-medium text-primary hover:underline">
          Open My Issues →
        </Link>
      </div>
    </section>
  )
}
