import type { ProjectBoardColumn, ProjectBoardWorkItem } from '@/features/projects/types/project.types'

let sequence = 0

export function makeBoardItem(overrides: Partial<ProjectBoardWorkItem> = {}): ProjectBoardWorkItem {
  sequence += 1
  return {
    workItemId: `wi-${sequence}`,
    title: `Work item ${sequence}`,
    code: `TST-${sequence}`,
    type: 'Story',
    priority: 'Medium',
    flowStateId: 'todo',
    flowStateName: 'To Do',
    assigneeId: null,
    assigneeInitials: null,
    assigneeFullName: null,
    component: null,
    milestoneName: null,
    milestoneColor: null,
    estimatedPoints: null,
    estimatedCompletionDate: null,
    createdOnUtc: '2026-09-01T12:00:00Z',
    commentCount: 0,
    timeEntryCount: 0,
    ...overrides,
  }
}

/** A column whose items carry its `flowStateId` / `flowStateName`, as the API sends them. */
export function makeColumn(
  flowStateId: string,
  workItems: ProjectBoardWorkItem[] = [],
  overrides: Partial<ProjectBoardColumn> = {},
): ProjectBoardColumn {
  const flowStateName = overrides.flowStateName ?? flowStateId
  return {
    flowStateId,
    flowStateName,
    category: 'Active',
    sortOrder: 0,
    color: '#64748b',
    workItems: workItems.map((wi) => ({ ...wi, flowStateId, flowStateName })),
    ...overrides,
  }
}
