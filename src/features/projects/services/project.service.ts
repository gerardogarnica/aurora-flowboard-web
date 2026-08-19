import { apiFetch } from '@/shared/lib/api-client'
import type { CreateProjectRequest, Project, ProjectDetailResponse } from '../types/project.types'

const STATUS_ENDPOINT: Record<string, string> = {
  Active:      'activate',
  Maintenance: 'maintenance',
  Completed:   'complete',
  Archived:    'archive',
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>('/v1/flowboard/projects')
}

export async function getProjectById(projectId: string): Promise<ProjectDetailResponse> {
  return apiFetch<ProjectDetailResponse>(`/v1/flowboard/projects/${projectId}`)
}

export async function createProject(payload: CreateProjectRequest): Promise<string> {
  return apiFetch<string>('/v1/flowboard/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProjectStatus(projectId: string, status: string): Promise<void> {
  const action = STATUS_ENDPOINT[status]
  return apiFetch<void>(`/v1/flowboard/projects/${projectId}/${action}`, { method: 'PATCH' })
}
