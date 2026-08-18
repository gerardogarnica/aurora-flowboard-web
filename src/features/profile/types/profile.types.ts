export interface UserProfile {
  userId: string
  firstName: string
  lastName: string
  fullName: string
  initials: string | null
  email: string
  isActive: boolean
  roles: string[] | null
  createdOnUtc: string
  updatedOnUtc: string | null
}
