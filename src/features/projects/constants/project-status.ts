import type { ProjectApiStatus } from '../types/project.types'

export const ALLOWED_TRANSITIONS: Record<ProjectApiStatus, ProjectApiStatus[]> = {
  Active:      ['Maintenance', 'Completed', 'Archived'],
  Maintenance: ['Active', 'Archived'],
  Completed:   ['Archived'],
  Archived:    [],
}
