import type { ProjectMemberSummary } from '../types/project.types'

/**
 * Whether `userId` is an `Admin` member of the project. The backend gates every project-level
 * write on this (status, members, details, components, milestones) — not on the workspace
 * `Administrator` role, which alone isn't enough.
 */
export function hasProjectAdminRole(
  members: readonly Pick<ProjectMemberSummary, 'userId' | 'role'>[],
  userId: string | undefined,
): boolean {
  return userId !== undefined && members.some((m) => m.userId === userId && m.role === 'Admin')
}
