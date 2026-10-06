import type { InvalidateQueryFilters, QueryKey } from '@tanstack/react-query'
import { cachePatch, useOptimisticMutation, type CachePatch } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import type { ProjectBoardColumn, ProjectBoardWorkItem } from '@/features/projects/types/project.types'
import { insertInBoardOrder } from '@/features/projects/utils/board-order'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import { mayBeStaleProjectRole } from '../utils/stale-project-role'

/** The work item a mutation targets. Omit `projectId` when the change never shows on a board card. */
export interface WorkItemTarget {
  workItemId: string
  code: string
  projectId?: string
}

/** One call's optimistic changes, already worked out from its variables. */
export interface WorkItemPatchSet {
  /** Fields to change on the work-item detail. */
  detail: Partial<WorkItemDetailResponse>
  /** Fields to change on its board card. The two shapes differ (the card has `component`, the detail `componentName`). */
  card?: Partial<ProjectBoardWorkItem>
  /** Moves the card to this flow state's column, after patching it. */
  toStateId?: string
}

interface OptimisticWorkItemOptions<TVars> extends WorkItemTarget {
  mutationFn: (vars: TVars) => Promise<unknown>
  patchDetail: (vars: TVars) => Partial<WorkItemDetailResponse>
  patchCard?: (vars: TVars) => Partial<ProjectBoardWorkItem>
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

  // Lands where the backend will sort it, so the refetch doesn't make it jump.
  const moved = { ...card, ...patch }
  return columns.map((col) => {
    const workItems = col.workItems.filter((wi) => wi.workItemId !== workItemId)
    return col.flowStateId === toStateId ? { ...col, workItems: insertInBoardOrder(workItems, moved) } : { ...col, workItems }
  })
}

/** The cache patches of one optimistic work-item edit: its detail and, given a project, its board card. */
export function workItemPatches(target: WorkItemTarget, changes: WorkItemPatchSet): CachePatch[] {
  const patches: CachePatch[] = [
    cachePatch<WorkItemDetailResponse>(queryKeys.workItems.detail(target.code), (old) => ({ ...old, ...changes.detail })),
  ]
  if (target.projectId && (changes.card || changes.toStateId !== undefined)) {
    patches.push(
      cachePatch<ProjectBoardColumn[]>(queryKeys.projects.board(target.projectId), (old) =>
        updateCard(old, target.workItemId, changes.card ?? {}, changes.toStateId),
      ),
    )
  }
  return patches
}

/**
 * What a settled work-item mutation refetches: the detail, the activity tabs (every mutation
 * writes a change-log entry, so Change Log and State History would go stale otherwise), the
 * board when there is a project, then `extra`.
 */
export function workItemInvalidations(
  target: WorkItemTarget,
  error: Error | null,
  extra: QueryKey[] = [],
): InvalidateQueryFilters[] {
  const filters: InvalidateQueryFilters[] = [
    { queryKey: queryKeys.workItems.detail(target.code) },
    { queryKey: queryKeys.workItems.activity(target.workItemId) },
  ]
  if (target.projectId) filters.push({ queryKey: queryKeys.projects.board(target.projectId) })
  extra.forEach((queryKey) => filters.push({ queryKey }))
  // Refreshes the members' roles, so the UI turns read-only or drops the Viewer from the
  // assignee options. By prefix, because not every caller passes `projectId`.
  if (mayBeStaleProjectRole(error)) filters.push({ queryKey: queryKeys.projects.details() })
  return filters
}

/**
 * An optimistic edit to one work item: patches its detail and, when given a project, its board
 * card. On settle it refetches the detail, the activity tabs and the board.
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
  const target: WorkItemTarget = { workItemId, code, projectId }

  return useOptimisticMutation<TVars>({
    mutationFn,
    patches: (vars) =>
      workItemPatches(target, { detail: patchDetail(vars), card: patchCard?.(vars), toStateId: moveToState?.(vars) }),
    invalidate: (vars, error) => workItemInvalidations(target, error, alsoInvalidate?.(vars)),
  })
}
