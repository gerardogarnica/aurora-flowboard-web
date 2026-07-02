import type { Priority, WorkItemType } from '@/features/work-items/types/work-item.types'

export type FlowStateCategory = 'Active' | 'Completed' | 'Cancelled'

export interface WorkItemSummaryResponse {
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
  estimatedPoints: number | null
  estimatedCompletionDate: string | null
  createdOnUtc: string
  commentCount: number
  timeEntryCount: number
}

export interface FlowStateBoardResponse {
  flowStateId: string
  flowStateName: string
  category: FlowStateCategory
  sortOrder: number
  color: string
  workItems: WorkItemSummaryResponse[]
}
