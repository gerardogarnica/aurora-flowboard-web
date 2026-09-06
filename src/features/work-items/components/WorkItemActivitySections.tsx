import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { formatDateTime } from '@/shared/lib/date-format'
import { formatChangeLogEntry } from '../constants/work-item-display'
import { useWorkItemChangeLogs } from '../hooks/useWorkItemChangeLogs'
import { useWorkItemComments } from '../hooks/useWorkItemComments'
import { useWorkItemStateHistory } from '../hooks/useWorkItemStateHistory'
import { useWorkItemTimeEntries } from '../hooks/useWorkItemTimeEntries'
import type { WorkItemStateTransition } from '../types/work-item.types'
import type { PagedResult } from '@/shared/types/paged-result.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

type ActivityTabId = 'comments' | 'timeEntries' | 'stateHistory' | 'changeLog'

const INITIAL_PAGES: Record<ActivityTabId, number> = {
  comments: 1,
  timeEntries: 1,
  stateHistory: 1,
  changeLog: 1,
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground/70 py-2">{message}</p>
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-3 py-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

function Pager({
  result,
  isFetching,
  onPageChange,
}: {
  result: PagedResult<unknown>
  isFetching: boolean
  onPageChange: (page: number) => void
}) {
  if (result.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <span className="text-xs text-muted-foreground">
        Page {result.page} of {result.totalPages} · {result.totalCount} total
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          aria-label="Previous page"
          disabled={isFetching || result.page <= 1}
          onClick={() => onPageChange(result.page - 1)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          aria-label="Next page"
          disabled={isFetching || result.page >= result.totalPages}
          onClick={() => onPageChange(result.page + 1)}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Renders one lazily-loaded activity tab: skeleton while the first page is in flight,
 * an error with a retry, the empty state, or the rows plus a pager.
 */
function ActivityPanel<T>({
  query,
  page,
  onPageChange,
  emptyMessage,
  children,
}: {
  query: UseQueryResult<PagedResult<T>>
  page: number
  onPageChange: (page: number) => void
  emptyMessage: string
  children: (items: T[]) => ReactNode
}) {
  const { data, isPending, isError, isFetching, refetch } = query

  // Rows behind the current page can disappear (a comment is deleted, a mutation shortens
  // the list) and the API answers an out-of-range page with an empty array rather than a
  // 404 — fall back to the last page that still has rows.
  useEffect(() => {
    if (data && data.totalPages >= 1 && page > data.totalPages) {
      onPageChange(data.totalPages)
    }
  }, [data, page, onPageChange])

  if (isPending) return <ActivitySkeleton />

  if (isError) {
    return (
      <div className="flex items-center gap-3 py-2">
        <p className="text-sm text-muted-foreground">Could not load this tab.</p>
        <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (data.totalCount === 0) return <EmptyState message={emptyMessage} />

  return (
    <div className={cn('flex flex-col gap-3', isFetching && 'opacity-60 transition-opacity')}>
      {children(data.items)}
      <Pager result={data} isFetching={isFetching} onPageChange={onPageChange} />
    </div>
  )
}

function StateHistoryTimeline({
  transitions,
  columns,
}: {
  transitions: WorkItemStateTransition[]
  columns: ProjectBoardColumn[]
}) {
  const colorByStateId = new Map(columns.map((col) => [col.flowStateId, resolveSwatchColor(col.color)]))
  const colorFor = (stateId: string) => colorByStateId.get(stateId) ?? resolveSwatchColor('')

  return (
    <div className="flex flex-col">
      {transitions.map((transition, index) => {
        const toColor = colorFor(transition.toStateId)
        const fromColor = transition.fromStateId ? colorFor(transition.fromStateId) : undefined
        const isLast = index === transitions.length - 1

        return (
          <div key={transition.stateTransitionId} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="w-2.5 h-2.5 rounded-full ring-4 ring-background shrink-0 mt-1"
                style={{ backgroundColor: toColor }}
              />
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
              <div className="flex items-center gap-1.5 flex-wrap">
                {transition.fromStateName && fromColor && (
                  <>
                    <Badge
                      variant="outline"
                      className="font-normal"
                      style={{ borderColor: fromColor, color: fromColor }}
                    >
                      {transition.fromStateName}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  </>
                )}
                <Badge className="text-white" style={{ backgroundColor: toColor }}>
                  {transition.toStateName}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {transition.changedByFullName} · {formatDateTime(transition.changedOnUtc)}
              </div>
              {transition.reason && <p className="text-sm text-foreground mt-1">{transition.reason}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function WorkItemActivitySections({
  workItemId,
  columns,
}: {
  workItemId: string
  columns: ProjectBoardColumn[]
}) {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('comments')
  const [pages, setPages] = useState<Record<ActivityTabId, number>>(INITIAL_PAGES)

  // `page` is validated as GreaterThan(0) server-side: a page of 0 or less is a 400, not an
  // empty page, so it never reaches a request.
  const setPage = (tab: ActivityTabId) => (page: number) =>
    setPages((prev) => ({ ...prev, [tab]: Math.max(1, page) }))

  // Each tab is fetched on demand, only while it is the active one.
  const comments = useWorkItemComments(workItemId, pages.comments, activeTab === 'comments')
  const timeEntries = useWorkItemTimeEntries(workItemId, pages.timeEntries, activeTab === 'timeEntries')
  const stateHistory = useWorkItemStateHistory(workItemId, pages.stateHistory, activeTab === 'stateHistory')
  const changeLogs = useWorkItemChangeLogs(workItemId, pages.changeLog, activeTab === 'changeLog')

  const tabs: { id: ActivityTabId; label: string }[] = [
    { id: 'comments', label: 'Comments' },
    { id: 'timeEntries', label: 'Time Entries' },
    { id: 'stateHistory', label: 'State History' },
    { id: 'changeLog', label: 'Change Log' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex items-center gap-5 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'text-sm pb-2.5 border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'comments' && (
        <ActivityPanel
          query={comments}
          page={pages.comments}
          onPageChange={setPage('comments')}
          emptyMessage="No comments yet."
        >
          {(items) => (
            <div className="flex flex-col gap-3">
              {items.map((comment) => (
                <div key={comment.commentId} className="rounded-lg border border-border p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{comment.authorFullName}</span>
                    <span>{formatDateTime(comment.createdOnUtc)}</span>
                    {comment.updatedOnUtc && <span>(edited)</span>}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </ActivityPanel>
      )}

      {activeTab === 'timeEntries' && (
        <ActivityPanel
          query={timeEntries}
          page={pages.timeEntries}
          onPageChange={setPage('timeEntries')}
          emptyMessage="No time logged."
        >
          {(items) => (
            <div className="flex flex-col gap-2">
              {items.map((entry) => (
                <div
                  key={entry.timeEntryId}
                  className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground">{entry.description ?? 'Time logged'}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.loggedByFullName} · {formatDateTime(entry.loggedOnUtc)}
                    </span>
                  </div>
                  <span className="text-muted-foreground tabular-nums shrink-0">{entry.hours}h</span>
                </div>
              ))}
            </div>
          )}
        </ActivityPanel>
      )}

      {activeTab === 'stateHistory' && (
        <ActivityPanel
          query={stateHistory}
          page={pages.stateHistory}
          onPageChange={setPage('stateHistory')}
          emptyMessage="No state transitions yet."
        >
          {(items) => <StateHistoryTimeline transitions={items} columns={columns} />}
        </ActivityPanel>
      )}

      {activeTab === 'changeLog' && (
        <ActivityPanel
          query={changeLogs}
          page={pages.changeLog}
          onPageChange={setPage('changeLog')}
          emptyMessage="No changes recorded."
        >
          {(items) => (
            <div className="flex flex-col gap-1.5">
              {items.map((log) => (
                <div key={log.changeLogId} className="text-xs text-muted-foreground">
                  {formatChangeLogEntry(log)} · {formatDateTime(log.changedOnUtc)}
                </div>
              ))}
            </div>
          )}
        </ActivityPanel>
      )}
    </div>
  )
}
