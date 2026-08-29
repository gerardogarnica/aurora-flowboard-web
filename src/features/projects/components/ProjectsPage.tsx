import React, { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { CreateProjectModal } from './CreateProjectModal'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useUpdateProjectStatus } from '@/features/projects/hooks/useUpdateProjectStatus'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { getAllowedTransitions } from '@/features/projects/constants/project-status'
import { PROJECT_KIND_CONFIG } from '@/features/projects/constants/project-kinds'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MemberAvatarStack } from '@/shared/components/MemberAvatarStack'
import { useAuthStore } from '@/app/store/auth.store'
import type { Project, ProjectApiStatus, ProjectKind } from '@/features/projects/types/project.types'

const STATUS_BADGE: Record<ProjectApiStatus, { label: string; className: string; dotClass: string }> = {
  Active:      { label: 'Active',      className: 'bg-emerald-50 text-emerald-600', dotClass: 'bg-emerald-500' },
  Maintenance: { label: 'Maintenance', className: 'bg-slate-100 text-slate-500',    dotClass: 'bg-slate-400' },
  Completed:   { label: 'Completed',   className: 'bg-blue-50 text-blue-600',       dotClass: 'bg-blue-500' },
  Archived:    { label: 'Archived',    className: 'bg-muted text-muted-foreground', dotClass: 'bg-muted-foreground' },
}

const PROJECT_STATUSES: ProjectApiStatus[] = ['Active', 'Maintenance', 'Completed', 'Archived']

const DEFAULT_STATUS_FILTER: Record<ProjectApiStatus, boolean> = {
  Active: true,
  Maintenance: true,
  Completed: true,
  Archived: false,
}


