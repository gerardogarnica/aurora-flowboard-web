import type { AuthUser, MySummaryResponse } from '../types/auth.types'

export function toAuthUser(me: MySummaryResponse['me']): AuthUser {
  return {
    id: me.userId,
    fullName: me.fullName,
    initials: me.initials,
    email: me.email,
    role: me.role,
  }
}

export function isSameAuthUser(a: AuthUser, b: AuthUser): boolean {
  return (
    a.id === b.id &&
    a.fullName === b.fullName &&
    a.initials === b.initials &&
    a.email === b.email &&
    a.role === b.role
  )
}
