import type { ProjectApiStatus } from '@/features/projects/types/project.types'

export interface AuthUser {
  id: string
  fullName: string
  initials: string | null
  email: string
  role: string
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

export interface MySummaryCounts {
  projects: number
  members: number
  inboxUnread: number
  myOpenIssues: number
}

export interface MySummaryProject {
  projectId: string
  name: string
  color: string
  status: ProjectApiStatus
}

export interface MySummaryResponse {
  me: {
    userId: string
    fullName: string
    initials: string | null
    email: string
    role: string
  }
  counts: MySummaryCounts
  projects: MySummaryProject[]
}
