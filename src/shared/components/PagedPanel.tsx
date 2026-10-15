import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PagedResult } from '@/shared/types/paged-result.types'

function PagedPanelSkeleton() {
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
 * One page of a `PagedResult` query inside a tab: skeleton while the first page is in flight,
 * an error with a retry, the empty state, or the rows plus a pager. The caller owns `page`
 * and should never pass one below 1 — the API answers that with a 400, not an empty page.
 */
export function PagedPanel<T>({
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

  if (isPending) return <PagedPanelSkeleton />

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

  if (data.totalCount === 0) return <p className="text-sm text-muted-foreground/70 py-2">{emptyMessage}</p>

  return (
    <div className={cn('flex flex-col gap-3', isFetching && 'opacity-60 transition-opacity')}>
      {children(data.items)}
      <Pager result={data} isFetching={isFetching} onPageChange={onPageChange} />
    </div>
  )
}
