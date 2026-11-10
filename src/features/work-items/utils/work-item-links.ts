/**
 * The item's detail opens over its project's board, because `WorkItemDetailModal` needs the
 * board's columns.
 */
export function getWorkItemBoardPath(projectId: string, code: string): string {
  return `/projects/${encodeURIComponent(projectId)}/board?selected=${encodeURIComponent(code)}`
}
