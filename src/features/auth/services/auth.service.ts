import { apiFetch } from '@/shared/lib/api-client'
import type { LoginRequest, LoginResponse, UserProfile } from '../types/auth.types'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const raw = await apiFetch<Omit<LoginResponse, 'accessTokenExpiresOn' | 'refreshTokenExpiresOn'> & {
    accessTokenExpiresOn: string
    refreshTokenExpiresOn: string
  }>('/v1/flowboard/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  return {
    ...raw,
    accessTokenExpiresOn: new Date(raw.accessTokenExpiresOn),
    refreshTokenExpiresOn: new Date(raw.refreshTokenExpiresOn),
  }
}

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/v1/flowboard/users/me')
}
