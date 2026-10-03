import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataTableColumn {
  /** Header text; '' for a column that only holds row actions. */
  label: string
  align?: 'start' | 'end'
}

interface DataTableProps {
  /**
   * The row grid, e.g. `grid grid-cols-[minmax(0,1fr)_104px_100px_40px] items-center gap-4 px-4`.
   * The header uses it here and each row uses it too, so the columns line up.
   */
  gridClassName: string
  columns: DataTableColumn[]
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  /** One placeholder row, repeated `skeletonCount` times while loading. */
  skeletonRow: ReactNode
  skeletonCount?: number
  /** Usually an `<ErrorState>` with the query's `refetch`. */
  error: ReactNode
  /** Usually an `<EmptyState>`. */
  empty: ReactNode
  /** The rows — each renders its own `gridClassName` container. */
  children: ReactNode
}

/**
 * The bordered list shell shared by the admin tables (Components, Milestones, People):
 * header row, then exactly one of loading skeleton, error, empty state or rows.
 */
export function DataTable({
  gridClassName,
  columns,
  isLoading,
  isError,
  isEmpty,
  skeletonRow,
  skeletonCount = 3,
  error,
  empty,
  children,
}: DataTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className={cn(gridClassName, 'py-2 border-b border-border bg-muted/30')}>
        {columns.map((column, i) => (
          <span
            key={i}
            className={cn(
              'text-[10px] font-semibold tracking-widest text-muted-foreground uppercase',
              column.align === 'end' && 'justify-self-end',
            )}
          >
            {column.label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="divide-y divide-border/60">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i}>{skeletonRow}</div>
          ))}
        </div>
      ) : isError ? (
        error
      ) : isEmpty ? (
        empty
      ) : (
        <div className="divide-y divide-border/60">{children}</div>
      )}
    </div>
  )
}
