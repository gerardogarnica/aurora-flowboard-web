import { apiFetch } from '@/shared/lib/api-client'
import type { LoginRequest, LoginResponse } from '../types/auth.types'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}
