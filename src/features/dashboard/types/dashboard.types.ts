import type { ProjectApiStatus, ProjectKind } from '@/features/projects/types/project.types'

export interface AgingBucket {
  from: number
  /** Null on the open-ended last bucket. */
  to: number | null
  count: number
}

export interface OldestInFlight {
  code: string
  title: string
  projectId: string
  projectName: string
  enteredCurrentStateOnUtc: string
}

export interface DashboardMilestone {
  id: string
  projectId: string
  projectName: string
  name: string
  color: string
  targetEndDate: string | null
  linkedTotal: number
  linkedClosed: number
  linkedStalled: number
}

export interface PortfolioProject {
  projectId: string
  name: string
  color: string
  kind: ProjectKind
  status: ProjectApiStatus
  open: number
  stalled: number
  distribution: { flowStateId: string; name: string; color: string; count: number }[]
  activeMilestone: {
    id: string
    name: string
    color: string
    targetEndDate: string | null
    linkedTotal: number
    linkedClosed: number
  } | null
  members: { userId: string; fullName: string; initials: string }[]
}

export interface DashboardResponse {
  me: { open: number; stalled: number; inFlight: number; criticalHigh: number }
  team: { stalled: number; unassigned: number; closedLast7Days: number }
  aging: { buckets: AgingBucket[]; oldestInFlight: OldestInFlight | null }
  milestones: DashboardMilestone[]
  portfolio: PortfolioProject[]
}
