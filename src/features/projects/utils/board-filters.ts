import { WORK_ITEM_TYPE_CONFIG, getWorkItemTypeConfig } from '@/features/work-items/constants/work-item-display'
import type { WorkItemType } from '@/features/work-items/types/work-item.types'
import {
  BOARD_FILTER_FIELDS,
  BOARD_FILTER_NO_VALUE,
  hasActiveBoardFilters,
  type BoardFilterField,
  type BoardFilters,
} from '../constants/board-filters'
import type { ProjectBoardColumn, ProjectBoardWorkItem } from '../types/project.types'
import { typeRank, type BoardGroupIdentity } from './group-board-items'

export type BoardFilterOptionIdentity = Extract<
  BoardGroupIdentity,
  { kind: 'type' | 'milestone' | 'no-milestone' | 'plain' }
>

export interface BoardFilterOption {
  /** What the URL and the selection carry: the type, the name, or `BOARD_FILTER_NO_VALUE`. */
  value: string
  label: string
  /** Items with this value on the whole board, ignoring every filter. */
  count: number
  /** The trailing "No milestone" / "No component" option. */
  isEmptyValue: boolean
  identity: BoardFilterOptionIdentity
}

export type BoardFilterOptions = Record<BoardFilterField, BoardFilterOption[]>

const EMPTY_LABEL: Record<Exclude<BoardFilterField, 'type'>, string> = {
  milestone: 'No milestone',
  component: 'No component',
}

function valueOf(item: ProjectBoardWorkItem, field: BoardFilterField): string {
  switch (field) {
    case 'type':
      return item.type
    case 'milestone':
      return item.milestoneName ?? BOARD_FILTER_NO_VALUE
    case 'component':
      return item.component ?? BOARD_FILTER_NO_VALUE
  }
}

/** `item` is the first one seen with this value; absent for a URL value that isn't on the board. */
function optionFor(
  field: BoardFilterField,
  value: string,
  item?: ProjectBoardWorkItem,
): Omit<BoardFilterOption, 'count'> {
  const isEmptyValue = value === BOARD_FILTER_NO_VALUE
  switch (field) {
    case 'type':
      return {
        value,
        label: getWorkItemTypeConfig(value as WorkItemType).label,
        isEmptyValue: false,
        identity: { kind: 'type', type: value as WorkItemType },
      }
    case 'milestone':
      return isEmptyValue
        ? { value, label: EMPTY_LABEL.milestone, isEmptyValue, identity: { kind: 'no-milestone' } }
        : { value, label: value, isEmptyValue, identity: { kind: 'milestone', color: item?.milestoneColor ?? null } }
    case 'component':
      return { value, label: isEmptyValue ? EMPTY_LABEL.component : value, isEmptyValue, identity: { kind: 'plain' } }
  }
}

const byLabel = (a: BoardFilterOption, b: BoardFilterOption) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })

function compareOptions(field: BoardFilterField) {
  return (a: BoardFilterOption, b: BoardFilterOption): number => {
    if (a.isEmptyValue !== b.isEmptyValue) return a.isEmptyValue ? 1 : -1
    if (field === 'type') return typeRank(a.value) - typeRank(b.value) || byLabel(a, b)
    return byLabel(a, b)
  }
}

/**
 * Drops `?type=` values the frontend doesn't know and the board doesn't carry. A type the backend
 * added before the frontend knows it still filters while items of it are on the board.
 */
export function resolveBoardFilters(filters: BoardFilters, columns: ProjectBoardColumn[]): BoardFilters {
  if (filters.type.length === 0) return filters
  const onBoard = new Set<string>(columns.flatMap((column) => column.workItems.map((item) => item.type)))
  const type = filters.type.filter((value) => Object.hasOwn(WORK_ITEM_TYPE_CONFIG, value) || onBoard.has(value))
  return type.length === filters.type.length ? filters : { ...filters, type }
}

/**
 * Keeps the items that match every active field (OR within a field, AND across fields).
 * Without filters it returns `columns` itself, so the memos and memoized cards downstream stay put.
 */
export function filterBoardItems(columns: ProjectBoardColumn[], filters: BoardFilters): ProjectBoardColumn[] {
  if (!hasActiveBoardFilters(filters)) return columns

  const active = BOARD_FILTER_FIELDS.filter(({ field }) => filters[field].length > 0).map(
    ({ field }) => [field, new Set(filters[field])] as const,
  )
  const matches = (item: ProjectBoardWorkItem) => active.every(([field, values]) => values.has(valueOf(item, field)))

  return columns.map((column) => ({ ...column, workItems: column.workItems.filter(matches) }))
}

function optionsFor(columns: ProjectBoardColumn[], field: BoardFilterField, selected: string[]): BoardFilterOption[] {
  const options = new Map<string, BoardFilterOption>()

  for (const column of columns) {
    for (const item of column.workItems) {
      const value = valueOf(item, field)
      const option = options.get(value)
      if (option) option.count += 1
      else options.set(value, { ...optionFor(field, value, item), count: 1 })
    }
  }
  // A selected value that's no longer on the board stays listed (count 0) so it can be unchecked.
  for (const value of selected) {
    if (!options.has(value)) options.set(value, { ...optionFor(field, value), count: 0 })
  }

  return [...options.values()].sort(compareOptions(field))
}

/** The values each selector lists, taken from the whole board — never narrowed by the other filters. */
export function getBoardFilterOptions(columns: ProjectBoardColumn[], filters: BoardFilters): BoardFilterOptions {
  return {
    type: optionsFor(columns, 'type', filters.type),
    milestone: optionsFor(columns, 'milestone', filters.milestone),
    component: optionsFor(columns, 'component', filters.component),
  }
}
