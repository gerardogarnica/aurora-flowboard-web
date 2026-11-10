import { apiFetch } from '@/shared/lib/api-client'
import type { DashboardResponse } from '../types/dashboard.types'

export async function getDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/v1/flowboard/dashboard')
}
