import { apiFetch } from '@/shared/lib/api-client'
import type {
  CreateComponentRequest,
  CreateProjectRequest,
  MilestoneRequest,
  Project,
  ProjectBoardColumn,
  ProjectComponent,
  ProjectDetailResponse,
  ProjectMilestone,
  ProjectRole,
  RenameComponentRequest,
} from '../types/project.types'
import type { MilestoneAction } from '../constants/milestone-status'

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

export async function getProjectBoard(projectId: string): Promise<ProjectBoardColumn[]> {
  return apiFetch<ProjectBoardColumn[]>(`/v1/flowboard/projects/${projectId}/board`)
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

export async function addProjectMember(
  projectId: string,
  payload: { userId: string; role: ProjectRole },
): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export async function getComponentsByProject(projectId: string): Promise<ProjectComponent[]> {
  return apiFetch<ProjectComponent[]>(`/v1/flowboard/projects/${projectId}/components`)
}

export async function createComponent(
  projectId: string,
  payload: CreateComponentRequest,
): Promise<string> {
  return apiFetch<string>(`/v1/flowboard/projects/${projectId}/components`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function renameComponent(
  componentId: string,
  payload: RenameComponentRequest,
): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/components/${componentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function retireComponent(componentId: string): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/components/${componentId}/retire`, {
    method: 'PATCH',
  })
}

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
