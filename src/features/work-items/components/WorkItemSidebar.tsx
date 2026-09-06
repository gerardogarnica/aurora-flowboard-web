import { useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useProjectDetail } from '@/features/projects/hooks/useProjectDetail'
import { useProjectComponents } from '@/features/projects/hooks/useProjectComponents'
import { useProjectMilestones } from '@/features/projects/hooks/useProjectMilestones'
import { MILESTONE_STATUS_BADGE } from '@/features/projects/constants/milestone-status'
import { formatDate, formatDateTime } from '@/shared/lib/date-format'
import { PRIORITY_CONFIG, WORK_ITEM_TYPE_CONFIG } from '../constants/work-item-display'
import { useAssignWorkItem } from '../hooks/useAssignWorkItem'
import { useMoveWorkItem } from '../hooks/useMoveWorkItem'
import { useUpdateWorkItemType } from '../hooks/useUpdateWorkItemType'
import { useUpdateWorkItemPriority } from '../hooks/useUpdateWorkItemPriority'
import { useUpdateWorkItemComponent } from '../hooks/useUpdateWorkItemComponent'
import { useUpdateWorkItemMilestone } from '../hooks/useUpdateWorkItemMilestone'
import { useUpdateWorkItemEstimatedPoints } from '../hooks/useUpdateWorkItemEstimatedPoints'
import { useUpdateWorkItemEstimatedCompletionDate } from '../hooks/useUpdateWorkItemEstimatedCompletionDate'
import { AssigneeSelect } from './AssigneeSelect'
import { PrioritySelect } from './PrioritySelect'
import { TypeSelect } from './TypeSelect'
import { ComponentSelect } from './ComponentSelect'
import { MilestoneSelect } from './MilestoneSelect'
import { StatusSelect } from './StatusSelect'
import type { Priority, WorkItemDetailResponse, WorkItemType } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

type EditingField =
  | 'assignee'
  | 'priority'
  | 'type'
  | 'milestone'
  | 'component'
  | 'status'
  | 'estimatedPoints'
  | 'estimatedCompletionDate'
  | null

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function SidebarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function AssigneeDisplay({ fullName }: { fullName: string | null }) {
  if (!fullName) {
    return (
      <>
        <span className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
          <User className="w-3 h-3 text-muted-foreground" />
        </span>
        <span className="text-muted-foreground">Unassigned</span>
      </>
    )
  }

  return (
    <>
      <Avatar size="sm">
        <AvatarFallback>{initials(fullName)}</AvatarFallback>
      </Avatar>
      <span>{fullName}</span>
    </>
  )
}

