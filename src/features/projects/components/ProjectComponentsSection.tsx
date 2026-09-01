import { useState } from 'react'
import { Archive, Boxes, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjectComponents } from '../hooks/useProjectComponents'
import { useRenameComponent } from '../hooks/useRenameComponent'
import { useRetireComponent } from '../hooks/useRetireComponent'
import type { ProjectComponent, ProjectComponentStatus } from '../types/component.types'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_104px_100px_40px] items-center gap-4 px-4'

const STATUS_BADGE: Record<ProjectComponentStatus, { label: string; className: string }> = {
  Active:  { label: 'Active',  className: 'bg-emerald-50 text-emerald-600' },
  Retired: { label: 'Retired', className: 'bg-muted text-muted-foreground' },
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StatusPill({ status }: { status: ProjectComponentStatus }) {
  const badge = STATUS_BADGE[status]
  return (
    <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap w-fit', badge.className)}>
      {badge.label}
    </span>
  )
}

function EditableComponentName({
  component,
  projectId,
  canEdit,
}: {
  component: ProjectComponent
  projectId: string
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(component.name)
  const mutation = useRenameComponent()

  function startEditing() {
    if (!canEdit) return
    setDraft(component.name)
    setIsEditing(true)
  }

  function commit() {
    const trimmed = draft.trim()
    setIsEditing(false)
    if (!trimmed || trimmed === component.name) return
    mutation.mutate({ componentId: component.id, projectId, name: trimmed })
  }

  function cancel() {
    setDraft(component.name)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        className="h-7 py-1 text-sm -mx-1"
      />
    )
  }

  return (
    <p
      onClick={startEditing}
      className={cn(
        'text-sm font-medium text-foreground truncate',
        canEdit && '-mx-1 px-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer',
        component.status === 'Retired' && 'text-muted-foreground',
      )}
    >
      {component.name}
    </p>
  )
}

function RetireButton({ component, projectId }: { component: ProjectComponent; projectId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const mutation = useRetireComponent()

  function handleConfirm() {
    mutation.mutate({ componentId: component.id, projectId }, { onSuccess: () => setConfirmOpen(false) })
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={() => setConfirmOpen(true)}
              aria-label={`Retire ${component.name}`}
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          }
        />
        <TooltipContent>Retire {component.name}</TooltipContent>
      </Tooltip>

      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!mutation.isPending) setConfirmOpen(open) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Retire component?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{component.name}</span> will be marked as retired and
              hidden from active use. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Retiring…
                </>
              ) : (
                'Retire component'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ComponentRow({
  component,
  projectId,
  isProjectAdmin,
}: {
  component: ProjectComponent
  projectId: string
  isProjectAdmin: boolean
}) {
  const canEdit = isProjectAdmin && component.status === 'Active'

  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <EditableComponentName component={component} projectId={projectId} canEdit={canEdit} />
      <StatusPill status={component.status} />
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(component.createdOnUtc)}</span>
          }
        />
        <TooltipContent>
          Created {formatDateTime(component.createdOnUtc)}
          {component.updatedOnUtc && <> · Updated {formatDateTime(component.updatedOnUtc)}</>}
        </TooltipContent>
      </Tooltip>
      <div className="justify-self-end">
        {canEdit && <RetireButton component={component} projectId={projectId} />}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-4 w-14 rounded-full" />
      <Skeleton className="h-3.5 w-16" />
      <Skeleton className="h-6 w-6 rounded-md justify-self-end" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Boxes className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">No components yet</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Break this project down into the pieces you want to track independently — things like "Internal API", "Client Portal", "Payments Module", or "Mobile App".
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-foreground">Couldn't load components</p>
      <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function ProjectComponentsSection({
  projectId,
  isProjectAdmin,
}: {
  projectId: string
  isProjectAdmin: boolean
}) {
  const { data: components = [], isLoading, isError, refetch } = useProjectComponents(projectId)

  const sorted = [...components].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Active' ? -1 : 1
    return new Date(b.createdOnUtc).getTime() - new Date(a.createdOnUtc).getTime()
  })

  return (
    <div className="flex-1 overflow-y-auto px-8 py-4">
      <p className="text-sm text-muted-foreground mb-4">
        Break this project down into the pieces you want to track independently — things like "Internal API", "Client Portal", "Payments Module", or "Mobile App".
      </p>

      <TooltipProvider>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className={cn(ROW_GRID, 'py-2 border-b border-border bg-muted/30')}>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Name</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Status</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Created</span>
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
              {sorted.map((component) => (
                <ComponentRow
                  key={component.id}
                  component={component}
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
