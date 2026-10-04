import { useCallback, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FolderX, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { ApiError } from '@/shared/lib/api-client'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RouteTabs } from '@/shared/components/RouteTabs'
import { useAuthStore } from '@/app/store/auth.store'
import { hasProjectAdminRole, isProjectViewer } from '@/features/projects/utils/project-permissions'
import { useProjectDetail } from '@/features/projects/hooks/useProjectDetail'
import { useProjectBoard } from '@/features/projects/hooks/useProjectBoard'
import { useProjectMilestones } from '@/features/projects/hooks/useProjectMilestones'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { WorkItemDetailModal } from '@/features/work-items/components/WorkItemDetailModal'
import { CreateWorkItemModal } from '@/features/work-items/components/CreateWorkItemModal'
import { MemberAvatarStack } from '@/shared/components/MemberAvatarStack'
import { ProjectDetailsModal } from './ProjectDetailsModal'
import { ProjectComponentsSection } from './ProjectComponentsSection'
import { AddComponentModal } from './AddComponentModal'
import { ProjectMilestonesSection } from './ProjectMilestonesSection'
import { MilestoneFormModal } from './MilestoneFormModal'
import { WorkItemCard } from './WorkItemCard'
import { FlowStateHeading } from './FlowStateHeading'
import { BoardGroupByControl } from './BoardGroupByControl'
import { BoardSwimlanes } from './BoardSwimlanes'
import { getProjectKindConfig } from '@/features/projects/constants/project-kinds'
import {
  BOARD_GROUP_BY_PARAM,
  parseBoardGroupBy,
  type BoardGroupBy,
} from '@/features/projects/constants/board-group-by'
import { groupBoardItems } from '@/features/projects/utils/group-board-items'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

// A stable empty board while the query loads: a fresh `[]` per render would recompute every
// useMemo that depends on the columns.
const NO_COLUMNS: ProjectBoardColumn[] = []

function isProjectUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 403)
}

function ProjectUnavailable() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="It may have been deleted, or you may not be a member of it."
        action={
          <Link to="/projects" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Back to projects
          </Link>
        }
        className="py-24"
      />
    </div>
  )
}

