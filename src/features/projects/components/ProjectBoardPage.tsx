import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, Bug, Wrench, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useProjectBoard } from '@/features/projects/hooks/useProjectBoard'
import { useProjectDetail } from '@/features/projects/hooks/useProjectDetail'
import { resolveProjectColor } from '@/features/projects/constants/project-colors'
import { WorkItemDetailModal } from '@/features/work-items/components/WorkItemDetailModal'
import { CreateWorkItemModal } from '@/features/work-items/components/CreateWorkItemModal'
import { PriorityBars } from '@/features/work-items/components/PriorityBars'
import { MemberAvatar, UnassignedAvatar } from '@/features/work-items/components/MemberAvatar'
import type {
  FlowStateBoardResponse,
  WorkItemSummaryResponse,
} from '@/features/projects/types/board.types'
import type { WorkItemType } from '@/features/work-items/types/work-item.types'

const TYPE_CONFIG: Record<WorkItemType, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  Story:          { icon: BookOpen, className: 'text-violet-500', label: 'Story'          },
  Bug:            { icon: Bug,      className: 'text-red-500',    label: 'Bug'            },
  TechnicalTask:  { icon: Wrench,   className: 'text-blue-500',   label: 'Technical Task' },
  Investigation:  { icon: Search,   className: 'text-amber-500',  label: 'Investigation'  },
}

const FALLBACK_TYPE = { icon: BookOpen, className: 'text-muted-foreground' }

function WorkItemCard({ item, onSelect }: { item: WorkItemSummaryResponse; onSelect: (code: string) => void }) {
  const { icon: TypeIcon, className: typeClass, label: typeLabel } = TYPE_CONFIG[item.type] ?? { ...FALLBACK_TYPE, label: 'Unknown' }

  return (
    <div
      onClick={() => onSelect(item.code)}
      className="bg-background border border-border rounded-lg p-3 flex flex-col gap-2.5 hover:border-foreground/20 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span title={typeLabel} className="shrink-0 flex">
            <TypeIcon className={cn('w-3.5 h-3.5', typeClass)} />
          </span>
          <span className="text-xs font-mono text-muted-foreground truncate">{item.code}</span>
        </div>
        <PriorityBars priority={item.priority} />
      </div>

      <p title={item.title} className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
        {item.title}
      </p>

      <div className="flex justify-end items-center">
        {item.assigneeInitials ? (
          <MemberAvatar
            userId={item.assigneeId!}
            initials={item.assigneeInitials}
            title={item.assigneeFullName ?? undefined}
          />
        ) : (
          <UnassignedAvatar />
        )}
      </div>
    </div>
  )
}

function BoardColumn({
  column,
  onSelectItem,
}: {
  column: FlowStateBoardResponse
  onSelectItem: (code: string) => void
}) {
  const hex = resolveProjectColor(column.color)

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

function hasUsableFlow(project: { flows: { isDefault: boolean; isActive: boolean }[] } | undefined): boolean {
  if (!project) return false
  return project.flows.some((f) => f.isDefault) || project.flows.some((f) => f.isActive)
}

export function ProjectBoardPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data: projects = [] } = useProjects()
  const { data: rawColumns = [], isLoading } = useProjectBoard(id)
  const { data: projectDetail } = useProjectDetail(id)

  const project = projects.find((p) => p.projectId === id)

  const columns = rawColumns.filter((col) => col.category !== 'Cancelled')

  const totalItems = columns.reduce((sum, col) => sum + col.workItems.length, 0)

  const subtitleParts = [
    project?.code,
    project?.description ?? undefined,
    `${totalItems} item${totalItems !== 1 ? 's' : ''}`,
  ].filter(Boolean)

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

  const hasFlow = hasUsableFlow(project)
  const canAddWorkItems = !!projectDetail?.canAddOrUpdateWorkItems
  const canCreate = hasFlow && canAddWorkItems

  return (
    <>
      <PageHeader
        title={project?.name ?? 'Project Board'}
        subtitle={subtitleParts.join(' · ')}
        action={{
          label: '+ New issue',
          onClick: () => setIsCreateOpen(true),
          disabled: !canCreate,
          title: !hasFlow
            ? 'No workflow configured for this project'
            : !canAddWorkItems
              ? 'You do not have permission to add work items to this project'
              : undefined,
        }}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col sm:flex-row gap-4 pb-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonColumn key={i} />)
            : columns.map((col) => (
                <BoardColumn key={col.flowStateId} column={col} onSelectItem={handleSelectItem} />
              ))}
        </div>
      </div>

      <WorkItemDetailModal
        code={selectedCode}
        workItems={rawColumns.flatMap((col) => col.workItems)}
        columns={rawColumns}
        isBoardLoading={isLoading}
        onClose={handleCloseModal}
      />

      <CreateWorkItemModal
        open={isCreateOpen}
        project={project}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
