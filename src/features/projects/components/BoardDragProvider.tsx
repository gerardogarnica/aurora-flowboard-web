import { useCallback, useEffect, useEffectEvent, useMemo, useState, type ReactNode, type RefObject } from 'react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { useMoveBoardWorkItem } from '@/features/work-items/hooks/useMoveBoardWorkItem'
import { BoardDragContext, type BoardDragContextValue } from '@/features/projects/hooks/useBoardDrag'
import { canMoveTo } from '@/features/projects/utils/board-drop-targets'
import { isBoardDropTargetData, isWorkItemDragData } from '@/features/projects/utils/board-drag-data'
import type { ActiveDrag } from '@/features/projects/utils/column-drop-state'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

interface BoardDragProviderProps {
  projectId: string
  /** The columns the board shows; only these accept drops. */
  columns: ProjectBoardColumn[]
  /** `canEditWorkItems`: false for Viewers and for projects that take no work-item writes. */
  enabled: boolean
  /** The board's scrolling container, auto-scrolled when a drag nears its edges. */
  scrollContainerRef: RefObject<HTMLElement | null>
  children: ReactNode
}

/**
 * Drag-and-drop for one project board: watches every card drag, tells the columns which drag is
 * in progress, and moves the item when it is dropped on a column that accepts it. A drop anywhere
 * else does nothing — no request, no toast.
 */
export function BoardDragProvider({ projectId, columns, enabled, scrollContainerRef, children }: BoardDragProviderProps) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const { move, pendingIds } = useMoveBoardWorkItem(projectId)

  const canMove = useCallback((from: string, to: string) => canMoveTo(columns, from, to), [columns])

  // An Effect Event, so the monitor registers once yet drops against the latest columns: a monitor
  // re-registered mid-drag could miss that drag's onDrop.
  const handleDrop = useEffectEvent(
    (source: Record<string | symbol, unknown>, target: Record<string | symbol, unknown> | undefined) => {
      setActiveDrag(null)
      if (!isWorkItemDragData(source) || !target || !isBoardDropTargetData(target)) return
      if (target.laneKey !== source.laneKey || !canMoveTo(columns, source.fromStateId, target.stateId)) return
      const toColumn = columns.find((col) => col.flowStateId === target.stateId)
      if (!toColumn) return
      move({
        workItemId: source.workItemId,
        code: source.code,
        toStateId: toColumn.flowStateId,
        toStateName: toColumn.flowStateName,
      })
    },
  )

  useEffect(() => {
    if (!enabled) return
    return monitorForElements({
      canMonitor: ({ source }) => isWorkItemDragData(source.data),
      onDragStart: ({ source }) => {
        if (isWorkItemDragData(source.data)) {
          setActiveDrag({ fromStateId: source.data.fromStateId, laneKey: source.data.laneKey })
        }
      },
      onDrop: ({ source, location }) => handleDrop(source.data, location.current.dropTargets[0]?.data),
    })
  }, [enabled])

  useEffect(() => {
    const element = scrollContainerRef.current
    if (!enabled || !element) return
    return autoScrollForElements({ element, canScroll: ({ source }) => isWorkItemDragData(source.data) })
  }, [enabled, scrollContainerRef])

  const value = useMemo<BoardDragContextValue>(
    () => ({
      enabled,
      // Derived rather than reset: if dragging is switched off mid-drag the monitor is gone and
      // its onDrop never fires, so a stale activeDrag would leave the columns painted.
      activeDrag: enabled ? activeDrag : null,
      canMoveTo: canMove,
      pendingIds,
    }),
    [enabled, activeDrag, canMove, pendingIds],
  )

  return <BoardDragContext value={value}>{children}</BoardDragContext>
}
