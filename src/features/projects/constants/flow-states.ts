import type { ProjectRole } from '../types/project.types'

export const PROJECT_ROLES: ProjectRole[] = ['Admin', 'Analyst', 'Developer', 'QA', 'Viewer']

// Roles that can be allowed to move work items into a flow state. Viewer is read-only.
export const FLOW_STATE_ROLES: ProjectRole[] = PROJECT_ROLES.filter((role) => role !== 'Viewer')

export const MAX_ACTIVE_STATES = 10