export function WorkItemSidebar({
  item,
  isCancelled,
  canEdit,
  flowStateColor,
  columns,
}: {
  item: WorkItemDetailResponse
  isCancelled: boolean
  canEdit: boolean
  flowStateColor?: string
  columns: ProjectBoardColumn[]
}) {
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [estimatedPointsDraft, setEstimatedPointsDraft] = useState('')

  const { data: project } = useProjectDetail(item.projectId)
  const { data: components = [] } = useProjectComponents(item.projectId)
  const { data: milestones = [] } = useProjectMilestones(item.projectId)
  const assignMutation = useAssignWorkItem(item.workItemId, item.code, item.projectId)
  const moveMutation = useMoveWorkItem(item.workItemId, item.code, item.projectId)
  const typeMutation = useUpdateWorkItemType(item.workItemId, item.code, item.projectId)
  const priorityMutation = useUpdateWorkItemPriority(item.workItemId, item.code, item.projectId)
  const componentMutation = useUpdateWorkItemComponent(item.workItemId, item.code, item.projectId)
  const milestoneMutation = useUpdateWorkItemMilestone(item.workItemId, item.code, item.projectId)
  const estimatedPointsMutation = useUpdateWorkItemEstimatedPoints(item.workItemId, item.code, item.projectId)
  const completionDateMutation = useUpdateWorkItemEstimatedCompletionDate(item.workItemId, item.code, item.projectId)

  const assignedComponent = components.find((c) => c.id === item.componentId)
  const componentDisplayName = !item.componentName
    ? 'No component'
    : assignedComponent?.status === 'Retired'
      ? `${item.componentName} (Retired)`
      : item.componentName

  const assignedMilestone = milestones.find((m) => m.id === item.milestoneId)
  const milestoneDisplayName = !item.milestoneName
    ? 'No milestone'
    : assignedMilestone && assignedMilestone.status !== 'Active'
      ? `${item.milestoneName} (${MILESTONE_STATUS_BADGE[assignedMilestone.status].label})`
      : item.milestoneName

  const priorityConfig = PRIORITY_CONFIG[item.priority]
  const typeConfig = WORK_ITEM_TYPE_CONFIG[item.type]
  const TypeIcon = typeConfig.icon
  const canEditField = canEdit && !isCancelled
  const canEditStatus = canEditField && item.availableTransitions.length > 0

  function handleAssigneeChange(value: string | null) {
    const assigneeId = value || null
    if (assigneeId === item.assigneeId) return
    const member = project?.members.find((m) => m.userId === assigneeId)
    assignMutation.mutate({
      assigneeId,
      assigneeFullName: member?.fullName ?? null,
      assigneeInitials: member?.initials ?? null,
    })
  }

  function handleTypeChange(value: WorkItemType) {
    setEditingField(null)
    if (value === item.type) return
    typeMutation.mutate(value)
  }

  function handlePriorityChange(value: Priority) {
    setEditingField(null)
    if (value === item.priority) return
    priorityMutation.mutate(value)
  }

  function handleComponentChange(value: string) {
    setEditingField(null)
    const componentId = value || null
    if (componentId === item.componentId) return
    const component = components.find((c) => c.id === componentId)
    componentMutation.mutate({ componentId, componentName: component?.name ?? null })
  }

  function handleMilestoneChange(value: string) {
    setEditingField(null)
    const milestoneId = value || null
    if (milestoneId === item.milestoneId) return
    const milestone = milestones.find((m) => m.id === milestoneId)
    milestoneMutation.mutate({ milestoneId, milestoneName: milestone?.name ?? null })
  }

  function startEditingEstimatedPoints() {
    if (!canEditField) return
    setEstimatedPointsDraft(item.estimatedPoints != null ? String(item.estimatedPoints) : '')
    setEditingField('estimatedPoints')
  }

  function commitEstimatedPoints() {
    setEditingField(null)
    const trimmed = estimatedPointsDraft.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next === item.estimatedPoints) return
    estimatedPointsMutation.mutate(next)
  }

  function cancelEstimatedPoints() {
    setEditingField(null)
  }

  function handleCompletionDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value || null
    setEditingField(null)
    if (value === item.estimatedCompletionDate) return
    completionDateMutation.mutate(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <SidebarRow label="Status">
        {editingField === 'status' ? (
          <StatusSelect
            defaultOpen
            triggerClassName="h-8"
            transitions={item.availableTransitions}
            columns={columns}
            value={item.flowStateId}
            currentStateName={item.flowStateName}
            currentStateColor={flowStateColor}
            onValueChange={(transition) => {
              moveMutation.mutate({ toStateId: transition.toStateId, toStateName: transition.toStateName })
              setEditingField(null)
            }}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
        ) : !canEditStatus ? (
          <Badge
            variant="secondary"
            className="text-white"
            style={flowStateColor ? { backgroundColor: flowStateColor } : undefined}
          >
            {item.flowStateName}
          </Badge>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('status')}
            className="-mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer"
          >
            <Badge
              variant="secondary"
              className="text-white"
              style={flowStateColor ? { backgroundColor: flowStateColor } : undefined}
            >
              {item.flowStateName}
            </Badge>
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Assignee">
        {editingField === 'assignee' ? (
          <AssigneeSelect
            defaultOpen
            triggerClassName="h-8"
            members={project?.members ?? []}
            value={item.assigneeId ?? ''}
            onValueChange={handleAssigneeChange}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
        ) : assignMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground">{item.assigneeFullName ?? 'Unassigned'}</span>
          </div>
        ) : !canEditField ? (
          <div className="flex items-center gap-2">
            <AssigneeDisplay fullName={item.assigneeFullName} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('assignee')}
            className="flex items-center gap-2 -mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer"
          >
            <AssigneeDisplay fullName={item.assigneeFullName} />
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Reporter">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initials(item.createdByFullName)}</AvatarFallback>
          </Avatar>
          <span>{item.createdByFullName}</span>
        </div>
      </SidebarRow>

      <Separator />

      <SidebarRow label="Priority">
        {editingField === 'priority' ? (
          <PrioritySelect
            defaultOpen
            triggerClassName="h-8"
            value={item.priority}
            onValueChange={handlePriorityChange}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
        ) : priorityMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <Badge className={cn(priorityConfig.className)} variant="outline">
              {priorityConfig.label}
            </Badge>
          </div>
        ) : !canEditField ? (
          <Badge className={cn(priorityConfig.className)} variant="outline">
            {priorityConfig.label}
          </Badge>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('priority')}
            className="-mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer"
          >
            <Badge className={cn(priorityConfig.className)} variant="outline">
              {priorityConfig.label}
            </Badge>
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Type">
        {editingField === 'type' ? (
          <TypeSelect
            defaultOpen
            triggerClassName="h-8"
            value={item.type}
            onValueChange={handleTypeChange}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
        ) : typeMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground flex items-center gap-1.5">
              <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.className)} />
              {typeConfig.label}
            </span>
          </div>
        ) : !canEditField ? (
          <div className="flex items-center gap-1.5">
            <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.className)} />
            <span>{typeConfig.label}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('type')}
            className="flex items-center gap-1.5 -mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer"
          >
            <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.className)} />
            <span>{typeConfig.label}</span>
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Milestone">
        {editingField === 'milestone' ? (
          <MilestoneSelect
            defaultOpen
            triggerClassName="h-8"
            milestones={milestones}
            value={item.milestoneId ?? ''}
            onValueChange={handleMilestoneChange}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
        ) : milestoneMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground">{milestoneDisplayName}</span>
          </div>
        ) : !canEditField ? (
          <span className={cn(!item.milestoneName && 'text-muted-foreground')}>
            {milestoneDisplayName}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('milestone')}
            className={cn(
              '-mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer',
              !item.milestoneName && 'text-muted-foreground',
            )}
          >
            {milestoneDisplayName}
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Component">
        {editingField === 'component' ? (
          <ComponentSelect
            defaultOpen
            triggerClassName="h-8"
            components={components}
            value={item.componentId ?? ''}
            onValueChange={handleComponentChange}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
        ) : componentMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground">{componentDisplayName}</span>
          </div>
        ) : !canEditField ? (
          <span className={cn(!item.componentName && 'text-muted-foreground')}>
            {componentDisplayName}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('component')}
            className={cn(
              '-mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer',
              !item.componentName && 'text-muted-foreground',
            )}
          >
            {componentDisplayName}
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Estimate points">
        {editingField === 'estimatedPoints' ? (
          <Input
            autoFocus
            inputMode="numeric"
            maxLength={5}
            value={estimatedPointsDraft}
            disabled={estimatedPointsMutation.isPending}
            onChange={(e) => setEstimatedPointsDraft(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onBlur={commitEstimatedPoints}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitEstimatedPoints()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancelEstimatedPoints()
              }
            }}
            className="h-8"
          />
        ) : estimatedPointsMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground">
              {item.estimatedPoints != null ? `${item.estimatedPoints} pts` : '—'}
            </span>
          </div>
        ) : !canEditField ? (
          <span>{item.estimatedPoints != null ? `${item.estimatedPoints} pts` : '—'}</span>
        ) : (
          <button
            type="button"
            onClick={startEditingEstimatedPoints}
            className="-mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer"
          >
            {item.estimatedPoints != null ? `${item.estimatedPoints} pts` : '—'}
          </button>
        )}
      </SidebarRow>

      <SidebarRow label="Completion date">
        {editingField === 'estimatedCompletionDate' ? (
          <Input
            type="date"
            autoFocus
            defaultValue={item.estimatedCompletionDate ?? ''}
            disabled={completionDateMutation.isPending}
            onChange={handleCompletionDateChange}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setEditingField(null)
              }
            }}
            className="h-8"
          />
        ) : completionDateMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground">
              {item.estimatedCompletionDate ? formatDate(item.estimatedCompletionDate) : '—'}
            </span>
          </div>
        ) : !canEditField ? (
          <span>{item.estimatedCompletionDate ? formatDate(item.estimatedCompletionDate) : '—'}</span>
        ) : (
          <button
            type="button"
            onClick={() => setEditingField('estimatedCompletionDate')}
            className="-mx-1 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left cursor-pointer"
          >
            {item.estimatedCompletionDate ? formatDate(item.estimatedCompletionDate) : '—'}
          </button>
        )}
      </SidebarRow>

      <Separator />

      <SidebarRow label="Created">{formatDateTime(item.createdOnUtc)}</SidebarRow>
      {item.updatedOnUtc && <SidebarRow label="Updated">{formatDateTime(item.updatedOnUtc)}</SidebarRow>}
      {item.completedOnUtc && <SidebarRow label="Completed">{formatDateTime(item.completedOnUtc)}</SidebarRow>}

      <Separator />

      <SidebarRow label="Tags">
        {item.tags.length === 0 ? (
          <span className="text-muted-foreground">No tags</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag.tagId} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </SidebarRow>
    </div>
  )
}
