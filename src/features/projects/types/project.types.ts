export type StateCategory = 'Active' | 'Completed' | 'Cancelled'

export type ProjectRole = 'Admin' | 'Analyst' | 'Developer' | 'QA' | 'Support'

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
