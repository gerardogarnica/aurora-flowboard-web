import { apiFetch } from '@/shared/lib/api-client'
import type { CreateUserRequest, SystemUser } from '../types/people.types'
import type { UserRole } from '@/shared/types/user-role.types'

export async function getUsers(): Promise<SystemUser[]> {
  return apiFetch<SystemUser[]>('/v1/flowboard/users')
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export async function createUser(payload: CreateUserRequest): Promise<string> {
  return apiFetch<string>('/v1/flowboard/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
