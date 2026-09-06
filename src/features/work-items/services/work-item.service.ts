import { apiFetch } from '@/shared/lib/api-client'
import type {
  CreateWorkItemRequest,
  Priority,
  WorkItemChangeLog,
  WorkItemComment,
  WorkItemDetailResponse,
  WorkItemStateTransition,
  WorkItemTimeEntry,
  WorkItemType,
} from '../types/work-item.types'
import type { PagedResult } from '@/shared/types/paged-result.types'

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

export async function updateWorkItemEstimatedCompletionDate(
  workItemId: string,
  estimatedCompletionDate: string | null,
): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/estimated-completion-date`, {
    method: 'PATCH',
    body: JSON.stringify({ estimatedCompletionDate }),
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

export async function updateWorkItemComponent(workItemId: string, componentId: string | null): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/component`, {
    method: 'PATCH',
    body: JSON.stringify({ componentId }),
  })
}

export async function updateWorkItemMilestone(workItemId: string, milestoneId: string | null): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/milestone`, {
    method: 'PATCH',
    body: JSON.stringify({ milestoneId }),
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

// The four activity collections used to arrive nested in the detail response. They now
// live behind their own paginated sub-endpoints, keyed by the work item's GUID (not its
// code), and come back newest-first.
function activityPath(workItemId: string, resource: string, page: number, pageSize: number): string {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return `/v1/flowboard/work-items/${workItemId}/${resource}?${query}`
}

export async function getWorkItemComments(
  workItemId: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<WorkItemComment>> {
  return apiFetch<PagedResult<WorkItemComment>>(activityPath(workItemId, 'comments', page, pageSize))
}

export async function getWorkItemTimeEntries(
  workItemId: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<WorkItemTimeEntry>> {
  return apiFetch<PagedResult<WorkItemTimeEntry>>(activityPath(workItemId, 'time-entries', page, pageSize))
}

export async function getWorkItemStateHistory(
  workItemId: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<WorkItemStateTransition>> {
  return apiFetch<PagedResult<WorkItemStateTransition>>(activityPath(workItemId, 'state-history', page, pageSize))
}

export async function getWorkItemChangeLogs(
  workItemId: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<WorkItemChangeLog>> {
  return apiFetch<PagedResult<WorkItemChangeLog>>(activityPath(workItemId, 'change-logs', page, pageSize))
}
