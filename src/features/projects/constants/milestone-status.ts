import type { MilestoneStatus } from '../types/milestone.types'

/** Statuses a milestone can be moved to — `Draft` is the initial state only, nothing transitions back to it. */
export type MilestoneAction = Exclude<MilestoneStatus, 'Draft'>

export const MILESTONE_TRANSITIONS: Record<MilestoneStatus, MilestoneAction[]> = {
  Draft:     ['Active', 'Archived'],
  Active:    ['OnHold', 'Completed', 'Archived'],
  OnHold:    ['Active', 'Archived'],
  Completed: ['Archived'],
  Archived:  [],
}

export function getAllowedMilestoneTransitions(status: MilestoneStatus): MilestoneAction[] {
  return MILESTONE_TRANSITIONS[status]
}

/**
 * Statuses whose fields (name, description, color, target dates) the backend still accepts an update
 * for. `Completed` and `Archived` are frozen — `PUT /v1/flowboard/milestones/:id` answers 403/409 —
 * but a `Completed` milestone can still be archived, so this is narrower than having any transition
 * left and the two rules stay separate.
 */
export const MILESTONE_EDITABLE_STATUSES: MilestoneStatus[] = ['Draft', 'Active', 'OnHold']

export function isMilestoneEditable(status: MilestoneStatus): boolean {
  return MILESTONE_EDITABLE_STATUSES.includes(status)
}

export const MILESTONE_STATUS_BADGE: Record<MilestoneStatus, { label: string; className: string; dotClass: string }> = {
  Draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-500',    dotClass: 'bg-slate-400' },
  Active:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-600', dotClass: 'bg-emerald-500' },
  OnHold:    { label: 'On hold',   className: 'bg-amber-50 text-amber-600',     dotClass: 'bg-amber-500' },
  Completed: { label: 'Completed', className: 'bg-blue-50 text-blue-600',       dotClass: 'bg-blue-500' },
  Archived:  { label: 'Archived',  className: 'bg-muted text-muted-foreground', dotClass: 'bg-muted-foreground' },
}

/** Listing order: in-flight milestones first, terminal ones last. */
export const MILESTONE_STATUS_ORDER: MilestoneStatus[] = ['Active', 'OnHold', 'Draft', 'Completed', 'Archived']
