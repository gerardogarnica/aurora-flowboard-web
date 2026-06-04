import type { ProjectApiStatus } from '../types/project.types'

export const ALLOWED_TRANSITIONS: Record<ProjectApiStatus, ProjectApiStatus[]> = {
  Draft:     ['Active', 'Archived'],
  Active:    ['OnHold', 'Completed', 'Archived'],
  OnHold:    ['Active', 'Archived'],
  Completed: ['Archived'],
  Archived:  [],
}
