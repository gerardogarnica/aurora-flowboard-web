import { apiFetch } from '@/shared/lib/api-client'
import type { CreateWorkItemRequest, Priority, WorkItemDetailResponse, WorkItemType } from '../types/work-item.types'

export async function getWorkItem(code: string): Promise<WorkItemDetailResponse> {
  return apiFetch<WorkItemDetailResponse>(`/v1/flowboard/work-items/${encodeURIComponent(code)}`)
}

export async function createWorkItem(payload: CreateWorkItemRequest): Promise<string> {
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

export async function updateWorkItemDescription(workItemId: string, description: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/description`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  })
}

export async function updateWorkItemEstimatedPoints(
  workItemId: string,
  estimatedPoints: number | null,
): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/estimated-points`, {
    method: 'PATCH',
    body: JSON.stringify({ estimatedPoints }),
  })
}

export async function updateWorkItemPriority(workItemId: string, priority: Priority): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/priority`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  })
}

export async function updateWorkItemTitle(workItemId: string, title: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export async function updateWorkItemType(workItemId: string, type: WorkItemType): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/type`, {
    method: 'PATCH',
    body: JSON.stringify({ type }),
  })
}
