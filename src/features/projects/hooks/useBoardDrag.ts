import { createContext, use } from 'react'
import type { ActiveDrag } from '@/features/projects/utils/column-drop-state'

export interface BoardDragContextValue {
  /** Whether the current user may drag cards at all (`canEditWorkItems`). */
  enabled: boolean
  /** The drag in progress, or null. Changes only when a drag starts and ends. */
  activeDrag: ActiveDrag | null
  canMoveTo: (fromStateId: string, toStateId: string) => boolean
  /** Cards whose move hasn't settled yet; they can't be dragged again until it does. */
  pendingIds: ReadonlySet<string>
}

const NO_PENDING: ReadonlySet<string> = new Set()

/** Outside a `BoardDragProvider` nothing is draggable and nothing accepts a drop. */
export const BoardDragContext = createContext<BoardDragContextValue>({
  enabled: false,
  activeDrag: null,
  canMoveTo: () => false,
  pendingIds: NO_PENDING,
})

export function useBoardDrag(): BoardDragContextValue {
  return use(BoardDragContext)
}
