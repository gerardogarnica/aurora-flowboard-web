export type WorkItemType = 'Story' | 'Bug' | 'TechnicalTask' | 'Investigation'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
/** Where an open item sits in its project's flow. Only Active states have a stage. */
export type WorkItemStage = 'Backlog' | 'InFlight'

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
  | 'TitleUpdated'
  | 'DescriptionUpdated'
  | 'TypeUpdated'
  | 'PriorityUpdated'
  | 'EstimatedPointsUpdated'
  | 'EstimatedCompletionDateUpdated'
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
  authorInitials: string
  content: string | null
  createdOnUtc: string
  updatedOnUtc: string | null
}

export interface AddWorkItemCommentRequest {
  content: string
}

export interface UpdateWorkItemCommentRequest {
  content: string
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
  assigneeInitials: string | null
  createdById: string
  createdByFullName: string
  createdByInitials: string
  componentId: string | null
  componentName: string | null
  milestoneId: string | null
  milestoneName: string | null
  milestoneColor: string | null
  estimatedPoints: number | null
  estimatedCompletionDate: string | null
  createdOnUtc: string
  /** Missing on a backend that predates the field. */
  enteredCurrentStateOnUtc?: string
  updatedOnUtc: string | null
  completedOnUtc: string | null
  tags: WorkItemTag[]
  availableTransitions: WorkItemTransition[]
}

/** One row of `GET /work-items`: an open item from any of my active projects. */
export interface WorkItemListItem {
  workItemId: string
  code: string
  title: string
  type: WorkItemType
  priority: Priority
  projectId: string
  projectName: string
  projectColor: string
  flowStateId: string
  flowStateName: string
  stage: WorkItemStage
  enteredCurrentStateOnUtc: string
  assigneeId: string | null
  assigneeInitials: string | null
  assigneeFullName: string | null
  milestoneName: string | null
  milestoneColor: string | null
}

export interface WorkItemSearchFilters {
  assignee?: 'me'
  createdBy?: 'me'
  stage?: WorkItemStage
  stalled?: true
  priority?: Priority[]
  sort: 'stageThenTimeInState'
  page: number
  pageSize: number
}
