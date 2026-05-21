export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
