export type BoardFilterField = 'type' | 'milestone' | 'component'

/** Selected values per field; an empty list means that field doesn't filter. */
export type BoardFilters = Record<BoardFilterField, string[]>

export const BOARD_FILTER_FIELDS: { field: BoardFilterField; label: string }[] = [
  { field: 'type',      label: 'Type'      },
  { field: 'milestone', label: 'Milestone' },
  { field: 'component', label: 'Component' },
]

/**
 * Stands for "no milestone" / "no component" in the URL and in the selections. Milestones and
 * components are matched by name (all the board carries), so the token can't be a real value's
 * empty string.
 */
export const BOARD_FILTER_NO_VALUE = '__none'

export const NO_BOARD_FILTERS: BoardFilters = { type: [], milestone: [], component: [] }

/**
 * Reads `?type=&milestone=&component=`, one repeated param per value so names with commas
 * survive. Duplicates and empty values are dropped; unknown types are dropped later, against the
 * board (`resolveBoardFilters`), because the backend can ship a type the frontend doesn't know.
 */
export function parseBoardFilters(searchParams: URLSearchParams): BoardFilters {
  const read = (field: BoardFilterField) => [...new Set(searchParams.getAll(field).filter(Boolean))]
  return { type: read('type'), milestone: read('milestone'), component: read('component') }
}

/** Replaces one field's values in a copy of `params`, keeping every other param. */
export function writeBoardFilter(
  params: URLSearchParams,
  field: BoardFilterField,
  values: string[],
): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(field)
  for (const value of values) next.append(field, value)
  return next
}

export function clearBoardFilters(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const { field } of BOARD_FILTER_FIELDS) next.delete(field)
  return next
}

export function hasActiveBoardFilters(filters: BoardFilters): boolean {
  return BOARD_FILTER_FIELDS.some(({ field }) => filters[field].length > 0)
}
