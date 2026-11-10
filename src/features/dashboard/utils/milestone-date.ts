import { parseDateOnly, startOfToday } from '@/shared/lib/date-format'

const DAY_MS = 24 * 60 * 60 * 1000
const SOON_DAYS = 7
const ON_TRACK_PROGRESS = 0.8

export type MilestoneDateTone = 'neutral' | 'soon' | 'overdue'

export interface MilestoneDate {
  label: string
  tone: MilestoneDateTone
}

/**
 * A milestone's date in local calendar days. Red once past; amber within 7 days while under 80%
 * done; otherwise gray. With no linked items there is no progress to judge, so it's always gray.
 */
export function getMilestoneDate(
  targetEndDate: string | null,
  linkedTotal: number,
  linkedClosed: number,
  today: Date = startOfToday(),
): MilestoneDate {
  const target = targetEndDate ? parseDateOnly(targetEndDate) : undefined
  if (!target) return { label: 'No target date', tone: 'neutral' }

  // Rounded because a day with a clock change isn't 24 hours long.
  const days = Math.round((target.getTime() - today.getTime()) / DAY_MS)
  const label = days === 0 ? 'today' : days > 0 ? `in ${days}d` : `${-days}d past`

  if (linkedTotal === 0) return { label, tone: 'neutral' }
  if (days < 0) return { label, tone: 'overdue' }
  if (days <= SOON_DAYS && linkedClosed / linkedTotal < ON_TRACK_PROGRESS) return { label, tone: 'soon' }
  return { label, tone: 'neutral' }
}
