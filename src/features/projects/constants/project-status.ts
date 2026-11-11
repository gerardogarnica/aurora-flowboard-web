import type { ProjectApiStatus, ProjectKind } from '../types/project.types'

const OPERATIONAL_TRANSITIONS: Record<ProjectApiStatus, ProjectApiStatus[]> = {
  Active:      ['Maintenance', 'Archived'],
  Maintenance: ['Active', 'Archived'],
  Completed:   [],
  Archived:    [],
}

const LIFECYCLE_TRANSITIONS: Record<ProjectApiStatus, ProjectApiStatus[]> = {
  Active:      ['Completed', 'Archived'],
  Maintenance: [],
  Completed:   ['Archived'],
  Archived:    [],
}

export const ALLOWED_TRANSITIONS_BY_KIND: Record<ProjectKind, Record<ProjectApiStatus, ProjectApiStatus[]>> = {
  Product:  OPERATIONAL_TRANSITIONS,
  Internal: OPERATIONAL_TRANSITIONS,
  Client:   LIFECYCLE_TRANSITIONS,
  Research: LIFECYCLE_TRANSITIONS,
}

export function getAllowedTransitions(kind: ProjectKind, status: ProjectApiStatus): ProjectApiStatus[] {
  return ALLOWED_TRANSITIONS_BY_KIND[kind]?.[status] ?? []
}

const OPEN_WORK_STATUSES: ProjectApiStatus[] = ['Active', 'Maintenance']
const CLOSING_STATUSES: ProjectApiStatus[] = ['Completed', 'Archived']

/**
 * Leaving Active or Maintenance for Completed or Archived needs every work item closed first; the
 * backend answers 400 `Project.CannotCloseWithOpenWorkItems` otherwise. Completed → Archived stays
 * allowed with open items.
 */
export function isBlockedByOpenWorkItems(
  from: ProjectApiStatus,
  to: ProjectApiStatus,
  openWorkItems: number,
): boolean {
  return openWorkItems > 0 && OPEN_WORK_STATUSES.includes(from) && CLOSING_STATUSES.includes(to)
}
