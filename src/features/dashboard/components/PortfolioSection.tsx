import { Link, useNavigate } from 'react-router-dom'
import { Milestone as MilestoneIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getProjectKindConfig } from '@/features/projects/constants/project-kinds'
import { MemberAvatarStack } from '@/shared/components/MemberAvatarStack'
import { SWATCH_TINT_ALPHA, resolveSwatchColor, resolveSwatchInk } from '@/shared/constants/colors'
import type { PortfolioProject } from '../types/dashboard.types'
import { getMilestoneDate } from '../utils/milestone-date'
import { MilestoneDateLabel } from './MilestoneDateLabel'
import { StalledCount } from './StalledCount'

function MilestoneChip({ milestone }: { milestone: PortfolioProject['activeMilestone'] }) {
  if (!milestone) return <span className="text-[11px] text-muted-foreground/60">No open milestone</span>

  const { linkedTotal, linkedClosed, targetEndDate } = milestone
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
      style={{
        backgroundColor: `${resolveSwatchColor(milestone.color)}${SWATCH_TINT_ALPHA}`,
        color: resolveSwatchInk(milestone.color),
      }}
    >
      <MilestoneIcon className="h-3 w-3 shrink-0" />
      <span className="min-w-0 truncate">{milestone.name}</span>
      <span className="flex shrink-0 gap-1 tabular-nums opacity-80">
        {linkedClosed}/{linkedTotal}
        {targetEndDate && (
          <>
            <span>·</span>
            <MilestoneDateLabel variant="inline" date={getMilestoneDate(targetEndDate, linkedTotal, linkedClosed)} />
          </>
        )}
      </span>
    </span>
  )
}

/** The project's open work per Active state, in board order: a miniature of its board. */
function FlowBar({ project }: { project: PortfolioProject }) {
  if (project.open === 0) {
    return <span data-testid="empty-flow-bar" className="block h-2 min-w-0 flex-1 rounded-full bg-foreground/10" />
  }
  return (
    <span className="flex h-2 min-w-0 flex-1 gap-px overflow-hidden rounded-full">
      {project.distribution
        .filter((state) => state.count > 0)
        .map((state) => (
          <Tooltip key={state.flowStateId}>
            <TooltipTrigger
              render={
                <span
                  aria-label={`${state.name}: ${state.count}`}
                  className="h-full"
                  style={{ flexGrow: state.count, backgroundColor: resolveSwatchColor(state.color) }}
                />
              }
            />
            <TooltipContent>
              {state.name}: {state.count}
            </TooltipContent>
          </Tooltip>
        ))}
    </span>
  )
}

function PortfolioRow({ project }: { project: PortfolioProject }) {
  const navigate = useNavigate()
  const to = `/projects/${encodeURIComponent(project.projectId)}/board`
  const hex = resolveSwatchColor(project.color)

  return (
    <li
      onClick={() => navigate(to)}
      className="flex cursor-pointer items-center gap-4 border-b border-border/40 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 has-[a:focus-visible]:ring-inset"
    >
      <span aria-hidden className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full opacity-25" style={{ backgroundColor: hex }} />
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
      </span>
      <Link
        to={to}
        onClick={(e) => e.stopPropagation()}
        className="w-37 shrink-0 truncate text-sm font-medium text-foreground outline-none hover:text-foreground"
      >
        {project.name}
      </Link>
      <span className="hidden w-16 shrink-0 rounded-full border border-border py-0.5 text-center text-[11px] text-muted-foreground @2xl:block">
        {getProjectKindConfig(project.kind).label}
      </span>
      <span className="hidden w-57 shrink-0 @3xl:flex">
        <MilestoneChip milestone={project.activeMilestone} />
      </span>
      <FlowBar project={project} />
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{project.open} open</span>
      <StalledCount count={project.stalled} pill className="w-18.5 shrink-0 text-[11px]" />
      <span className="flex w-20 shrink-0">
        <MemberAvatarStack members={project.members} size="sm" />
      </span>
    </li>
  )
}

export function PortfolioSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-2.5">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

export function PortfolioSection({ portfolio }: { portfolio: PortfolioProject[] }) {
  const open = portfolio.reduce((sum, p) => sum + p.open, 0)
  const stalled = portfolio.reduce((sum, p) => sum + p.stalled, 0)

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[13px] font-semibold tracking-wide uppercase">Portfolio</h2>
        <span className="text-xs text-muted-foreground">
          {open} open · {stalled} stalled across {portfolio.length} {portfolio.length === 1 ? 'project' : 'projects'}
        </span>
      </div>
      <ul className="@container flex flex-col rounded-lg border border-border bg-card">
        {portfolio.map((project) => (
          <PortfolioRow key={project.projectId} project={project} />
        ))}
      </ul>
    </section>
  )
}
