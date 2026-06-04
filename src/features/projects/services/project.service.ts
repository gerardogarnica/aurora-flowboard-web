import { apiFetch } from '@/shared/lib/api-client'
import type { CreateProjectPayload, Project } from '../types/project.types'

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>('/v1/flowboard/projects')
}

export async function createProject(payload: CreateProjectPayload): Promise<string> {
  return apiFetch<string>('/v1/flowboard/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

const STATUS_ENDPOINT: Record<string, string> = {
  Active:    'activate',
  OnHold:    'hold',
  Completed: 'complete',
  Archived:  'archive',
}

export async function updateProjectStatus(projectId: string, status: string): Promise<void> {
  const action = STATUS_ENDPOINT[status]
  return apiFetch<void>(`/v1/flowboard/projects/${projectId}/${action}`, { method: 'PATCH' })
}
