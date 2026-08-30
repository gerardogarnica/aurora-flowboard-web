import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, Bug, Wrench, Search, Settings, Milestone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RouteTabs } from '@/shared/components/RouteTabs'
import { useAuthStore } from '@/app/store/auth.store'
import { useProjectDetail } from '@/features/projects/hooks/useProjectDetail'
import { useProjectBoard } from '@/features/projects/hooks/useProjectBoard'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { WorkItemDetailModal } from '@/features/work-items/components/WorkItemDetailModal'
import { CreateWorkItemModal } from '@/features/work-items/components/CreateWorkItemModal'
import { PriorityBars } from '@/features/work-items/components/PriorityBars'
import { PRIORITY_BARS } from '@/features/work-items/constants/work-item-display'
import { MemberAvatar, UnassignedAvatar } from '@/features/work-items/components/MemberAvatar'
import { MemberAvatarStack } from '@/shared/components/MemberAvatarStack'
import { ProjectDetailsModal } from './ProjectDetailsModal'
import { ProjectComponentsSection } from './ProjectComponentsSection'
import { AddComponentModal } from './AddComponentModal'
import { PROJECT_KIND_CONFIG } from '@/features/projects/constants/project-kinds'
import type {
  ProjectBoardColumn,
  ProjectBoardWorkItem,
} from '@/features/projects/types/project.types'
import type { WorkItemType } from '@/features/work-items/types/work-item.types'

const TYPE_CONFIG: Record<WorkItemType, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  Story:          { icon: BookOpen, className: 'text-violet-500', label: 'Story'          },
  Bug:            { icon: Bug,      className: 'text-red-500',    label: 'Bug'            },
  TechnicalTask:  { icon: Wrench,   className: 'text-blue-500',   label: 'Technical Task' },
  Investigation:  { icon: Search,   className: 'text-amber-500',  label: 'Investigation'  },
}

const FALLBACK_TYPE = { icon: BookOpen, className: 'text-muted-foreground' }

function WorkItemCard({ item, onSelect }: { item: ProjectBoardWorkItem; onSelect: (code: string) => void }) {
  const { icon: TypeIcon, className: typeClass, label: typeLabel } = TYPE_CONFIG[item.type] ?? { ...FALLBACK_TYPE, label: 'Unknown' }
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

      <div className={cn('flex items-center gap-2', item.component ? 'justify-between' : 'justify-end')}>
        {item.component && (
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
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="shrink-0 flex">
                {item.assigneeInitials ? (
                  <MemberAvatar userId={item.assigneeId!} initials={item.assigneeInitials} />
                ) : (
                  <UnassignedAvatar title="" />
                )}
              </span>
            }
          />
          <TooltipContent>{item.assigneeFullName ?? 'Unassigned'}</TooltipContent>
        </Tooltip>
      </div>
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
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex-1 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase truncate">
            {column.flowStateName}
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5 tabular-nums shrink-0">
            {column.workItems.length}
          </span>
        </div>

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

function MilestonesPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-center">
      <Milestone className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">Milestones</p>
      <p className="text-xs text-muted-foreground">Coming soon</p>
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
  const { data: project } = useProjectDetail(id)
  const { data: rawColumns = [], isLoading } = useProjectBoard(id)
  const currentUser = useAuthStore((s) => s.user)

  const isProjectAdmin = !!project?.members.some(
    (m) => m.userId === currentUser?.id && m.role === 'Admin',
  )

  const columns = rawColumns.filter((col) => col.category !== 'Cancelled')

  const totalItems = columns.reduce((sum, col) => sum + col.workItems.length, 0)

  const subtitleParts = [
    project?.prefix,
    project?.description ?? undefined,
    `${totalItems} item${totalItems !== 1 ? 's' : ''}`,
  ].filter(Boolean)

  const KindIcon = project ? PROJECT_KIND_CONFIG[project.kind].icon : null

  const selectedCode = searchParams.get('selected')

  function handleSelectItem(code: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('selected', code)
      return next
    })
  }

  function handleCloseModal() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('selected')
      return next
    })
  }

  const canAddWorkItems = !!project?.canAddOrUpdateWorkItems

  const headerAction =
    activeTab === 'board'
      ? {
          label: '+ New issue',
          onClick: () => setIsCreateOpen(true),
          disabled: !canAddWorkItems,
          title: !canAddWorkItems
            ? 'You do not have permission to add work items to this project'
            : undefined,
        }
      : activeTab === 'components' && isProjectAdmin
        ? { label: '+ Add component', onClick: () => setIsAddComponentOpen(true) }
        : undefined

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

      <div className="px-8 pt-2 border-b border-border shrink-0">
        <RouteTabs
          tabs={[
            { label: 'Board', path: `/projects/${id}/board` },
            { label: 'Components', path: `/projects/${id}/components` },
            { label: 'Milestones', path: `/projects/${id}/milestones` },
          ]}
        />
      </div>

      {activeTab === 'board' ? (
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <TooltipProvider>
            <div className="flex flex-col sm:flex-row gap-4 pb-6">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonColumn key={i} />)
                : columns.map((col) => (
                    <BoardColumn key={col.flowStateId} column={col} onSelectItem={handleSelectItem} />
                  ))}
            </div>
          </TooltipProvider>
        </div>
      ) : activeTab === 'components' ? (
        <ProjectComponentsSection projectId={id} isProjectAdmin={isProjectAdmin} />
      ) : (
        <MilestonesPlaceholder />
      )}

      <WorkItemDetailModal
        code={selectedCode}
        columns={rawColumns}
        canEdit={canAddWorkItems}
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
    </>
  )
}