function StatusBadge({
  status,
  kind,
  projectName,
  onSelect,
  isUpdating,
}: {
  status: ProjectApiStatus
  kind: ProjectKind
  projectName: string
  onSelect: (next: ProjectApiStatus) => void
  isUpdating: boolean
}) {
  const [pendingStatus, setPendingStatus] = useState<ProjectApiStatus | null>(null)
  const badge = STATUS_BADGE[status]
  const transitions = getAllowedTransitions(kind, status)

  const handleConfirm = () => {
    if (pendingStatus) onSelect(pendingStatus)
    setPendingStatus(null)
  }

  if (isUpdating) {
    return (
      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1', badge.className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {badge.label}
      </span>
    )
  }

  if (transitions.length === 0) {
    return (
      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 cursor-default', badge.className)}>
        {badge.label}
      </span>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 cursor-pointer hover:ring-1 hover:ring-border select-none border-0', badge.className)}>
          {badge.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-35">
          {transitions.map((next) => (
            <DropdownMenuItem
              key={next}
              className="gap-2 cursor-pointer"
              onClick={() => setPendingStatus(next)}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_BADGE[next].dotClass)} />
              {STATUS_BADGE[next].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={(open) => { if (!open) setPendingStatus(null) }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change project status</DialogTitle>
            <DialogDescription>
              Move <span className="font-medium text-foreground">{projectName}</span> from{' '}
              <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', badge.className)}>
                {badge.label}
              </span>
              {' '}to{' '}
              {pendingStatus && (
                <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', STATUS_BADGE[pendingStatus].className)}>
                  {STATUS_BADGE[pendingStatus].label}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProjectCard({
  project,
  onStatusChange,
  isUpdating,
  onClick,
}: {
  project: Project
  onStatusChange: (status: ProjectApiStatus) => void
  isUpdating: boolean
  onClick: () => void
}) {
  const total = project.openWorkItems + project.closedWorkItems
  const progress = total > 0 ? (project.closedWorkItems / total) * 100 : 0
  const hex = resolveSwatchColor(project.color)
  const { icon: KindIcon, label: kindLabel } = PROJECT_KIND_CONFIG[project.kind]

  return (
    <div
      onClick={onClick}
      className="bg-sidebar border border-border rounded-lg overflow-hidden flex flex-col hover:border-(--project-color) hover:-translate-y-0.5 hover:scale-[1.015] transition-all duration-200 ease-out cursor-pointer"
      style={{ '--project-color': hex } as React.CSSProperties}
    >
      <div className="h-0.75 shrink-0" style={{ backgroundColor: hex }} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header: icon + name + badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: hex }}
                    >
                      <KindIcon className="w-4 h-4 text-white" />
                    </div>
                  }
                />
                <TooltipContent>{kindLabel}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm font-semibold text-foreground truncate">{project.name}</span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <StatusBadge
              status={project.status}
              kind={project.kind}
              projectName={project.name}
              onSelect={onStatusChange}
              isUpdating={isUpdating}
            />
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
              {project.openWorkItems}
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Open
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: hex }}>
              {project.closedWorkItems}
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Done
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: hex }}
          />
        </div>

        {/* Footer: avatars + percentage */}
        <div className="flex items-center justify-between">
          <MemberAvatarStack members={project.members} />
          <span className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}% done</span>
        </div>
      </div>
    </div>
  )
}

function StatusFilterRow({
  selected,
  onToggle,
}: {
  selected: Record<ProjectApiStatus, boolean>
  onToggle: (status: ProjectApiStatus) => void
}) {
  return (
    <div className="flex items-center gap-4">
      {PROJECT_STATUSES.map((status) => (
        <Label key={status} className="cursor-pointer gap-1.5">
          <Checkbox
            checked={selected[status]}
            onCheckedChange={() => onToggle(status)}
          />
          <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_BADGE[status].dotClass)} />
          {STATUS_BADGE[status].label}
        </Label>
      ))}
    </div>
  )
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2.5 w-full min-h-40 hover:border-primary/40 hover:bg-muted/20 hover:-translate-y-0.5 hover:scale-[1.015] transition-all duration-200 ease-out cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl border border-border bg-muted/50 flex items-center justify-center transition-colors group-hover:border-primary/30">
        <Plus className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold text-foreground">New project</span>
        <span className="text-xs text-muted-foreground text-center">Start with a template or blank</span>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="border border-border rounded-lg p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-muted" />
          <div className="h-3.5 w-28 rounded bg-muted" />
        </div>
        <div className="h-4 w-14 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-4/5 rounded bg-muted" />
      <div className="flex-1" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-12 rounded bg-muted" />
          <div className="flex -space-x-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-background" />
            ))}
          </div>
        </div>
        <div className="h-1 rounded-full bg-muted" />
      </div>
    </div>
  )
}

export function ProjectsPage() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Record<ProjectApiStatus, boolean>>(DEFAULT_STATUS_FILTER)
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()
  const updateStatus = useUpdateProjectStatus()
  const currentUser = useAuthStore((s) => s.user)
  const isAdministrator = currentUser?.role === 'Administrator'

  const visibleProjects = projects.filter((project) => statusFilter[project.status])

  const toggleStatusFilter = (status: ProjectApiStatus) => {
    setStatusFilter((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="All projects in this workspace. Click any project to open its board."
        action={isAdministrator ? { label: '+ New project', onClick: () => setCreateProjectOpen(true) } : undefined}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-start mb-4">
          <StatusFilterRow selected={statusFilter} onToggle={toggleStatusFilter} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : visibleProjects.map((project) => (
                <ProjectCard
                  key={project.projectId}
                  project={project}
                  onClick={() => navigate(`/projects/${project.projectId}/board`)}
                  onStatusChange={(status) =>
                    updateStatus.mutate({ projectId: project.projectId, status })
                  }
                  isUpdating={
                    updateStatus.isPending &&
                    updateStatus.variables?.projectId === project.projectId
                  }
                />
              ))}
          {!isLoading && isAdministrator && (
            <NewProjectCard onClick={() => setCreateProjectOpen(true)} />
          )}
        </div>
      </div>

      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />
    </>
  )
}
