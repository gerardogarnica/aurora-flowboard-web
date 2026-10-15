import { apiFetch, apiPath } from '@/shared/lib/api-client'
import type { PagedResult } from '@/shared/types/paged-result.types'
import type {
  CreateProjectRequest,
  Project,
  ProjectBoardColumn,
  ProjectChangeLog,
  ProjectDetailResponse,
  ProjectApiStatus,
  ProjectRole,
  UpdateProjectRequest,
} from '../types/project.types'

const STATUS_ENDPOINT: Record<ProjectApiStatus, string> = {
  Active:      'activate',
  Maintenance: 'maintenance',
  Completed:   'complete',
  Archived:    'archive',
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>('/v1/flowboard/projects')
}

export async function getProjectById(projectId: string): Promise<ProjectDetailResponse> {
  return apiFetch<ProjectDetailResponse>(apiPath`/v1/flowboard/projects/${projectId}`)
}

/** Newest first. Not part of the detail: the history grows without bound, so it's paged. */
export async function getProjectChangeLogs(
  projectId: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<ProjectChangeLog>> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return apiFetch<PagedResult<ProjectChangeLog>>(`${apiPath`/v1/flowboard/projects/${projectId}/change-logs`}?${query}`)
}

export async function getProjectBoard(projectId: string): Promise<ProjectBoardColumn[]> {
  return apiFetch<ProjectBoardColumn[]>(apiPath`/v1/flowboard/projects/${projectId}/board`)
}

export async function createProject(payload: CreateProjectRequest): Promise<string> {
  return apiFetch<string>('/v1/flowboard/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProject(projectId: string, payload: UpdateProjectRequest): Promise<void> {
  return apiFetch<void>(apiPath`/v1/flowboard/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateProjectStatus(projectId: string, status: ProjectApiStatus): Promise<void> {
  const action = STATUS_ENDPOINT[status]
  return apiFetch<void>(apiPath`/v1/flowboard/projects/${projectId}/${action}`, { method: 'PATCH' })
}

export async function addProjectMember(
  projectId: string,
  payload: { userId: string; role: ProjectRole },
): Promise<void> {
  return apiFetch<void>(apiPath`/v1/flowboard/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  return apiFetch<void>(apiPath`/v1/flowboard/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })
}
