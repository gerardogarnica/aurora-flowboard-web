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
