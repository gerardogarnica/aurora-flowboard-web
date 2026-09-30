import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SWATCH_TINT_ALPHA, resolveSwatchColor, resolveSwatchInk } from '@/shared/constants/colors'
import { PriorityBars } from '@/features/work-items/components/PriorityBars'
import { PRIORITY_BARS, WORK_ITEM_TYPE_CONFIG } from '@/features/work-items/constants/work-item-display'
import { MemberAvatar, UnassignedAvatar } from '@/features/work-items/components/MemberAvatar'
import type { ProjectBoardWorkItem } from '@/features/projects/types/project.types'

const FALLBACK_TYPE = { icon: BookOpen, className: 'text-muted-foreground', label: 'Unknown' }

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

export function WorkItemCard({ item, onSelect }: { item: ProjectBoardWorkItem; onSelect: (code: string) => void }) {
  const { icon: TypeIcon, className: typeClass, label: typeLabel } = WORK_ITEM_TYPE_CONFIG[item.type] ?? FALLBACK_TYPE
  const priorityLabel = PRIORITY_BARS[item.priority]?.label ?? item.priority

  return (
    <div
      onClick={() => onSelect(item.code)}
      className="bg-background border border-border rounded-lg p-3 flex flex-col gap-2.5 hover:border-foreground/20 transition-colors cursor-pointer"
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
            <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
              {item.title}
            </p>
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
                  {item.assigneeInitials ? (
                    <MemberAvatar userId={item.assigneeId!} initials={item.assigneeInitials} />
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
}
