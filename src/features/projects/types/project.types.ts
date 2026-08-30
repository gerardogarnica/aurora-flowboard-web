import type { Priority, WorkItemType } from '@/features/work-items/types/work-item.types'

export type StateCategory = 'Active' | 'Completed' | 'Cancelled'

export type ProjectApiStatus = 'Active' | 'Maintenance' | 'Completed' | 'Archived'

export type ProjectKind = 'Product' | 'Client' | 'Research' | 'Internal'

export type ProjectRole = 'Admin' | 'Analyst' | 'Developer' | 'QA' | 'Viewer'

export type ProjectChangeType = string

export interface Project {
  projectId: string
  name: string
  description: string | null
  prefix: string
  color: string
  kind: ProjectKind
  status: ProjectApiStatus
  openWorkItems: number
  closedWorkItems: number
  canModifyFlowStates: boolean
  canAddOrUpdateWorkItems: boolean
  members: ProjectMemberSummary[]
}

export interface ProjectMemberSummary {
  userId: string
  fullName: string
  initials: string
  role: ProjectRole
}

export interface ProjectChangeLog {
  id: string
  changedById: string
  changedByFullName: string
  changedByInitials: string
  changeType: ProjectChangeType
  affectedEntityId: string | null
  newStatus: ProjectApiStatus | null
  changedOnUtc: string
}

export interface ProjectMember {
  userId: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
  role: ProjectRole
  joinedOnUtc: string
}

export interface ProjectDetailResponse {
  projectId: string
  name: string
  description: string | null
  prefix: string
  color: string
  kind: ProjectKind
  status: ProjectApiStatus
  openWorkItems: number
  closedWorkItems: number
  canModifyFlowStates: boolean
  canAddOrUpdateWorkItems: boolean
  createdById: string
  createdByFullName: string
  createdOnUtc: string
  updatedOnUtc: string | null
  members: ProjectMember[]
  changeLogs: ProjectChangeLog[]
}

export interface ProjectBoardColumn {
  flowStateId: string
  flowStateName: string
  category: StateCategory
  sortOrder: number
  color: string
  workItems: ProjectBoardWorkItem[]
}

export interface ProjectBoardWorkItem {
  workItemId: string
  title: string
  code: string
  type: WorkItemType
  priority: Priority
  flowStateId: string
  flowStateName: string
  assigneeId: string | null
  assigneeInitials: string | null
  assigneeFullName: string | null
  component: string | null
  milestone: string | null
  estimatedPoints: number | null
  estimatedCompletionDate: string | null
  createdOnUtc: string
  commentCount: number
  timeEntryCount: number
}

export interface FlowState {
  id: string
  name: string
  category: StateCategory
  color: string
  roles: ProjectRole[]
}

export interface CreateProjectStep1Data {
  name: string
  description: string
  code: string
  color: string
  kind: ProjectKind | ''
}

export interface CreateProjectRequest {
  name: string
  description: string
  prefix: string
  kind: ProjectKind
  color?: string
  flowStates: Array<{
    name: string
    category: string
    color: string
    allowedRoles: string[]
  }>
}

export type ProjectComponentStatus = 'Active' | 'Retired'

export interface ProjectComponent {
  id: string
  name: string
  status: ProjectComponentStatus
  createdBy: string
  createdOnUtc: string
  updatedOnUtc: string | null
}

export interface CreateComponentRequest {
  name: string
}

export interface RenameComponentRequest {
  name: string
}
