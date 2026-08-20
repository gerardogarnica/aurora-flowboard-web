import type { ProjectRole } from '@/features/projects/types/project.types'

export type WorkItemType = 'Story' | 'Bug' | 'TechnicalTask' | 'Investigation'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export const WorkItemChangeType = {
  Created: 0,
  Updated: 1,
  Moved: 2,
  Assigned: 3,
  Unassigned: 4,
  CommentAdded: 5,
  CommentUpdated: 6,
  CommentRemoved: 7,
  TimeLogged: 8,
  TagAdded: 9,
  TagRemoved: 10,
} as const

export type WorkItemChangeType = (typeof WorkItemChangeType)[keyof typeof WorkItemChangeType]

export interface WorkItemTag {
  tagId: string
  name: string
}

export interface WorkItemComment {
  commentId: string
  authorId: string
  content: string | null
  createdOnUtc: string
  updatedOnUtc: string | null
}

export interface WorkItemTimeEntry {
  timeEntryId: string
  userId: string
  hours: number
  description: string | null
  loggedOnUtc: string
}

export interface WorkItemStateTransition {
  stateTransitionId: string
  fromStateId: string | null
  toStateId: string
  changedById: string
  reason: string | null
  changedOnUtc: string
}

export interface WorkItemChangeLog {
  changeLogId: string
  changedById: string
  changeType: WorkItemChangeType
  affectedEntityId: string | null
  changedOnUtc: string
}

export interface FlowTransition {
  transitionId: string
  fromStateId: string
  fromStateName: string
  toStateId: string
  toStateName: string
  allowedRoles: ProjectRole[]
}

export interface CreateWorkItemRequest {
  title: string
  description: string | null
  type: WorkItemType
  priority: Priority
  projectId: string
  estimatedPoints: number | null
  estimatedCompletionDate: string | null
  assigneeId: string | null
  milestoneId: string | null
  componentId: string | null
}

export interface WorkItemDetailResponse {
  workItemId: string
  title: string
  description: string | null
  type: WorkItemType
  priority: Priority
  projectId: string
  projectName: string
  flowStateId: string
  flowStateName: string
  assigneeId: string | null
  assigneeFullName: string | null
  createdById: string
  createdByFullName: string
  estimatedPoints: number | null
  estimatedCompletionDate: string | null
  createdOnUtc: string
  updatedOnUtc: string | null
  completedOnUtc: string | null
  tags: WorkItemTag[]
  comments: WorkItemComment[]
  timeEntries: WorkItemTimeEntry[]
  stateHistory: WorkItemStateTransition[]
  changeLogs: WorkItemChangeLog[]
  availableTransitions: FlowTransition[]
}
