import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

/**
 * Whether an item in `fromStateId` may be dropped on the `toStateId` column: the origin column's
 * `availableTransitions` (already filtered by the user's role on the backend) narrowed to the
 * columns this board actually shows. Completed and Cancelled states are never columns, so a drag
 * can't complete or cancel an item.
 */
export function canMoveTo(columns: ProjectBoardColumn[], fromStateId: string, toStateId: string): boolean {
  if (fromStateId === toStateId) return false
  if (!columns.some((col) => col.flowStateId === toStateId)) return false
  const from = columns.find((col) => col.flowStateId === fromStateId)
  return (from?.availableTransitions ?? []).some((t) => t.toStateId === toStateId)
}