function BoardColumn({
  column,
  onSelectItem,
}: {
  column: ProjectBoardColumn
  onSelectItem: (code: string) => void
}) {
  const hex = resolveSwatchColor(column.color)

  return (
    <div className="flex-1 min-w-48 bg-sidebar border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="h-0.75 shrink-0" style={{ backgroundColor: hex }} />

      <div className="p-3 flex flex-col gap-3">
        <FlowStateHeading column={column} className="px-1" />

        <div className="flex flex-col gap-2">
          {column.workItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 flex items-center justify-center">
              <span className="text-xs text-muted-foreground/50">No items</span>
            </div>
          ) : (
            column.workItems.map((item) => (
              <WorkItemCard key={item.workItemId} item={item} onSelect={onSelectItem} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-muted" />
          <div className="h-3 w-14 rounded bg-muted" />
        </div>
        <div className="w-3.5 h-3.5 rounded bg-muted" />
      </div>
      <div className="h-3.5 w-full rounded bg-muted" />
      <div className="h-3.5 w-3/4 rounded bg-muted" />
      <div className="flex justify-end">
        <div className="w-6 h-6 rounded-full bg-muted" />
      </div>
    </div>
  )
}

function SkeletonColumn() {
  return (
    <div className="flex-1 min-w-48 bg-sidebar border border-border rounded-xl p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2.5 px-1 animate-pulse">
        <div className="h-2.5 w-28 rounded bg-muted flex-1" />
        <div className="h-4 w-6 rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

export function ProjectBoardPage() {
  const { id = '', tab } = useParams<{ id: string; tab?: string }>()
  const activeTab: 'board' | 'components' | 'milestones' =
    tab === 'components' || tab === 'milestones' ? tab : 'board'
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false)
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false)
  const projectQuery = useProjectDetail(id)
  const boardQuery = useProjectBoard(id)
  const project = projectQuery.data
  const { data: rawColumns = NO_COLUMNS, isLoading } = boardQuery
  const currentUser = useAuthStore((s) => s.user)

  const isProjectAdmin = hasProjectAdminRole(project?.members ?? [], currentUser?.id)

  const columns = useMemo(
    () => rawColumns.filter((col) => col.category !== 'Cancelled'),
    [rawColumns],
  )

  const groupBy = parseBoardGroupBy(searchParams.get(BOARD_GROUP_BY_PARAM))
  // Lanes start open; only the ones the user closed are tracked, so new groups arrive expanded.
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>([])
  const { data: milestones } = useProjectMilestones(id, { enabled: groupBy === 'milestone' })

  const groups = useMemo(
    () =>
      groupBy === 'none'
        ? []
        : groupBoardItems(columns, groupBy, { currentUserId: currentUser?.id, milestones }),
    [columns, groupBy, currentUser?.id, milestones],
  )
  const groupKeys = groups.map((g) => g.key)
  const openKeys = groupKeys.filter((key) => !collapsedKeys.includes(key))

  function handleGroupByChange(next: BoardGroupBy) {
    setCollapsedKeys([])
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'none') params.delete(BOARD_GROUP_BY_PARAM)
        else params.set(BOARD_GROUP_BY_PARAM, next)
        return params
      },
      { replace: true },
    )
  }

  function handleToggleAllLanes() {
    setCollapsedKeys(openKeys.length > 0 ? groupKeys : [])
  }

  const totalItems = columns.reduce((sum, col) => sum + col.workItems.length, 0)

  const subtitleParts = [
    project?.prefix,
    project?.description ?? undefined,
    `${totalItems} item${totalItems !== 1 ? 's' : ''}`,
  ].filter(Boolean)

  const KindIcon = project ? getProjectKindConfig(project.kind).icon : null

  const selectedCode = searchParams.get('selected')

  // Stable so the memoized WorkItemCards don't all re-render with the page.
  const handleSelectItem = useCallback(
    (code: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('selected', code)
        return next
      })
    },
    [setSearchParams],
  )

  function handleCloseModal() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('selected')
      return next
    })
  }

  // Status-only: the project accepts work-item writes at all.
  const projectAllowsWorkItems = !!project?.canAddOrUpdateWorkItems
  const isViewer = isProjectViewer(project?.members ?? [], currentUser?.id)
  // Viewers are read-only on work items, except comments.
  const canEditWorkItems = projectAllowsWorkItems && !isViewer
  // The backend rejects comment writes on Completed / Archived projects.
  const canComment =
    projectAllowsWorkItems && (project?.status === 'Active' || project?.status === 'Maintenance')

  const headerAction =
    activeTab === 'board'
      ? {
          label: '+ New issue',
          onClick: () => setIsCreateOpen(true),
          disabled: !canEditWorkItems,
          title: !projectAllowsWorkItems
            ? 'You do not have permission to add work items to this project'
            : isViewer
              ? "Viewers can't create work items"
              : undefined,
        }
      : activeTab === 'components' && isProjectAdmin
        ? { label: '+ Add component', onClick: () => setIsAddComponentOpen(true) }
        : activeTab === 'milestones' && isProjectAdmin
          ? { label: '+ Add milestone', onClick: () => setIsAddMilestoneOpen(true) }
          : undefined

  if (isProjectUnavailable(projectQuery.error) || isProjectUnavailable(boardQuery.error)) {
    return <ProjectUnavailable />
  }

  function retryBoard() {
    projectQuery.refetch()
    boardQuery.refetch()
  }

  return (
    <>
      <PageHeader
        title={project?.name ?? 'Project Board'}
        titleAdornment={isProjectAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="secondary"
                    size="icon-xs"
                    onClick={() => setIsDetailsOpen(true)}
                    aria-label="Configure project"
                    className="shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Configure project</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        subtitle={
          <span className="inline-flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5">
              {KindIcon && <KindIcon className="w-3.5 h-3.5 shrink-0" />}
              <span>{[project?.kind, ...subtitleParts].filter(Boolean).join(' · ')}</span>
            </span>
            {project && project.members.length > 0 && (
              <MemberAvatarStack members={project.members} />
            )}
          </span>
        }
        action={headerAction}
      />

      <div className="px-8 pt-2 border-b border-border shrink-0 flex items-end justify-between gap-4">
        <RouteTabs
          tabs={[
            { label: 'Board', path: `/projects/${id}/board` },
            { label: 'Components', path: `/projects/${id}/components` },
            { label: 'Milestones', path: `/projects/${id}/milestones` },
          ]}
        />
        {activeTab === 'board' && (
          <div className="-mt-1 mb-1 shrink-0">
            <BoardGroupByControl
              value={groupBy}
              onValueChange={handleGroupByChange}
              anyExpanded={openKeys.length > 0}
              onToggleAll={handleToggleAllLanes}
            />
          </div>
        )}
      </div>

      {activeTab === 'board' ? (
        <div
          className={cn(
            'flex-1 px-8',
            groupBy === 'none' ? 'overflow-y-auto py-4' : 'overflow-auto pb-4',
          )}
        >
          <TooltipProvider>
            {boardQuery.isError ? (
              <ErrorState
                title="Couldn't load the board"
                onRetry={retryBoard}
                isRetrying={boardQuery.isFetching}
              />
            ) : isLoading || groupBy === 'none' ? (
              <div className={cn('flex flex-col sm:flex-row gap-4 pb-6', groupBy !== 'none' && 'pt-4')}>
                {isLoading
                  ? Array.from({ length: 3 }).map((_, i) => <SkeletonColumn key={i} />)
                  : columns.map((col) => (
                      <BoardColumn key={col.flowStateId} column={col} onSelectItem={handleSelectItem} />
                    ))}
              </div>
            ) : (
              <BoardSwimlanes
                columns={columns}
                groups={groups}
                openKeys={openKeys}
                onOpenKeysChange={(keys) => setCollapsedKeys(groupKeys.filter((key) => !keys.includes(key)))}
                onSelectItem={handleSelectItem}
              />
            )}
          </TooltipProvider>
        </div>
      ) : activeTab === 'components' ? (
        <ProjectComponentsSection projectId={id} isProjectAdmin={isProjectAdmin} />
      ) : (
        <ProjectMilestonesSection projectId={id} isProjectAdmin={isProjectAdmin} />
      )}

      <WorkItemDetailModal
        code={selectedCode}
        columns={rawColumns}
        canEdit={canEditWorkItems}
        canComment={canComment}
        onClose={handleCloseModal}
      />

      <CreateWorkItemModal
        open={isCreateOpen}
        project={project}
        onClose={() => setIsCreateOpen(false)}
      />

      <ProjectDetailsModal
        projectId={id}
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <AddComponentModal
        projectId={id}
        open={isAddComponentOpen}
        onClose={() => setIsAddComponentOpen(false)}
      />

      <MilestoneFormModal
        projectId={id}
        defaultColor={project?.color}
        open={isAddMilestoneOpen}
        onClose={() => setIsAddMilestoneOpen(false)}
      />
    </>
  )
}
