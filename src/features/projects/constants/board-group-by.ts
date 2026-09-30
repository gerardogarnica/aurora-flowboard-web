export type BoardGroupBy = 'none' | 'assignee' | 'type' | 'milestone' | 'component'

export const BOARD_GROUP_BY_OPTIONS: { value: BoardGroupBy; label: string }[] = [
  { value: 'none',      label: 'None'      },
  { value: 'assignee',  label: 'Assignee'  },
  { value: 'type',      label: 'Type'      },
  { value: 'milestone', label: 'Milestone' },
  { value: 'component', label: 'Component' },
]

/** Query-string key that carries the board grouping (`None` = absent). */
export const BOARD_GROUP_BY_PARAM = 'groupBy'

/** Reads `?groupBy=`; anything missing or unknown falls back to `'none'`. */
export function parseBoardGroupBy(param: string | null): BoardGroupBy {
  return BOARD_GROUP_BY_OPTIONS.some((o) => o.value === param) ? (param as BoardGroupBy) : 'none'
}

export function getBoardGroupByLabel(value: BoardGroupBy): string {
  return BOARD_GROUP_BY_OPTIONS.find((o) => o.value === value)?.label ?? 'None'
}
