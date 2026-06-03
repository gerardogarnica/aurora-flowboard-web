import type { FlowState, ProjectRole } from '../types/project.types'

export const PROJECT_ROLES: ProjectRole[] = ['Admin', 'Analyst', 'Developer', 'QA', 'Support']

export const MAX_ACTIVE_STATES = 10

function makeState(
  name: string,
  category: FlowState['category'],
  color: string,
  roles: ProjectRole[],
): FlowState {
  return { id: crypto.randomUUID(), name, category, color, roles }
}

export function getDefaultFlowStates(): FlowState[] {
  return [
    makeState('Open', 'Active', 'navy', ['Admin', 'Analyst']),
    makeState('In Progress', 'Active', 'orange', [...PROJECT_ROLES]),
    makeState('Testing', 'Active', 'cyan', [...PROJECT_ROLES]),
    makeState('Done', 'Completed', 'green', [...PROJECT_ROLES]),
    makeState('Cancelled', 'Cancelled', 'slate', ['Admin', 'Analyst']),
  ]
}
