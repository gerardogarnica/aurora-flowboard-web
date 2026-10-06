import { memo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SWATCH_TINT_ALPHA, resolveSwatchColor, resolveSwatchInk } from '@/shared/constants/colors'
import { PriorityBars } from '@/features/work-items/components/PriorityBars'
import { getPriorityBars, getWorkItemTypeConfig } from '@/features/work-items/constants/work-item-display'
import { UserAvatar, UnassignedAvatar } from '@/shared/components/UserAvatar'
import type { ProjectBoardWorkItem } from '@/features/projects/types/project.types'
import { useDraggableCard } from '@/features/projects/hooks/useDraggableCard'
import { SINGLE_LANE_KEY } from '@/features/projects/utils/board-drag-data'

function MilestoneTag({
  name,
  color,
  standalone,
}: {
  name: string
  color: string | null
  standalone: boolean
}) {
  const hex = resolveSwatchColor(color ?? '')
  const ink = resolveSwatchInk(color ?? '')

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="secondary"
            className={cn(
              'border-transparent font-normal truncate',
              standalone ? 'max-w-full min-w-0 self-start' : 'min-w-0 shrink',
            )}
            style={{ backgroundColor: `${hex}${SWATCH_TINT_ALPHA}`, color: ink }}
          >
            {name}
          </Badge>
        }
      />
      <TooltipContent>Milestone: {name}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Memoized: a board renders every card, and the page re-renders on each refetch and URL change.
 * `item` keeps its identity across refetches when unchanged (React Query's structural sharing),
 * so only the cards that actually changed re-render — as long as `onSelect` is stable too.
 */
export const WorkItemCard = memo(function WorkItemCard({
  item,
  onSelect,
  dragLaneKey = SINGLE_LANE_KEY,
  isDraggable = false,
}: {
  item: ProjectBoardWorkItem
  onSelect: (code: string) => void
  /** The swimlane the card sits in (`SINGLE_LANE_KEY` without grouping); it can only be dropped in that lane. */
  dragLaneKey?: string
  /** Primitive on purpose: a per-render object or callback here would defeat the `memo`. */
  isDraggable?: boolean
}) {
  const { icon: TypeIcon, className: typeClass, label: typeLabel } = getWorkItemTypeConfig(item.type)
  const priorityLabel = getPriorityBars(item.priority).label
  const ref = useRef<HTMLDivElement>(null)
  const isDragging = useDraggableCard(ref, {
    enabled: isDraggable,
    workItemId: item.workItemId,
    code: item.code,
    fromStateId: item.flowStateId,
    laneKey: dragLaneKey,
  })

  return (
    // The whole card stays clickable for the pointer; the keyboard reaches it through the title,
    // a real button (Tab, Enter/Space) that the card shows a focus ring for. A native drag never
    // fires the click, so dragging doesn't open the detail.
    <div
      ref={ref}
      onClick={() => onSelect(item.code)}
      className={cn(
        'bg-background border border-border rounded-lg p-3 flex flex-col gap-2.5 hover:border-foreground/20 transition-colors cursor-pointer has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50',
        isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Tooltip>
            <TooltipTrigger render={<span className="shrink-0 flex"><TypeIcon className={cn('w-3.5 h-3.5', typeClass)} /></span>} />
            <TooltipContent>{typeLabel}</TooltipContent>
          </Tooltip>
          <span className="text-xs font-mono text-muted-foreground truncate">{item.code}</span>
        </div>
        <Tooltip>
          <TooltipTrigger render={<span className="shrink-0 flex"><PriorityBars priority={item.priority} /></span>} />
          <TooltipContent>Priority: {priorityLabel}</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={(e) => {
                // The card's own onClick would select it a second time (two history entries).
                e.stopPropagation()
                onSelect(item.code)
              }}
              aria-label={`${item.code}: ${item.title}`}
              className="text-left text-sm font-medium text-foreground line-clamp-2 leading-snug outline-none cursor-pointer"
            >
              {item.title}
            </button>
          }
        />
        <TooltipContent>{item.title}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col gap-1.5">
        {item.milestoneName && item.component && (
          <MilestoneTag name={item.milestoneName} color={item.milestoneColor} standalone />
        )}

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 flex items-center overflow-hidden">
            {item.milestoneName && !item.component ? (
              <MilestoneTag name={item.milestoneName} color={item.milestoneColor} standalone={false} />
            ) : item.component ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge
                      variant="outline"
                      className="min-w-0 shrink truncate border-border/60 font-normal text-muted-foreground"
                    >
                      {item.component}
                    </Badge>
                  }
                />
                <TooltipContent>Component: {item.component}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="shrink-0 flex">
                  {item.assigneeId && item.assigneeInitials ? (
                    <UserAvatar userId={item.assigneeId} initials={item.assigneeInitials} />
                  ) : (
                    <UnassignedAvatar />
                  )}
                </span>
              }
            />
            <TooltipContent>{item.assigneeFullName ?? 'Unassigned'}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
})
