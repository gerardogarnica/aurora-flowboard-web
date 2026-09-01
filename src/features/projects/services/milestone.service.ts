import { apiFetch } from '@/shared/lib/api-client'
import type { MilestoneRequest, ProjectMilestone } from '../types/milestone.types'
import type { MilestoneAction } from '../constants/milestone-status'

const MILESTONE_STATUS_ENDPOINT: Record<MilestoneAction, string> = {
  Active:    'activate',
  OnHold:    'hold',
  Completed: 'complete',
  Archived:  'archive',
}

export async function getMilestonesByProject(projectId: string): Promise<ProjectMilestone[]> {
  return apiFetch<ProjectMilestone[]>(`/v1/flowboard/projects/${projectId}/milestones`)
}

export async function createMilestone(
  projectId: string,
  payload: MilestoneRequest,
): Promise<string> {
  return apiFetch<string>(`/v1/flowboard/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateMilestone(
  milestoneId: string,
  payload: MilestoneRequest,
): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/milestones/${milestoneId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneAction,
): Promise<void> {
  const action = MILESTONE_STATUS_ENDPOINT[status]
  return apiFetch<void>(`/v1/flowboard/milestones/${milestoneId}/${action}`, { method: 'PATCH' })
}
