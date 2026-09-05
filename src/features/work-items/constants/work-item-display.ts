import { BookOpen, Bug, Search, Wrench } from 'lucide-react'
import type { Priority, WorkItemChangeLog, WorkItemChangeType, WorkItemType } from '../types/work-item.types'

export const WORK_ITEM_TYPE_CONFIG: Record<
  WorkItemType,
  { icon: React.ComponentType<{ className?: string }>; className: string; label: string }
> = {
  Story:         { icon: BookOpen, className: 'text-violet-500', label: 'Story'          },
  Bug:           { icon: Bug,      className: 'text-red-500',    label: 'Bug'            },
  TechnicalTask: { icon: Wrench,   className: 'text-blue-500',   label: 'Technical Task' },
  Investigation: { icon: Search,   className: 'text-amber-500',  label: 'Investigation'  },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  Low:      { label: 'Low',      className: 'bg-slate-100 text-slate-600' },
  Medium:   { label: 'Medium',   className: 'bg-amber-100 text-amber-700' },
  High:     { label: 'High',     className: 'bg-orange-100 text-orange-700' },
  Critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
}

export const PRIORITY_BARS: Record<Priority, { filled: number; color: string; label: string }> = {
  Low:      { filled: 1, color: '#94a3b8', label: 'Low'      },
  Medium:   { filled: 2, color: '#fbbf24', label: 'Medium'   },
  High:     { filled: 3, color: '#f97316', label: 'High'     },
  Critical: { filled: 3, color: '#dc2626', label: 'Critical' },
}

export const CHANGE_TYPE_LABELS: Record<WorkItemChangeType, string> = {
  Created: 'Created',
  Updated: 'Updated',
  Moved: 'Moved',
  Assigned: 'Assigned',
  Unassigned: 'Unassigned',
  CommentAdded: 'Comment added',
  CommentUpdated: 'Comment updated',
  CommentRemoved: 'Comment removed',
  TimeLogged: 'Time logged',
  TagAdded: 'Tag added',
  TagRemoved: 'Tag removed',
  ComponentChanged: 'Component changed',
  MilestoneChanged: 'Milestone changed',
}

export function formatChangeType(changeType: WorkItemChangeType): string {
  return CHANGE_TYPE_LABELS[changeType] ?? changeType
}

export function formatChangeLogEntry(log: WorkItemChangeLog): string {
  const actor = log.changedByFullName
  const entity = log.affectedEntityName

  switch (log.changeType) {
    case 'Created':
      return `${actor} created this work item`
    case 'Updated':
      return `${actor} updated this work item`
    case 'Moved':
      return entity ? `${actor} moved this work item to ${entity}` : `${actor} moved this work item`
    case 'Assigned':
      return entity ? `${actor} assigned this work item to ${entity}` : `${actor} assigned this work item`
    case 'Unassigned':
      return `${actor} unassigned this work item`
    case 'CommentAdded':
      return `${actor} added a comment`
    case 'CommentUpdated':
      return `${actor} updated a comment`
    case 'CommentRemoved':
      return `${actor} removed a comment`
    case 'TimeLogged':
      return `${actor} logged time`
    case 'TagAdded':
      return `${actor} added a tag`
    case 'TagRemoved':
      return `${actor} removed a tag`
    case 'ComponentChanged':
      return entity ? `${actor} changed the component to ${entity}` : `${actor} changed the component`
    case 'MilestoneChanged':
      return entity ? `${actor} changed the milestone to ${entity}` : `${actor} changed the milestone`
    default:
      return `${actor} ${formatChangeType(log.changeType).toLowerCase()}`
  }
}

/** Rows fetched per page from the paginated activity sub-endpoints (API caps pageSize at 100). */
export const ACTIVITY_PAGE_SIZE = 20
