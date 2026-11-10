import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getDaysInState, getWorkItemAgeLevel, type WorkItemAgeLevel } from '../utils/work-item-age'
import type { WorkItemStage } from '../types/work-item.types'

const LEVEL_CLASS: Record<WorkItemAgeLevel, string> = {
  neutral: 'text-muted-foreground',
  warning: 'bg-amber-50 text-amber-700 font-semibold',
  stalled: 'bg-red-50 text-red-600 font-semibold',
}

/** Time in the current state, colored by the shared rule. Needs a `TooltipProvider` above it. */
export function WorkItemAgeBadge({
  enteredOnUtc,
  stage,
  className,
}: {
  enteredOnUtc: string
  stage: WorkItemStage | null | undefined
  className?: string
}) {
  const days = getDaysInState(enteredOnUtc)
  const level = getWorkItemAgeLevel(stage, days)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            data-age-level={level}
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] leading-none tabular-nums text-center',
              LEVEL_CLASS[level],
              className,
            )}
          >
            {days}d
          </span>
        }
      />
      <TooltipContent>
        In this state for {days} {days === 1 ? 'day' : 'days'}
      </TooltipContent>
    </Tooltip>
  )
}
