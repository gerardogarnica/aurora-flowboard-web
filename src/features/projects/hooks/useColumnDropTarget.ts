import { useEffect, useEffectEvent, useState, type RefObject } from 'react'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { useBoardDrag } from '@/features/projects/hooks/useBoardDrag'
import { isWorkItemDragData, type BoardDropTargetData } from '@/features/projects/utils/board-drag-data'
import { getColumnDropState, type ColumnDropState } from '@/features/projects/utils/column-drop-state'

/**
 * Makes a column (or a swimlane cell) a drop target that accepts only cards of its own lane whose
 * move to this state the flow permits. Returns how the column should look during the drag.
 */
export function useColumnDropTarget(
  ref: RefObject<HTMLElement | null>,
  { stateId, laneKey }: BoardDropTargetData,
): ColumnDropState {
  const { enabled, activeDrag, canMoveTo } = useBoardDrag()
  const [isOver, setIsOver] = useState(false)

  // Reads the latest columns on every call without re-registering the drop target on each refetch.
  const accepts = useEffectEvent(
    (data: Record<string | symbol, unknown>) =>
      isWorkItemDragData(data) && data.laneKey === laneKey && canMoveTo(data.fromStateId, stateId),
  )

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return
    return dropTargetForElements({
      element,
      getData: () => ({ stateId, laneKey }),
      canDrop: ({ source }) => accepts(source.data),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    })
  }, [ref, enabled, stateId, laneKey])

  return getColumnDropState({ activeDrag, stateId, laneKey, isOver, canMoveTo })
}
