import { BookOpen, Bug, Search, Wrench } from 'lucide-react'
import type { Priority, WorkItemChangeType, WorkItemType } from '../types/work-item.types'

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
}

export function formatChangeType(changeType: WorkItemChangeType): string {
  return CHANGE_TYPE_LABELS[changeType] ?? changeType
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
