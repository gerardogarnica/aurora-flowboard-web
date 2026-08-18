export type StateCategory = 'Active' | 'Completed' | 'Cancelled'

export type ProjectApiStatus = 'Active' | 'Maintenance' | 'Completed' | 'Archived'

export type ProjectKind = 'Product' | 'Client' | 'Research' | 'Internal'

export type ProjectRole = 'Admin' | 'Analyst' | 'Developer' | 'QA' | 'Viewer'

export interface ProjectMemberSummary {
  userId: string
  fullName: string
  initials: string
  role: ProjectRole
}

export interface ProjectFlowSummary {
  flowId: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
}

export interface Project {
  projectId: string
  name: string
  description: string | null
  code: string
  color: string
  estimatedCompletionDate: string | null
  status: ProjectApiStatus
  openWorkItems: number
  closedWorkItems: number
  canAddOrUpdateFlows: boolean
  canAddOrUpdateWorkItems: boolean
  members: ProjectMemberSummary[]
  flows: ProjectFlowSummary[]
}

export type ProjectChangeType = string

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
  code: string
  color: string
  estimatedCompletionDate: string | null
  status: ProjectApiStatus
  openWorkItems: number
  closedWorkItems: number
  canAddOrUpdateFlows: boolean
  canAddOrUpdateWorkItems: boolean
  createdById: string
  createdByFullName: string
  createdOnUtc: string
  updatedOnUtc: string | null
  members: ProjectMember[]
  changeLogs: ProjectChangeLog[]
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
  estimatedCompletionDate: string
}

export interface CreateProjectPayload {
  name: string
  description: string
  code: string
  color?: string
  estimatedCompletionDate?: string
  flow: {
    name: string
    description: string
    states: Array<{
      name: string
      category: string
      color: string
      roles: string[]
    }>
  }
}
