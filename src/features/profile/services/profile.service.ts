import { apiFetch } from '@/shared/lib/api-client'
import type { UserProfile } from '../types/profile.types'

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/v1/flowboard/users/me')
}
