/**
 * Every React Query key in the app. Build keys only through here — a hand-typed key with a
 * typo doesn't fail, it just silently stops matching what it should invalidate.
 *
 * Invalidation matches by prefix, so the shapes below are load-bearing:
 * - `projects.boards()` / `workItems.all()` are the prefixes of every board / every work-item
 *   detail — invalidating them refreshes all of them at once.
 * - `workItems.activity(id)` is the prefix of all four activity tabs and every page of each,
 *   which is how one call after a mutation refreshes Comments, Time Entries, State History and
 *   Change Log together.
 * - `projects.list()` (`'projects'`) and `projects.detail(id)` (`'project'`) are different
 *   roots on purpose: invalidating the list does not touch any detail, and vice versa.
 */

export type WorkItemActivityResource = 'comments' | 'time-entries' | 'state-history' | 'change-logs'

export const queryKeys = {
  /** `GET /users/my-summary` — feeds the Sidebar (projects, counters) and the top bar's bell. */
  mySummary: () => ['my-summary'] as const,
  profile: () => ['profile', 'me'] as const,
  users: () => ['users'] as const,

  projects: {
    list: () => ['projects'] as const,
    detail: (projectId: string) => ['project', projectId] as const,
    boards: () => ['project-board'] as const,
    board: (projectId: string) => ['project-board', projectId] as const,
    components: (projectId: string) => ['project-components', projectId] as const,
    milestones: (projectId: string) => ['project-milestones', projectId] as const,
  },

  workItems: {
    all: () => ['work-item'] as const,
    /** Keyed by the work item's code (`TST-12`), like `GET /work-items/:code`. */
    detail: (code: string) => ['work-item', code] as const,
    /** Keyed by the work item's GUID, like the activity sub-endpoints. */
    activity: (workItemId: string) => ['work-item-activity', workItemId] as const,
    activityResource: (workItemId: string, resource: WorkItemActivityResource) =>
      ['work-item-activity', workItemId, resource] as const,
    activityPage: (workItemId: string, resource: WorkItemActivityResource, page: number) =>
      ['work-item-activity', workItemId, resource, page] as const,
  },
}
