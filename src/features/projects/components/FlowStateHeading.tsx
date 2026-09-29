import { cn } from '@/lib/utils'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

export function CountPill({ count }: { count: number }) {
  return (
    <span className="text-xs font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5 tabular-nums shrink-0">
      {count}
    </span>
  )
}

export function FlowStateHeading({ column, className }: { column: ProjectBoardColumn; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex-1 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase truncate">
        {column.flowStateName}
      </span>
      <CountPill count={column.workItems.length} />
    </div>
  )
}
