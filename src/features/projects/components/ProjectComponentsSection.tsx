import { useState } from 'react'
import { Archive, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InlineEditText } from '@/shared/components/InlineEditText'
import { DataTable } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatDateTime } from '@/shared/lib/date-format'
import { useProjectComponents } from '../hooks/useProjectComponents'
import { useRenameComponent } from '../hooks/useRenameComponent'
import { useRetireComponent } from '../hooks/useRetireComponent'
import { COMPONENT_NAME_MAX_LENGTH } from '../constants/component-limits'
import type { ProjectComponent, ProjectComponentStatus } from '../types/component.types'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_104px_100px_40px] items-center gap-4 px-4'

const INTRO =
  'Break this project down into the pieces you want to track independently — things like "Internal API", "Client Portal", "Payments Module", or "Mobile App".'

const STATUS_BADGE: Record<ProjectComponentStatus, { label: string; className: string }> = {
  Active:  { label: 'Active',  className: 'bg-emerald-50 text-emerald-600' },
  Retired: { label: 'Retired', className: 'bg-muted text-muted-foreground' },
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
  const mutation = useRenameComponent()

  return (
    <InlineEditText
      value={component.name}
      canEdit={canEdit}
      editLabel={`Rename ${component.name}`}
      maxLength={COMPONENT_NAME_MAX_LENGTH}
      onCommit={(name) => mutation.mutateAsync({ componentId: component.id, projectId, name })}
      className={cn(
        'block text-sm font-medium text-foreground truncate',
        component.status === 'Retired' && 'text-muted-foreground',
      )}
      inputClassName="h-7 py-1 -mx-1"
    />
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Retire component?"
        description={
          <>
            <span className="font-medium text-foreground">{component.name}</span> will be marked as retired and
            hidden from active use. This can't be undone.
          </>
        }
        confirmLabel="Retire component"
        variant="destructive"
        onConfirm={handleConfirm}
        isPending={mutation.isPending}
        pendingLabel="Retiring…"
      />
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

export function ProjectComponentsSection({
  projectId,
  isProjectAdmin,
}: {
  projectId: string
  isProjectAdmin: boolean
}) {
  const { data: components = [], isLoading, isError, isFetching, refetch } = useProjectComponents(projectId)

  const sorted = [...components].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Active' ? -1 : 1
    return new Date(b.createdOnUtc).getTime() - new Date(a.createdOnUtc).getTime()
  })

  return (
    <div className="flex-1 overflow-y-auto px-8 py-4">
      <p className="text-sm text-muted-foreground mb-4">{INTRO}</p>

      <TooltipProvider>
        <DataTable
          gridClassName={ROW_GRID}
          columns={[{ label: 'Name' }, { label: 'Status' }, { label: 'Created' }, { label: '' }]}
          isLoading={isLoading}
          isError={isError}
          isEmpty={sorted.length === 0}
          skeletonRow={<SkeletonRow />}
          error={<ErrorState title="Couldn't load components" onRetry={() => refetch()} isRetrying={isFetching} />}
          empty={<EmptyState icon={Boxes} title="No components yet" description={INTRO} />}
        >
          {sorted.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
              projectId={projectId}
              isProjectAdmin={isProjectAdmin}
            />
          ))}
        </DataTable>
      </TooltipProvider>
    </div>
  )
}
