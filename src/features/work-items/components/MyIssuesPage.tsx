import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pager } from '@/shared/components/PagedPanel'
import { getMyWorkFilters, getMyWorkTabConfig, writeMyWorkTab, type MyWorkTab } from '../constants/my-work-tabs'
import { useWorkItemSearch } from '../hooks/useWorkItemSearch'
import { MyWorkTabs } from './MyWorkTabs'
import { WorkItemList } from './WorkItemList'

const PAGE_SIZE = 25

/** A missing, malformed or below-1 `?page=` is page 1: the API answers a page below 1 with a 400. */
function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function MyIssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { value: tab, emptyMessage } = getMyWorkTabConfig(searchParams.get('tab'))
  const page = parsePage(searchParams.get('page'))
  const query = useWorkItemSearch(getMyWorkFilters(tab, page, PAGE_SIZE))
  const { data, isPlaceholderData } = query

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === 1) params.delete('page')
          else params.set('page', String(next))
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Rows can disappear behind the current page, and the API answers a page past the end with
  // an empty array: fall back to the last page that still has rows.
  useEffect(() => {
    if (data && !isPlaceholderData && data.totalPages >= 1 && page > data.totalPages) setPage(data.totalPages)
  }, [data, isPlaceholderData, page, setPage])

  const handleTabChange = (next: MyWorkTab) => {
    setSearchParams((prev) => writeMyWorkTab(prev, next), { replace: true })
  }

  return (
    <>
      <PageHeader title="My issues" subtitle="Your open work items across all your projects." />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-8 py-6">
        <TooltipProvider>
          <section className="rounded-lg border border-border bg-card">
            <MyWorkTabs tab={tab} onTabChange={handleTabChange} listClassName="px-4 pt-3">
              <WorkItemList query={query} emptyMessage={emptyMessage} skeletonRows={10} />
            </MyWorkTabs>
          </section>
        </TooltipProvider>
        {data && <Pager result={data} isFetching={isPlaceholderData} onPageChange={setPage} />}
      </div>
    </>
  )
}
