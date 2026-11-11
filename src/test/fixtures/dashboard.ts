import type { DashboardResponse, PortfolioProject } from '@/features/dashboard/types/dashboard.types'
import type { WorkItemListItem } from '@/features/work-items/types/work-item.types'
import type { PagedResult } from '@/shared/types/paged-result.types'

const DAY_MS = 24 * 60 * 60 * 1000

/** The UTC timestamp of `days` full days ago. */
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS - 60_000).toISOString()
}

export function makeListItem(overrides: Partial<WorkItemListItem> = {}): WorkItemListItem {
  return {
    workItemId: 'wi-1',
    code: 'PAY-142',
    title: 'Refund webhook drops events on retry',
    type: 'Bug',
    priority: 'High',
    projectId: 'p1',
    projectName: 'Payments Platform',
    projectColor: 'red',
    flowStateId: 'review',
    flowStateName: 'Code Review',
    stage: 'InFlight',
    enteredCurrentStateOnUtc: daysAgo(9),
    assigneeId: 'u1',
    assigneeInitials: 'AS',
    assigneeFullName: 'Ana Silva',
    milestoneName: null,
    milestoneColor: null,
    ...overrides,
  }
}

export function makePage<T>(items: T[], overrides: Partial<PagedResult<T>> = {}): PagedResult<T> {
  return { items, page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length > 0 ? 1 : 0, ...overrides }
}

export function makePortfolioProject(overrides: Partial<PortfolioProject> = {}): PortfolioProject {
  return {
    projectId: 'p1',
    name: 'Payments Platform',
    color: 'red',
    kind: 'Product',
    status: 'Active',
    open: 3,
    stalled: 1,
    distribution: [
      { flowStateId: 'backlog', name: 'Backlog', color: 'slate', count: 1 },
      { flowStateId: 'doing', name: 'In Progress', color: 'blue', count: 2 },
      { flowStateId: 'review', name: 'Code Review', color: 'violet', count: 0 },
    ],
    activeMilestone: null,
    members: [{ userId: 'u1', fullName: 'Ana Silva', initials: 'AS' }],
    ...overrides,
  }
}

export function makeDashboard(overrides: Partial<DashboardResponse> = {}): DashboardResponse {
  return {
    me: { open: 7, stalled: 1, inFlight: 3, criticalHigh: 2 },
    team: { stalled: 5, unassigned: 8, closedLast7Days: 12 },
    aging: {
      buckets: [
        { from: 0, to: 3, count: 6 },
        { from: 4, to: 6, count: 4 },
        { from: 7, to: 13, count: 3 },
        { from: 14, to: null, count: 2 },
      ],
      oldestInFlight: {
        code: 'MKT-31',
        title: 'Old thing',
        projectId: 'p2',
        projectName: 'Marketing Web',
        enteredCurrentStateOnUtc: daysAgo(18),
      },
    },
    milestones: [],
    portfolio: [makePortfolioProject()],
    ...overrides,
  }
}
