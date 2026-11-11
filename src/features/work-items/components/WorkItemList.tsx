import { Link, useNavigate } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { UnassignedAvatar, UserAvatar } from '@/shared/components/UserAvatar'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { getErrorMessage } from '@/shared/lib/error-message'
import type { PagedResult } from '@/shared/types/paged-result.types'
import { getPriorityBars, getWorkItemTypeConfig } from '../constants/work-item-display'
import type { WorkItemListItem } from '../types/work-item.types'
import { getWorkItemBoardPath } from '../utils/work-item-links'
import { MilestoneTag } from './MilestoneTag'
import { PriorityBars } from './PriorityBars'
import { WorkItemAgeBadge } from './WorkItemAgeBadge'

function WorkItemRow({ item }: { item: WorkItemListItem }) {
  const navigate = useNavigate()
  const to = getWorkItemBoardPath(item.projectId, item.code)
  const { icon: TypeIcon, className: typeClass, label: typeLabel } = getWorkItemTypeConfig(item.type)

  return (
    // The whole row is clickable for the pointer; the keyboard reaches it through the title's link.
    <li
      onClick={() => navigate(to)}
      className="flex cursor-pointer items-center gap-3 border-b border-border/40 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 has-[a:focus-visible]:ring-inset"
    >
      <Tooltip>
        <TooltipTrigger render={<span className="flex shrink-0"><PriorityBars priority={item.priority} /></span>} />
        <TooltipContent>Priority: {getPriorityBars(item.priority).label}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<span className="flex shrink-0"><TypeIcon className={cn('h-3.5 w-3.5', typeClass)} /></span>} />
        <TooltipContent>{typeLabel}</TooltipContent>
      </Tooltip>
      <span className="w-18 shrink-0 truncate font-mono text-xs text-muted-foreground">{item.code}</span>

      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          to={to}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${item.code}: ${item.title}`}
          className="min-w-0 truncate text-sm text-foreground outline-none hover:text-foreground"
        >
          {item.title}
        </Link>
        {item.milestoneName && (
          <MilestoneTag
            name={item.milestoneName}
            color={item.milestoneColor}
            className="hidden max-w-40 min-w-0 @3xl:inline-flex"
          />
        )}
      </span>

      <span className="hidden max-w-36 shrink-0 items-center gap-1.5 @2xl:inline-flex">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: resolveSwatchColor(item.projectColor) }} />
        <span className="truncate text-xs text-muted-foreground">{item.projectName}</span>
      </span>
      <span className="w-24 shrink-0 truncate text-right text-xs text-muted-foreground">{item.flowStateName}</span>
      <WorkItemAgeBadge enteredOnUtc={item.enteredCurrentStateOnUtc} stage={item.stage} className="w-11 py-1" />
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="flex shrink-0">
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
    </li>
  )
}

/**
 * The rows of My work and My Issues, with their loading, error and empty states. A background
 * refresh changes nothing on screen. Needs a `TooltipProvider` above it.
 */
export function WorkItemList({
  query,
  emptyMessage,
  skeletonRows = 5,
}: {
  query: UseQueryResult<PagedResult<WorkItemListItem>>
  emptyMessage: string
  skeletonRows?: number
}) {
  const { data, isError, error, refetch, isFetching, isPlaceholderData } = query

  if (!data) {
    if (isError) {
      return (
        <ErrorState
          title="Couldn't load your work items"
          description={getErrorMessage(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
          className="py-10"
        />
      )
    }
    return (
      <div aria-hidden className="flex flex-col">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/40 px-4 py-3 last:border-b-0">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (data.totalCount === 0 && !isPlaceholderData) return <EmptyState title={emptyMessage} className="py-10" />

  return (
    <ul className={cn('@container flex flex-col transition-opacity', isPlaceholderData && 'opacity-60')}>
      {data.items.map((item) => (
        <WorkItemRow key={item.workItemId} item={item} />
      ))}
    </ul>
  )
}
