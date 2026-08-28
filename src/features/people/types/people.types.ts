export type UserRole = 'Administrator' | 'Member'

export interface SystemUser {
  userId: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
  email: string
  isActive: boolean
  role: UserRole
  createdOnUtc: string
  updatedOnUtc: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}
