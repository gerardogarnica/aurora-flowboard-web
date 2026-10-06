/** The lane every column shares when the board isn't grouped into swimlanes. */
export const SINGLE_LANE_KEY = 'all'

// Type aliases, not interfaces: Pragmatic's data is `Record<string, unknown>`, and only an
// object type alias is assignable to an index signature.

/** What a board card attaches to its drag (Pragmatic's `getInitialData`). */
export type WorkItemDragData = {
  type: 'work-item'
  workItemId: string
  code: string
  fromStateId: string
  laneKey: string
}

export function makeWorkItemDragData(fields: Omit<WorkItemDragData, 'type'>): WorkItemDragData {
  return { type: 'work-item', ...fields }
}

/** Narrows a drag's data to a board card's, so drags from anything else are ignored. */
export function isWorkItemDragData(
  data: Record<string | symbol, unknown>,
): data is WorkItemDragData & Record<string | symbol, unknown> {
  return (
    data.type === 'work-item' &&
    typeof data.workItemId === 'string' &&
    typeof data.code === 'string' &&
    typeof data.fromStateId === 'string' &&
    typeof data.laneKey === 'string'
  )
}

/** What a column (or a swimlane cell) exposes as a drop target (Pragmatic's `getData`). */
export type BoardDropTargetData = {
  stateId: string
  laneKey: string
}

export function isBoardDropTargetData(
  data: Record<string | symbol, unknown>,
): data is BoardDropTargetData & Record<string | symbol, unknown> {
  return typeof data.stateId === 'string' && typeof data.laneKey === 'string'
}
