import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  PRIORITY_CONFIG,
  WORK_ITEM_TYPE_CONFIG,
  formatDate,
  formatDateTime,
} from '../constants/work-item-display'
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

export function WorkItemSidebar({ item }: { item: WorkItemDetailResponse }) {
  const typeConfig = WORK_ITEM_TYPE_CONFIG[item.type]
  const TypeIcon = typeConfig.icon
  const priorityConfig = PRIORITY_CONFIG[item.priority]

  return (
    <div className="flex flex-col gap-4">
      <SidebarRow label="Status">
        <Badge variant="secondary">{item.flowStateName}</Badge>
      </SidebarRow>

      <SidebarRow label="Assignee">
        {item.assigneeFullName ? (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(item.assigneeFullName)}</AvatarFallback>
            </Avatar>
            <span>{item.assigneeFullName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <User className="w-3 h-3" />
            </span>
            <span>Unassigned</span>
          </div>
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
