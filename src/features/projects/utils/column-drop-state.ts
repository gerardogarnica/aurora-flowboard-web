/** The drag in progress, as the columns need it to paint themselves. */
export interface ActiveDrag {
  fromStateId: string
  laneKey: string
}

export type ColumnDropState = 'idle' | 'source' | 'allowed' | 'blocked' | 'over'

/**
 * How a column (or a swimlane cell) looks while a card is dragged: neutral when it's the origin,
 * highlighted when the card may land on it, dimmed otherwise. Cells of another lane are always
 * blocked: a drop only changes the state, never the grouped field.
 */
export function getColumnDropState({
  activeDrag,
  stateId,
  laneKey,
  isOver,
  canMoveTo,
}: {
  activeDrag: ActiveDrag | null
  stateId: string
  laneKey: string
  isOver: boolean
  canMoveTo: (fromStateId: string, toStateId: string) => boolean
}): ColumnDropState {
  if (!activeDrag) return 'idle'
  if (activeDrag.laneKey !== laneKey) return 'blocked'
  if (activeDrag.fromStateId === stateId) return 'source'
  if (!canMoveTo(activeDrag.fromStateId, stateId)) return 'blocked'
  return isOver ? 'over' : 'allowed'
}
