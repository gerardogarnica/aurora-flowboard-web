import { apiFetch } from '@/shared/lib/api-client'
import type { CreateProjectPayload } from '../types/project.types'

export async function createProject(payload: CreateProjectPayload): Promise<string> {
  return apiFetch<string>('/v1/flowboard/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
