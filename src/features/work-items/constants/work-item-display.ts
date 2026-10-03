import { BookOpen, Bug, CircleHelp, Search, Wrench } from 'lucide-react'
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

// The maps below are keyed by enums the backend owns. Read them through the getters: a value
// added on the backend before the frontend knows it renders as its raw name in neutral styling,
// instead of crashing the card, the modal or the sidebar on `undefined.icon`.

type WorkItemTypeConfig = (typeof WORK_ITEM_TYPE_CONFIG)[WorkItemType]

export function getWorkItemTypeConfig(type: WorkItemType): WorkItemTypeConfig {
  const config: WorkItemTypeConfig | undefined = WORK_ITEM_TYPE_CONFIG[type]
  return config ?? { icon: CircleHelp, className: 'text-muted-foreground', label: type }
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

export function getPriorityConfig(priority: Priority): (typeof PRIORITY_CONFIG)[Priority] {
  return PRIORITY_CONFIG[priority] ?? { label: priority, className: 'bg-muted text-muted-foreground' }
}

/** Unknown priorities draw three empty bars — never a made-up level. */
export function getPriorityBars(priority: Priority): (typeof PRIORITY_BARS)[Priority] {
  return PRIORITY_BARS[priority] ?? { filled: 0, color: '#94a3b8', label: priority }
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
  TitleUpdated: 'Title updated',
  DescriptionUpdated: 'Description updated',
  TypeUpdated: 'Type updated',
  PriorityUpdated: 'Priority updated',
  EstimatedPointsUpdated: 'Estimated points updated',
  EstimatedCompletionDateUpdated: 'Estimated completion date updated',
  ComponentChanged: 'Component changed',
  MilestoneChanged: 'Milestone changed',
}

export function formatChangeType(changeType: WorkItemChangeType): string {
  // Fallback for a type the backend added before this map caught up: 'SomethingUpdated' → 'Something updated'.
  return (
    CHANGE_TYPE_LABELS[changeType] ??
    changeType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ (\w)/g, (_, c: string) => ` ${c.toLowerCase()}`)
  )
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
    case 'TitleUpdated':
      return `${actor} updated the title`
    case 'DescriptionUpdated':
      return `${actor} updated the description`
    case 'TypeUpdated':
      return `${actor} changed the type`
    case 'PriorityUpdated':
      return `${actor} changed the priority`
    case 'EstimatedPointsUpdated':
      return `${actor} changed the estimated points`
    case 'EstimatedCompletionDateUpdated':
      return `${actor} changed the estimated completion date`
    case 'ComponentChanged':
      return entity ? `${actor} changed the component to ${entity}` : `${actor} changed the component`
    case 'MilestoneChanged':
      return entity ? `${actor} changed the milestone to ${entity}` : `${actor} changed the milestone`
    default:
      return `${actor} ${formatChangeType(log.changeType).toLowerCase()}`
  }
}

export const WORK_ITEM_TITLE_MAX_LENGTH = 200
export const WORK_ITEM_DESCRIPTION_MAX_LENGTH = 4000

/** Estimated points are typed as text, at most this many digits (99999). */
export const ESTIMATED_POINTS_MAX_DIGITS = 5

/**
 * What an estimated-points field keeps of what was typed or pasted: digits only, no leading
 * zeros, at most `ESTIMATED_POINTS_MAX_DIGITS`. The backend requires points > 0 and answers 400
 * to a 0, so a 0 can't even be typed; `''` means "no estimate". Used by both the create modal
 * and the sidebar editor.
 */
export function sanitizeEstimatedPoints(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, ESTIMATED_POINTS_MAX_DIGITS)
}

/** Rows fetched per page from the paginated activity sub-endpoints (API caps pageSize at 100). */
export const ACTIVITY_PAGE_SIZE = 20
