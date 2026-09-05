export type WorkItemType = 'Story' | 'Bug' | 'TechnicalTask' | 'Investigation'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export type WorkItemChangeType =
  | 'Created'
  | 'Updated'
  | 'Moved'
  | 'Assigned'
  | 'Unassigned'
  | 'CommentAdded'
  | 'CommentUpdated'
  | 'CommentRemoved'
  | 'TimeLogged'
  | 'TagAdded'
  | 'TagRemoved'
  | 'ComponentChanged'
  | 'MilestoneChanged'

export interface WorkItemTag {
  tagId: string
  name: string
}

export interface WorkItemComment {
  commentId: string
  authorId: string
  authorFullName: string
  content: string | null
  createdOnUtc: string
  updatedOnUtc: string | null
}

export interface WorkItemTimeEntry {
  timeEntryId: string
  userId: string
  loggedByFullName: string
  hours: number
  description: string | null
  loggedOnUtc: string
}

export interface WorkItemStateTransition {
  stateTransitionId: string
  fromStateId: string | null
  fromStateName: string | null
  toStateId: string
  toStateName: string
  changedById: string
  changedByFullName: string
  reason: string | null
  changedOnUtc: string
}

export interface WorkItemChangeLog {
  changeLogId: string
  changedById: string
  changedByFullName: string
  changeType: WorkItemChangeType
  affectedEntityId: string | null
  affectedEntityName: string | null
  changedOnUtc: string
}

export interface WorkItemTransition {
  toStateId: string
  toStateName: string
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
  code: string
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
  componentId: string | null
  componentName: string | null
  milestoneId: string | null
  milestoneName: string | null
  estimatedPoints: number | null
  estimatedCompletionDate: string | null
  createdOnUtc: string
  updatedOnUtc: string | null
  completedOnUtc: string | null
  tags: WorkItemTag[]
  availableTransitions: WorkItemTransition[]
}
