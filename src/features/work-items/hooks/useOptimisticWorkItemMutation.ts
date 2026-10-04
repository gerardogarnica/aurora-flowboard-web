import type { InvalidateQueryFilters, QueryKey } from '@tanstack/react-query'
import { cachePatch, useOptimisticMutation, type CachePatch } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import type { ProjectBoardColumn, ProjectBoardWorkItem } from '@/features/projects/types/project.types'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import { mayBeStaleProjectRole } from '../utils/stale-project-role'

interface OptimisticWorkItemOptions<TVars> {
  workItemId: string
  code: string
  /** Omit when the change never shows on a board card (description): the board is then neither patched nor refetched. */
  projectId?: string
  mutationFn: (vars: TVars) => Promise<unknown>
  /** Fields to change on the work-item detail. */
  patchDetail: (vars: TVars) => Partial<WorkItemDetailResponse>
  /** Fields to change on its board card. The two shapes differ (the card has `component`, the detail `componentName`). */
  patchCard?: (vars: TVars) => Partial<ProjectBoardWorkItem>
  /** Moves the card to this flow state's column, after patching it. */
  moveToState?: (vars: TVars) => string
  /** Other queries the change affects beyond detail, activity and board — e.g. counters. */
  alsoInvalidate?: (vars: TVars) => QueryKey[]
}

function updateCard(
  columns: ProjectBoardColumn[],
  workItemId: string,
  patch: Partial<ProjectBoardWorkItem>,
  toStateId: string | undefined,
): ProjectBoardColumn[] {
  if (toStateId === undefined) {
    return columns.map((col) => ({
      ...col,
      workItems: col.workItems.map((wi) => (wi.workItemId === workItemId ? { ...wi, ...patch } : wi)),
    }))
  }

  const card = columns.flatMap((col) => col.workItems).find((wi) => wi.workItemId === workItemId)
  if (!card) return columns

  const moved = { ...card, ...patch }
  return columns.map((col) => {
    const workItems = col.workItems.filter((wi) => wi.workItemId !== workItemId)
    return col.flowStateId === toStateId ? { ...col, workItems: [...workItems, moved] } : { ...col, workItems }
  })
}

/**
 * An optimistic edit to one work item: patches its detail and, when given a project, its board
 * card. On settle it refetches the detail, the activity tabs (every mutation writes a change-log
 * entry, so Change Log and State History would go stale otherwise) and the board.
 */
export function useOptimisticWorkItemMutation<TVars>({
  workItemId,
  code,
  projectId,
  mutationFn,
  patchDetail,
  patchCard,
  moveToState,
  alsoInvalidate,
}: OptimisticWorkItemOptions<TVars>) {
  return useOptimisticMutation<TVars>({
    mutationFn,

    patches: (vars) => {
      const patches: CachePatch[] = [
        cachePatch<WorkItemDetailResponse>(queryKeys.workItems.detail(code), (old) => ({ ...old, ...patchDetail(vars) })),
      ]
      if (projectId && (patchCard || moveToState)) {
        patches.push(
          cachePatch<ProjectBoardColumn[]>(queryKeys.projects.board(projectId), (old) =>
            updateCard(old, workItemId, patchCard?.(vars) ?? {}, moveToState?.(vars)),
          ),
        )
      }
      return patches
    },

    invalidate: (vars, error) => {
      const filters: InvalidateQueryFilters[] = [
        { queryKey: queryKeys.workItems.detail(code) },
        { queryKey: queryKeys.workItems.activity(workItemId) },
      ]
      if (projectId) filters.push({ queryKey: queryKeys.projects.board(projectId) })
      alsoInvalidate?.(vars).forEach((queryKey) => filters.push({ queryKey }))
      // Refreshes the members' roles, so the UI turns read-only or drops the Viewer from the
      // assignee options. By prefix, because not every caller passes `projectId`.
      if (mayBeStaleProjectRole(error)) filters.push({ queryKey: queryKeys.projects.details() })
      return filters
    },
  })
}
