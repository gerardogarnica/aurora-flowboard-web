import { apiFetch } from '@/shared/lib/api-client'
import type { ChangePasswordRequest, UserProfile } from '../types/profile.types'

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/v1/flowboard/users/me')
}

export function changePassword(payload: ChangePasswordRequest): Promise<void> {
  return apiFetch<void>('/v1/flowboard/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
