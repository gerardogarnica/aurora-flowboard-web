import type { AuthUser } from '../types/auth.types'

export function getUserInitials(user: AuthUser): string {
  return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
}
