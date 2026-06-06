import { useParams } from 'react-router-dom'
import { BookOpen, Bug, Wrench, Search, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useProjectBoard } from '@/features/projects/hooks/useProjectBoard'
import { resolveProjectColor } from '@/features/projects/constants/project-colors'
import type {
  FlowStateBoardResponse,
  WorkItemSummaryResponse,
  WorkItemType,
  Priority,
} from '@/features/projects/types/board.types'

const TYPE_CONFIG: Record<WorkItemType, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  Story:          { icon: BookOpen, className: 'text-violet-500' },
  Bug:            { icon: Bug,      className: 'text-red-500'    },
  TechnicalTask:  { icon: Wrench,   className: 'text-blue-500'   },
  Investigation:  { icon: Search,   className: 'text-amber-500'  },
}

const PRIORITY_CLASS: Record<Priority, string> = {
  Low:      'text-slate-400',
  Medium:   'text-amber-400',
  High:     'text-orange-500',
  Critical: 'text-red-600',
}

const FALLBACK_TYPE = { icon: BookOpen, className: 'text-muted-foreground' }

const MEMBER_BG = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]

function avatarIndex(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % MEMBER_BG.length
}

function WorkItemCard({ item }: { item: WorkItemSummaryResponse }) {
  const { icon: TypeIcon, className: typeClass } = TYPE_CONFIG[item.type] ?? FALLBACK_TYPE

  return (
    <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-2.5 hover:border-foreground/20 transition-colors cursor-pointer">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon className={cn('w-3.5 h-3.5 shrink-0', typeClass)} />
          <span className="text-xs font-mono text-muted-foreground truncate">{item.code}</span>
        </div>
        <ChevronUp className={cn('w-3.5 h-3.5 shrink-0', PRIORITY_CLASS[item.priority])} />
      </div>

      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
        {item.title}
      </p>

      <div className="flex justify-end items-center">
        {item.assigneeInitials ? (
          <span
            title={item.assigneeFullName ?? undefined}
            className={cn(
              'w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center select-none',
              MEMBER_BG[avatarIndex(item.assigneeId!)],
            )}
          >
            {item.assigneeInitials}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">Unassigned</span>
        )}
      </div>
    </div>
  )
}

function BoardColumn({ column }: { column: FlowStateBoardResponse }) {
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
              <WorkItemCard key={item.workItemId} item={item} />
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
  const { id = '' } = useParams<{ id: string }>()
  const { data: projects = [] } = useProjects()
  const { data: rawColumns = [], isLoading } = useProjectBoard(id)

  const project = projects.find((p) => p.projectId === id)

  const columns = rawColumns.filter((col) => col.category !== 'Cancelled')

  const totalItems = columns.reduce((sum, col) => sum + col.workItems.length, 0)

  const subtitleParts = [
    project?.code,
    project?.description ?? undefined,
    `${totalItems} item${totalItems !== 1 ? 's' : ''}`,
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title={project?.name ?? 'Project Board'}
        subtitle={subtitleParts.join(' · ')}
        action={{ label: '+ New issue', onClick: () => {} }}
      />

      <div className="flex flex-col sm:flex-row gap-4 pb-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonColumn key={i} />)
          : columns.map((col) => (
              <BoardColumn key={col.flowStateId} column={col} />
            ))}
      </div>
    </>
  )
}
