import { useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useProjects } from '@/features/projects/hooks/useProjects'
import {
  PRIORITY_CONFIG,
  WORK_ITEM_TYPE_CONFIG,
  formatDate,
  formatDateTime,
} from '../constants/work-item-display'
import { useAssignWorkItem } from '../hooks/useAssignWorkItem'
import { useMoveWorkItem } from '../hooks/useMoveWorkItem'
import { AssigneeSelect } from './AssigneeSelect'
import { PrioritySelect } from './PrioritySelect'
import { TypeSelect } from './TypeSelect'
import { StatusSelect } from './StatusSelect'
import type { Priority, WorkItemDetailResponse, WorkItemType } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

type EditingField = 'assignee' | 'priority' | 'type' | 'status' | null

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
  const [localPriority, setLocalPriority] = useState<Priority>(item.priority)
  const [localType, setLocalType] = useState<WorkItemType>(item.type)

  const { data: projects = [] } = useProjects()
  const project = projects.find((p) => p.projectId === item.projectId)
  const assignMutation = useAssignWorkItem(item.workItemId, item.projectId)
  const moveMutation = useMoveWorkItem(item.workItemId, item.projectId)

  const priorityConfig = PRIORITY_CONFIG[localPriority]
  const typeConfig = WORK_ITEM_TYPE_CONFIG[localType]
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
            value={localPriority}
            onValueChange={(value) => { setLocalPriority(value); setEditingField(null) }}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
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
            value={localType}
            onValueChange={(value) => { setLocalType(value); setEditingField(null) }}
            onOpenChange={(nextOpen) => { if (!nextOpen) setEditingField(null) }}
          />
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

      <SidebarRow label="Estimate">
        {item.estimatedPoints != null ? `${item.estimatedPoints} pts` : '—'}
      </SidebarRow>

      <SidebarRow label="Due">
        {item.estimatedCompletionDate ? formatDate(item.estimatedCompletionDate) : '—'}
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
