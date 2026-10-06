import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { ColumnDropState } from '@/features/projects/utils/column-drop-state'

// Inset rings: the swimlane panels clip anything drawn outside a cell (overflow-hidden).
const DROP_STATE_CLASS: Record<ColumnDropState, string> = {
  idle: '',
  source: '',
  allowed: 'ring-2 ring-inset ring-(--drop-ring)/40',
  over: 'ring-3 ring-inset ring-(--drop-ring)',
  blocked: 'opacity-50',
}

/** The classes a column or swimlane cell gets for its drop state. Pair with `dropRingStyle`. */
export function boardDropClassName(state: ColumnDropState): string {
  return cn('transition-[opacity,box-shadow] duration-150', DROP_STATE_CLASS[state])
}

/** The column's color, which the drop rings paint with. */
export function dropRingStyle(hex: string): CSSProperties {
  return { '--drop-ring': hex } as CSSProperties
}
