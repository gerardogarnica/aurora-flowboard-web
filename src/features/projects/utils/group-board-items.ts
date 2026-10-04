import { WORK_ITEM_TYPE_CONFIG, getWorkItemTypeConfig } from '@/features/work-items/constants/work-item-display'
import type { WorkItemType } from '@/features/work-items/types/work-item.types'
import type { BoardGroupBy } from '../constants/board-group-by'
import type { ProjectMilestone } from '../types/milestone.types'
import type { ProjectBoardColumn, ProjectBoardWorkItem } from '../types/project.types'

export type BoardGroupIdentity =
  | { kind: 'assignee'; userId: string; initials: string }
  | { kind: 'unassigned' }
  | { kind: 'type'; type: WorkItemType }
  | { kind: 'milestone'; color: string | null }
  | { kind: 'no-milestone' }
  | { kind: 'plain' }

export interface BoardGroup {
  key: string
  label: string
  /** The trailing "Unassigned" / "No milestone" / "No component" bucket. */
  isEmptyValue: boolean
  isCurrentUser: boolean
  identity: BoardGroupIdentity
  /** Work items per `flowStateId`, in the order the API sent them. */
  cells: Record<string, ProjectBoardWorkItem[]>
  total: number
}

interface GroupContext {
  currentUserId?: string
  /** Used to order milestone lanes by start date; `undefined` while loading → A→Z. */
  milestones?: ProjectMilestone[]
}

const EMPTY_KEY = '__none'

const EMPTY_LABEL: Record<Exclude<BoardGroupBy, 'none' | 'type'>, string> = {
  assignee: 'Unassigned',
  milestone: 'No milestone',
  component: 'No component',
}

const TYPE_ORDER = Object.keys(WORK_ITEM_TYPE_CONFIG) as WorkItemType[]

/** Position in `TYPE_ORDER`; a type the backend added before the frontend knows it ranks after all of them. */
function typeRank(type: string): number {
  const index = TYPE_ORDER.indexOf(type as WorkItemType)
  return index === -1 ? TYPE_ORDER.length : index
}

type GroupSeed = Pick<BoardGroup, 'key' | 'label' | 'isEmptyValue' | 'identity'>

function seedFor(item: ProjectBoardWorkItem, groupBy: Exclude<BoardGroupBy, 'none'>): GroupSeed {
  switch (groupBy) {
    case 'assignee':
      return item.assigneeId
        ? {
            key: item.assigneeId,
            label: item.assigneeFullName ?? 'Unknown',
            isEmptyValue: false,
            identity: { kind: 'assignee', userId: item.assigneeId, initials: item.assigneeInitials ?? '?' },
          }
        : { key: EMPTY_KEY, label: EMPTY_LABEL.assignee, isEmptyValue: true, identity: { kind: 'unassigned' } }
    case 'type':
      return {
        key: item.type,
        label: getWorkItemTypeConfig(item.type).label,
        isEmptyValue: false,
        identity: { kind: 'type', type: item.type },
      }
    case 'milestone':
      return item.milestoneName
        ? {
            key: item.milestoneName,
            label: item.milestoneName,
            isEmptyValue: false,
            identity: { kind: 'milestone', color: item.milestoneColor },
          }
        : { key: EMPTY_KEY, label: EMPTY_LABEL.milestone, isEmptyValue: true, identity: { kind: 'no-milestone' } }
    case 'component':
      return item.component
        ? { key: item.component, label: item.component, isEmptyValue: false, identity: { kind: 'plain' } }
        : { key: EMPTY_KEY, label: EMPTY_LABEL.component, isEmptyValue: true, identity: { kind: 'plain' } }
  }
}

const byLabel = (a: BoardGroup, b: BoardGroup) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })

function compareGroups(groupBy: Exclude<BoardGroupBy, 'none'>, ctx: GroupContext) {
  const startDates = new Map<string, string | null>()
  for (const m of ctx.milestones ?? []) {
    if (!startDates.has(m.name)) startDates.set(m.name, m.targetStartDate)
  }

  return (a: BoardGroup, b: BoardGroup): number => {
    // The "no value" bucket always closes the list.
    if (a.isEmptyValue !== b.isEmptyValue) return a.isEmptyValue ? 1 : -1

    switch (groupBy) {
      case 'assignee':
        if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1
        return byLabel(a, b)
      case 'type':
        // Known types never tie, so the label only orders the unknown ones among themselves.
        return typeRank(a.key) - typeRank(b.key) || byLabel(a, b)
      case 'milestone': {
        const aDate = startDates.get(a.key) ?? null
        const bDate = startDates.get(b.key) ?? null
        if (aDate && bDate && aDate !== bDate) return aDate < bDate ? -1 : 1
        if (!!aDate !== !!bDate) return aDate ? -1 : 1
        return byLabel(a, b)
      }
      case 'component':
        return byLabel(a, b)
    }
  }
}

/** Splits the board columns into swimlanes. Only groups with at least one item are returned. */
export function groupBoardItems(
  columns: ProjectBoardColumn[],
  groupBy: Exclude<BoardGroupBy, 'none'>,
  ctx: GroupContext = {},
): BoardGroup[] {
  const groups = new Map<string, BoardGroup>()

  for (const column of columns) {
    for (const item of column.workItems) {
      const seed = seedFor(item, groupBy)
      let group = groups.get(seed.key)
      if (!group) {
        group = {
          ...seed,
          isCurrentUser: groupBy === 'assignee' && !!ctx.currentUserId && seed.key === ctx.currentUserId,
          cells: {},
          total: 0,
        }
        groups.set(seed.key, group)
      }
      if (!group.cells[column.flowStateId]) group.cells[column.flowStateId] = []
      group.cells[column.flowStateId].push(item)
      group.total += 1
    }
  }

  return [...groups.values()].sort(compareGroups(groupBy, ctx))
}
