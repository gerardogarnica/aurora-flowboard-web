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

/**
 * Whether `userId` is a `Viewer` member of the project. The backend rejects every work-item
 * write from a Viewer (403) except comments, and rejects assigning a work item to one (400).
 * `canAddOrUpdateWorkItems` only reflects the project's status, so it doesn't cover this.
 */
export function isProjectViewer(
  members: readonly Pick<ProjectMemberSummary, 'userId' | 'role'>[],
  userId: string | undefined,
): boolean {
  return userId !== undefined && members.some((m) => m.userId === userId && m.role === 'Viewer')
}
