import { apiFetch, apiPath } from '@/shared/lib/api-client'
import type {
  CreateComponentRequest,
  ProjectComponent,
  RenameComponentRequest,
} from '../types/component.types'

export async function getComponentsByProject(projectId: string): Promise<ProjectComponent[]> {
  return apiFetch<ProjectComponent[]>(apiPath`/v1/flowboard/projects/${projectId}/components`)
}

export async function createComponent(
  projectId: string,
  payload: CreateComponentRequest,
): Promise<string> {
  return apiFetch<string>(apiPath`/v1/flowboard/projects/${projectId}/components`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function renameComponent(
  componentId: string,
  payload: RenameComponentRequest,
): Promise<void> {
  return apiFetch<void>(apiPath`/v1/flowboard/components/${componentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function retireComponent(componentId: string): Promise<void> {
  return apiFetch<void>(apiPath`/v1/flowboard/components/${componentId}/retire`, {
    method: 'PATCH',
  })
}
