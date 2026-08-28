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
  return ALLOWED_TRANSITIONS_BY_KIND[kind][status]
}
