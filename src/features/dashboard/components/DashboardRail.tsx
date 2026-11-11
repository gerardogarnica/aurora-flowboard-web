import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getDaysInState } from '@/features/work-items/utils/work-item-age'
import { getWorkItemBoardPath } from '@/features/work-items/utils/work-item-links'
import { SWATCH_TINT_ALPHA, resolveSwatchColor } from '@/shared/constants/colors'
import type { AgingBucket, DashboardMilestone, DashboardResponse } from '../types/dashboard.types'
import { getMilestoneDate } from '../utils/milestone-date'
import { MilestoneDateLabel } from './MilestoneDateLabel'
import { StalledCount } from './StalledCount'

const CARD = 'flex flex-col gap-3.5 rounded-lg border border-border bg-card p-4'
const HEADING = 'text-[13px] font-semibold tracking-wide uppercase'

function bucketLabel({ from, to }: AgingBucket) {
  return to === null ? `${from}+ days` : `${from}–${to} days`
}

function bucketColor(from: number) {
  if (from >= 14) return 'bg-red-600'
  if (from >= 7) return 'bg-orange-500'
  if (from >= 4) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function AgingCard({ aging }: { aging: DashboardResponse['aging'] }) {
  const total = aging.buckets.reduce((sum, b) => sum + b.count, 0)
  const largest = Math.max(1, ...aging.buckets.map((b) => b.count))
  const oldest = aging.oldestInFlight
  const oldestDays = oldest ? getDaysInState(oldest.enteredCurrentStateOnUtc) : 0

  return (
    <section className={CARD}>
      <div className="flex flex-col gap-0.5">
        <h2 className={HEADING}>Aging work in progress</h2>
        <span className="text-[11px] text-muted-foreground">
          {total} {total === 1 ? 'item' : 'items'} in flight, by time in state
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {aging.buckets.map((bucket) => (
          <div key={bucket.from} className="flex items-center gap-2.5">
            <span className="w-18 shrink-0 text-xs text-muted-foreground">{bucketLabel(bucket)}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-[3px] bg-muted">
              <span
                className={cn('block h-full', bucketColor(bucket.from))}
                style={{ width: `${(bucket.count / largest) * 100}%` }}
              />
            </span>
            <span className="w-5 shrink-0 text-right text-xs font-medium tabular-nums">{bucket.count}</span>
          </div>
        ))}
      </div>
      {oldest && (
        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
          <span className="text-xs text-muted-foreground">Oldest in flight</span>
          <Link
            to={getWorkItemBoardPath(oldest.projectId, oldest.code)}
            className="truncate text-xs font-medium text-foreground hover:underline"
          >
            {oldest.code} · {oldestDays} {oldestDays === 1 ? 'day' : 'days'}
          </Link>
        </div>
      )}
    </section>
  )
}

function MilestoneRow({ milestone }: { milestone: DashboardMilestone }) {
  const navigate = useNavigate()
  const { linkedTotal, linkedClosed, linkedStalled } = milestone
  const to = `/projects/${encodeURIComponent(milestone.projectId)}/milestones`
  const hex = resolveSwatchColor(milestone.color)
  const progress = linkedTotal > 0 ? (linkedClosed / linkedTotal) * 100 : 0

  return (
    <li
      onClick={() => navigate(to)}
      className="-mx-2 flex cursor-pointer flex-col gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: hex }} />
        <Link
          to={to}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 truncate text-[13px] font-medium text-foreground outline-none hover:text-foreground"
        >
          {milestone.name}
        </Link>
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{milestone.projectName}</span>
        <MilestoneDateLabel variant="pill" date={getMilestoneDate(milestone.targetEndDate, linkedTotal, linkedClosed)} />
      </div>
      <div className="flex items-center gap-2 pl-4">
        <span
          className="h-1.5 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: `${hex}${SWATCH_TINT_ALPHA}` }}
        >
          <span className="block h-full" style={{ width: `${progress}%`, backgroundColor: hex }} />
        </span>
        <span className="w-8 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
          {linkedClosed}/{linkedTotal}
        </span>
        <StalledCount count={linkedStalled} className="w-14.5 shrink-0 text-right text-[11px]" />
      </div>
    </li>
  )
}

/**
 * A milestone without linked items has no progress to show, so the card skips it. The API still
 * sends it (this is a frontend decision), and the portfolio's milestone chip can still show it.
 */
function MilestonesCard({ milestones }: { milestones: DashboardMilestone[] }) {
  const linked = milestones.filter((milestone) => milestone.linkedTotal > 0)

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={HEADING}>Milestones</h2>
        <span className="text-[11px] text-muted-foreground">{linked.length} active · progress of linked items</span>
      </div>
      {linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {milestones.length === 0 ? 'No active milestones' : 'No work items linked to active milestones'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {linked.map((milestone) => (
            <MilestoneRow key={milestone.id} milestone={milestone} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function DashboardRailSkeleton() {
  return (
    <>
      {[4, 3].map((rows) => (
        <div key={rows} aria-hidden className={CARD}>
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      ))}
    </>
  )
}

export function DashboardRail({ data }: { data: DashboardResponse }) {
  return (
    <>
      <AgingCard aging={data.aging} />
      <MilestonesCard milestones={data.milestones} />
    </>
  )
}
