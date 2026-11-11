import type { ReactNode } from 'react'
import { CircleCheckBig, CircleUser, TriangleAlert, UserPlus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/shared/components/ErrorState'
import { getErrorMessage } from '@/shared/lib/error-message'
import type { DashboardResponse } from '../types/dashboard.types'

function PriorityGlyph() {
  return (
    <span className="flex h-3.5 items-end gap-0.5">
      <span className="h-1.5 w-[3.5px] rounded-[1px] bg-current" />
      <span className="h-2.5 w-[3.5px] rounded-[1px] bg-current" />
      <span className="h-3.5 w-[3.5px] rounded-[1px] bg-current" />
    </span>
  )
}

function Kpi({
  label,
  value,
  icon,
  iconClassName,
  alarm = false,
}: {
  label: string
  value: number | undefined
  icon: ReactNode
  iconClassName: string
  alarm?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <span className={cn('flex h-7.5 w-7.5 items-center justify-center rounded-md', iconClassName)}>{icon}</span>
      <div>
        {value === undefined ? (
          <Skeleton className="h-8 w-10" />
        ) : (
          <div className={cn('text-2xl font-semibold tracking-tight tabular-nums', alarm && value > 0 && 'text-red-600')}>
            {value}
          </div>
        )}
        <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function KpiGroup({ title, scope, children }: { title: string; scope: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{title}</span>
        <span className="text-[11px] text-muted-foreground/75">{scope}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">{children}</div>
    </div>
  )
}

/** Two groups with their scope spelled out, so "Stalled" here and there never read as the same number. */
export function DashboardKpis({
  data,
  error,
  onRetry,
  isRetrying,
}: {
  data: DashboardResponse | undefined
  error: Error | null
  onRetry: () => void
  isRetrying: boolean
}) {
  if (!data && error) {
    return (
      <ErrorState
        title="Couldn't load your metrics"
        description={getErrorMessage(error)}
        onRetry={onRetry}
        isRetrying={isRetrying}
        className="rounded-lg border border-border bg-card py-8"
      />
    )
  }

  const alert = <TriangleAlert className="h-4 w-4" />
  const alertStyle = 'bg-red-50 text-red-600'

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
      <KpiGroup title="You" scope="assigned to me">
        <Kpi label="My open items" value={data?.me.open} icon={<CircleUser className="h-4 w-4" />} iconClassName="bg-primary/10 text-primary" />
        <Kpi label="Stalled 7+ days" value={data?.me.stalled} icon={alert} iconClassName={alertStyle} alarm />
        <Kpi label="Critical & high" value={data?.me.criticalHigh} icon={<PriorityGlyph />} iconClassName="bg-amber-50 text-amber-700" />
      </KpiGroup>
      <span aria-hidden className="mt-5.5 hidden bg-border xl:block" />
      <KpiGroup title="Your projects" scope="projects I'm a member of">
        <Kpi label="Stalled 7+ days" value={data?.team.stalled} icon={alert} iconClassName={alertStyle} alarm />
        <Kpi label="Unassigned" value={data?.team.unassigned} icon={<UserPlus className="h-4 w-4" />} iconClassName="bg-accent text-accent-foreground" />
        <Kpi label="Closed last 7 days" value={data?.team.closedLast7Days} icon={<CircleCheckBig className="h-4 w-4" />} iconClassName="bg-emerald-50 text-emerald-600" />
      </KpiGroup>
    </div>
  )
}
