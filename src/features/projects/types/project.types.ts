export type StateCategory = 'Active' | 'Completed' | 'Cancelled'

export type ProjectApiStatus = 'Active' | 'Draft' | 'OnHold' | 'Completed' | 'Archived'

export type ProjectRole = 'Admin' | 'Analyst' | 'Developer' | 'QA' | 'Support'

export interface ProjectFlow {
  flowId: string
  name: string
  description: string
  isDefault: boolean
  isActive: boolean
}

export interface Project {
  projectId: string
  name: string
  description: string
  code: string
  color: string
  estimatedCompletionDate: string | null
  status: ProjectApiStatus
  memberCount: number
  flows: ProjectFlow[]
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
