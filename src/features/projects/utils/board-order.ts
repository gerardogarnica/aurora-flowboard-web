import { getPriorityRank } from '@/features/work-items/constants/work-item-display'
import type { ProjectBoardWorkItem } from '@/features/projects/types/project.types'

/**
 * The order the backend sends a column in (GetProjectBoardHandler.cs): priority descending, then
 * oldest first. Timestamps are compared as dates, not strings: one may carry fractional seconds
 * and another not, and '.' sorts before 'Z'.
 */
export function compareBoardItems(a: ProjectBoardWorkItem, b: ProjectBoardWorkItem): number {
  const byPriority = getPriorityRank(b.priority) - getPriorityRank(a.priority)
  if (byPriority !== 0) return byPriority
  return Date.parse(a.createdOnUtc) - Date.parse(b.createdOnUtc)
}

/** `items` with `item` where the backend would place it; a tie goes after the existing items. */
export function insertInBoardOrder(items: ProjectBoardWorkItem[], item: ProjectBoardWorkItem): ProjectBoardWorkItem[] {
  const index = items.findIndex((existing) => compareBoardItems(item, existing) < 0)
  return index === -1 ? [...items, item] : [...items.slice(0, index), item, ...items.slice(index)]
}
