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
