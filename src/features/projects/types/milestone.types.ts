export type MilestoneStatus = 'Draft' | 'Active' | 'OnHold' | 'Completed' | 'Archived'

export interface ProjectMilestone {
  id: string
  name: string
  description: string | null
  status: MilestoneStatus
  targetStartDate: string | null
  targetEndDate: string | null
  createdBy: string
  createdOnUtc: string
  updatedOnUtc: string | null
}

export interface MilestoneRequest {
  name: string
  description: string | null
  targetStartDate: string | null
  targetEndDate: string | null
}
