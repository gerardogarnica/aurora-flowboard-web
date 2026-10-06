import { useEffect, useState, type RefObject } from 'react'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { makeWorkItemDragData, type WorkItemDragData } from '@/features/projects/utils/board-drag-data'

/**
 * Makes a board card draggable while `enabled`. The card only says what it is and where it sits;
 * whether it may land somewhere is decided by the drop targets. Returns whether it is the card
 * being dragged.
 */
export function useDraggableCard(
  ref: RefObject<HTMLElement | null>,
  { enabled, workItemId, code, fromStateId, laneKey }: { enabled: boolean } & Omit<WorkItemDragData, 'type'>,
): boolean {
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return
    return draggable({
      element,
      getInitialData: () => makeWorkItemDragData({ workItemId, code, fromStateId, laneKey }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [ref, enabled, workItemId, code, fromStateId, laneKey])

  return isDragging
}
