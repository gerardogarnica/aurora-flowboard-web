import { ApiError } from '@/shared/lib/api-client'

/**
 * Whether a rejected work-item write may mean the cached project members are stale: a 403
 * (`WorkItem.ViewerCannotModify`, the caller became a Viewer) or a 400
 * (`WorkItem.AssigneeIsViewer`, the assignee became one). Matched by status only — the domain
 * code is buried in the ProblemDetails `title` — so other 400s also refetch the project, which
 * is harmless.
 */
export function mayBeStaleProjectRole(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 400)
}
