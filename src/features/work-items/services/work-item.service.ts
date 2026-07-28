import { apiFetch } from '@/shared/lib/api-client'
import type { CreateWorkItemPayload, WorkItemDetailResponse } from '../types/work-item.types'

export async function getWorkItem(workItemId: string): Promise<WorkItemDetailResponse> {
  return apiFetch<WorkItemDetailResponse>(`/v1/flowboard/work-items/${workItemId}`)
}

export async function createWorkItem(payload: CreateWorkItemPayload): Promise<string> {
  return apiFetch<string>('/v1/flowboard/work-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function assignWorkItem(workItemId: string, assigneeId: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigneeId }),
  })
}

export async function unassignWorkItem(workItemId: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/unassign`, {
    method: 'PATCH',
  })
}

export async function moveWorkItem(workItemId: string, toStateId: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ toStateId, reason: null }),
  })
}

export async function updateWorkItemTitle(workItemId: string, title: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}
