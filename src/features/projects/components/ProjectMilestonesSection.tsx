import { useState } from 'react'
import { Milestone, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjectMilestones } from '../hooks/useProjectMilestones'
import { useUpdateMilestoneStatus } from '../hooks/useUpdateMilestoneStatus'
import {
  MILESTONE_STATUS_BADGE,
  MILESTONE_STATUS_ORDER,
  getAllowedMilestoneTransitions,
  type MilestoneAction,
} from '../constants/milestone-status'
import { MilestoneFormModal } from './MilestoneFormModal'
import type { MilestoneStatus, ProjectMilestone } from '../types/project.types'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_120px_170px_40px] items-center gap-4 px-4'

const INTRO =
  'Plan this project in time-boxed chunks with a defined scope and end — things like "Mobile app v1" or "Phase 1 delivery".'

const PILL_BASE = 'text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap w-fit'

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Target dates are date-only ('2026-08-31'), not timestamps: `new Date(value)` would parse
 * them as UTC midnight and render the previous day in negative-offset timezones.
 */
function formatTargetDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusPill({ status, className }: { status: MilestoneStatus; className?: string }) {
  const badge = MILESTONE_STATUS_BADGE[status]
  return <span className={cn(PILL_BASE, badge.className, className)}>{badge.label}</span>
}

function MilestoneStatusControl({
  milestone,
  canEdit,
  onSelect,
}: {
  milestone: ProjectMilestone
  canEdit: boolean
  onSelect: (next: MilestoneAction) => void
}) {
  const [pendingStatus, setPendingStatus] = useState<MilestoneAction | null>(null)
  const badge = MILESTONE_STATUS_BADGE[milestone.status]
  const transitions = getAllowedMilestoneTransitions(milestone.status)

  function handleConfirm() {
    if (!pendingStatus) return
    onSelect(pendingStatus)
    setPendingStatus(null)
  }

  if (!canEdit || transitions.length === 0) {
    return <StatusPill status={milestone.status} className="cursor-default" />
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(PILL_BASE, 'cursor-pointer hover:ring-1 hover:ring-border select-none border-0', badge.className)}
        >
          {badge.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-35">
          {transitions.map((next) => (
            <DropdownMenuItem
              key={next}
              className="gap-2 cursor-pointer"
              onClick={() => setPendingStatus(next)}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', MILESTONE_STATUS_BADGE[next].dotClass)} />
              {MILESTONE_STATUS_BADGE[next].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pendingStatus !== null} onOpenChange={(open) => { if (!open) setPendingStatus(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change milestone status</DialogTitle>
            <DialogDescription>
              Move <span className="font-medium text-foreground">{milestone.name}</span> from{' '}
              <StatusPill status={milestone.status} className="inline" /> to{' '}
              {pendingStatus && <StatusPill status={pendingStatus} className="inline" />}
              {pendingStatus === 'Archived' && ' — archived milestones can no longer be edited.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              Cancel
            </Button>
            <Button
              variant={pendingStatus === 'Archived' ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MilestoneDates({ milestone }: { milestone: ProjectMilestone }) {
  const { targetStartDate, targetEndDate } = milestone

  const content =
    !targetStartDate && !targetEndDate ? (
      <span className="text-xs text-muted-foreground/60">—</span>
    ) : (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {targetStartDate ? formatTargetDate(targetStartDate) : '—'}
        {' → '}
        {targetEndDate ? formatTargetDate(targetEndDate) : '—'}
      </span>
    )

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="w-fit">{content}</span>} />
      <TooltipContent>
        Created {formatDateTime(milestone.createdOnUtc)}
        {milestone.updatedOnUtc && <> · Updated {formatDateTime(milestone.updatedOnUtc)}</>}
      </TooltipContent>
    </Tooltip>
  )
}

function EditMilestoneButton({ milestone, projectId }: { milestone: ProjectMilestone; projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="secondary"
              size="icon-xs"
              onClick={() => setIsOpen(true)}
              aria-label={`Edit ${milestone.name}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          }
        />
        <TooltipContent>Edit {milestone.name}</TooltipContent>
      </Tooltip>

      <MilestoneFormModal
        projectId={projectId}
        milestone={milestone}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

function MilestoneRow({
  milestone,
  projectId,
  isProjectAdmin,
}: {
  milestone: ProjectMilestone
  projectId: string
  isProjectAdmin: boolean
}) {
  const canEdit = isProjectAdmin && milestone.status !== 'Archived'
  // No pending indicator on the pill: the mutation is optimistic, so the row already shows the
  // target status the moment the user confirms, and a failure rolls it back with a toast.
  const statusMutation = useUpdateMilestoneStatus()

  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <div className="min-w-0">
        <p
          className={cn(
            'text-sm font-medium text-foreground truncate',
            milestone.status === 'Archived' && 'text-muted-foreground',
          )}
        >
          {milestone.name}
        </p>
        {milestone.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{milestone.description}</p>
        )}
      </div>
      <MilestoneStatusControl
        milestone={milestone}
        canEdit={canEdit}
        onSelect={(status) => statusMutation.mutate({ milestoneId: milestone.id, projectId, status })}
      />
      <MilestoneDates milestone={milestone} />
      <div className="justify-self-end">
        {canEdit && <EditMilestoneButton milestone={milestone} projectId={projectId} />}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-4 w-14 rounded-full" />
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-6 w-6 rounded-md justify-self-end" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Milestone className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">No milestones yet</p>
      <p className="text-sm text-muted-foreground max-w-sm">{INTRO}</p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-foreground">Couldn't load milestones</p>
      <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function ProjectMilestonesSection({
  projectId,
  isProjectAdmin,
}: {
  projectId: string
  isProjectAdmin: boolean
}) {
  const { data: milestones = [], isLoading, isError, refetch } = useProjectMilestones(projectId)

  const sorted = [...milestones].sort((a, b) => {
    const rank = MILESTONE_STATUS_ORDER.indexOf(a.status) - MILESTONE_STATUS_ORDER.indexOf(b.status)
    if (rank !== 0) return rank

    // Soonest deadline first; milestones without one sink to the bottom of their group.
    if (a.targetEndDate !== b.targetEndDate) {
      if (!a.targetEndDate) return 1
      if (!b.targetEndDate) return -1
      return a.targetEndDate < b.targetEndDate ? -1 : 1
    }

    return new Date(b.createdOnUtc).getTime() - new Date(a.createdOnUtc).getTime()
  })

  return (
    <div className="flex-1 overflow-y-auto px-8 py-4">
      <p className="text-sm text-muted-foreground mb-4">{INTRO}</p>

      <TooltipProvider>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className={cn(ROW_GRID, 'py-2 border-b border-border bg-muted/30')}>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Name</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Status</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Target dates</span>
            <span />
          </div>

          {isLoading ? (
            <div className="divide-y divide-border/60">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/60">
              {sorted.map((milestone) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  projectId={projectId}
                  isProjectAdmin={isProjectAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}
