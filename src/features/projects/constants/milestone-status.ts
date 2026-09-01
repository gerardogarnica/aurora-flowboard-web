import type { MilestoneStatus } from '../types/project.types'

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

export const MILESTONE_STATUS_BADGE: Record<MilestoneStatus, { label: string; className: string; dotClass: string }> = {
  Draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-500',    dotClass: 'bg-slate-400' },
  Active:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-600', dotClass: 'bg-emerald-500' },
  OnHold:    { label: 'On hold',   className: 'bg-amber-50 text-amber-600',     dotClass: 'bg-amber-500' },
  Completed: { label: 'Completed', className: 'bg-blue-50 text-blue-600',       dotClass: 'bg-blue-500' },
  Archived:  { label: 'Archived',  className: 'bg-muted text-muted-foreground', dotClass: 'bg-muted-foreground' },
}

/** Listing order: in-flight milestones first, terminal ones last. */
export const MILESTONE_STATUS_ORDER: MilestoneStatus[] = ['Active', 'OnHold', 'Draft', 'Completed', 'Archived']
