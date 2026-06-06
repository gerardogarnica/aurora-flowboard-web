import { apiFetch } from '@/shared/lib/api-client'
import type { FlowStateBoardResponse } from '../types/board.types'

export async function getProjectBoard(projectId: string): Promise<FlowStateBoardResponse[]> {
  return apiFetch<FlowStateBoardResponse[]>(`/v1/flowboard/projects/${projectId}/work-items`)
}
