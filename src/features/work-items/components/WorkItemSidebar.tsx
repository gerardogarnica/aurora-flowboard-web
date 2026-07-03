import { useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useProjects } from '@/features/projects/hooks/useProjects'
import {
  PRIORITY_CONFIG,
  WORK_ITEM_TYPE_CONFIG,
  formatDate,
  formatDateTime,
} from '../constants/work-item-display'
import { useAssignWorkItem } from '../hooks/useAssignWorkItem'
import { MemberAvatar, UnassignedAvatar } from './MemberAvatar'
import type { WorkItemDetailResponse } from '../types/work-item.types'

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

export function WorkItemSidebar({ item, isCancelled }: { item: WorkItemDetailResponse; isCancelled: boolean }) {
  const typeConfig = WORK_ITEM_TYPE_CONFIG[item.type]
  const TypeIcon = typeConfig.icon
  const priorityConfig = PRIORITY_CONFIG[item.priority]

  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const { data: projects = [] } = useProjects()
  const project = projects.find((p) => p.projectId === item.projectId)
  const assignMutation = useAssignWorkItem(item.workItemId, item.projectId)

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
        <Badge variant="secondary">{item.flowStateName}</Badge>
      </SidebarRow>

      <SidebarRow label="Assignee">
        {isEditingAssignee ? (
          <Select
            defaultOpen
            value={item.assigneeId ?? ''}
            onValueChange={handleAssigneeChange}
            onOpenChange={(nextOpen) => { if (!nextOpen) setIsEditingAssignee(false) }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue>
                {(value: string) => {
                  const member = project?.members.find((m) => m.userId === value)
                  return member ? (
                    <>
                      <MemberAvatar userId={member.userId} initials={member.initials} />
                      {member.fullName}
                    </>
                  ) : (
                    <>
                      <UnassignedAvatar />
                      Unassigned
                    </>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <UnassignedAvatar />
                Unassigned
              </SelectItem>
              {(project?.members ?? []).map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <MemberAvatar userId={member.userId} initials={member.initials} />
                  {member.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : assignMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-foreground">{item.assigneeFullName ?? 'Unassigned'}</span>
          </div>
        ) : isCancelled ? (
          <div className="flex items-center gap-2">
            <AssigneeDisplay fullName={item.assigneeFullName} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingAssignee(true)}
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
        <Badge className={cn(priorityConfig.className)} variant="outline">
          {priorityConfig.label}
        </Badge>
      </SidebarRow>

      <SidebarRow label="Type">
        <div className="flex items-center gap-1.5">
          <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.className)} />
          <span>{typeConfig.label}</span>
        </div>
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
