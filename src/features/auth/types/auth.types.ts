export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: string
}

export interface UserProfile {
  userId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  isActive: boolean
  roles: string[]
  createdOnUtc: string
  updatedOnUtc: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  accessTokenExpiresOn: Date
  refreshToken: string
  refreshTokenExpiresOn: Date
}
