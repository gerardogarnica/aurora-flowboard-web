import { BookOpen, Bug, Search, Wrench } from 'lucide-react'
import { WorkItemChangeType, type Priority, type WorkItemType } from '../types/work-item.types'

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

export const CHANGE_TYPE_LABELS: Record<WorkItemChangeType, string> = {
  [WorkItemChangeType.Created]: 'Created',
  [WorkItemChangeType.Updated]: 'Updated',
  [WorkItemChangeType.Moved]: 'Moved',
  [WorkItemChangeType.Assigned]: 'Assigned',
  [WorkItemChangeType.Unassigned]: 'Unassigned',
  [WorkItemChangeType.CommentAdded]: 'Comment added',
  [WorkItemChangeType.CommentUpdated]: 'Comment updated',
  [WorkItemChangeType.CommentRemoved]: 'Comment removed',
  [WorkItemChangeType.TimeLogged]: 'Time logged',
  [WorkItemChangeType.TagAdded]: 'Tag added',
  [WorkItemChangeType.TagRemoved]: 'Tag removed',
}

export function formatUserRef(id: string): string {
  return id.slice(0, 8)
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
