import type { WorkItemStage } from '../types/work-item.types'

const DAY_MS = 24 * 60 * 60 * 1000

/** From this many days an in-flight item shows amber. */
export const AGE_WARNING_DAYS = 4
/** From this many days an in-flight item is stalled and shows red. The backend has its own constant. */
export const AGE_STALLED_DAYS = 7

export type WorkItemAgeLevel = 'neutral' | 'warning' | 'stalled'

/** Full 24-hour blocks since the item entered its state, not calendar days. */
export function getDaysInState(enteredOnUtc: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(enteredOnUtc).getTime()) / DAY_MS))
}

/** A backlog item never alarms, however old. A stage the frontend doesn't know doesn't either. */
export function getWorkItemAgeLevel(stage: WorkItemStage | null | undefined, days: number): WorkItemAgeLevel {
  if (stage !== 'InFlight') return 'neutral'
  if (days >= AGE_STALLED_DAYS) return 'stalled'
  if (days >= AGE_WARNING_DAYS) return 'warning'
  return 'neutral'
}
