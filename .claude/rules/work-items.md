---
paths:
  - "src/features/work-items/**"
---

# Work items feature

## Dates

- **`estimatedCompletionDate`** is date-only (`YYYY-MM-DD`). It goes through `DatePicker` with `minDate={startOfToday()}` in both `WorkItemSidebar` and `CreateWorkItemModal`.
- **Every other date** (`createdOnUtc`, `updatedOnUtc`, `completedOnUtc`, activity timestamps) is a UTC timestamp.
- Both shapes render with `formatDate` / `formatDateTime`.

## Detail and activity endpoints

`GET /v1/flowboard/work-items/:code` returns the scalars plus `tags` and `availableTransitions`, **not** the activity. The four activity collections live under the work item's **GUID** (`workItemId` from the detail), not its code:

```
GET /v1/flowboard/work-items/:workItemId/{comments|time-entries|state-history|change-logs}?page=&pageSize=
```

- All four return `PagedResult<T>`.
- `page` is 1-based; `pageSize` defaults to `ACTIVITY_PAGE_SIZE` (20).
- `page <= 0`, `pageSize <= 0` and `pageSize > 100` are **400** (no clamp), so never build a page below 1.
- A page past the end is **200 with `items: []`** and the real `totalCount`. `WorkItemActivitySections` uses that to fall back to the last page with rows.
- 404 = the item doesn't exist or the user isn't a member.
- **Newest-first.** Render as received; re-sorting would only order one page.

`WorkItemActivitySections` fetches each tab lazily: the hooks are `enabled` only while their tab is active and use `keepPreviousData`. The tabs carry no count badges, because the detail has no counters and fetching all four would undo the lazy loading.

## Comments (spec: `docs/specs/work-item-comments.spec.md`)

- **Writes:** `POST` / `PUT …/comments/:commentId` / `DELETE` (soft) all answer **202 with no body**, already persisted.
- **Add isn't optimistic:** the new id isn't returned, so it refetches and jumps to page 1.
- **Edit and delete are optimistic:** they patch every cached page and roll back on error. A 404 means the comment was already deleted, so they toast without "reverted".
- **Board counter:** add and delete invalidate the board (`commentCount`); edit doesn't.
- **Who can edit:** only the author (`authorId === user.id`), and only when `canComment`. A `Cancelled` work item still takes comments.
- **Avatars:** use the API's `authorInitials`, never initials derived from `authorFullName`.

## Viewer role (spec: `docs/specs/viewer-read-only-work-items.spec.md`)

- **Read-only except comments.** The backend answers **403** `WorkItem.ViewerCannotModify` to every work-item write from a project `Viewer` (create, field edits, move, assign/unassign, tags, time entries); comments stay open. `ProjectBoardPage` folds `isProjectViewer` into `canEdit`, so the detail renders read-only.
- **Never an assignee.** Assigning to a Viewer is **400** `WorkItem.AssigneeIsViewer`. `AssigneeSelect` drops Viewers from its options but still labels a current Viewer assignee (members keep their assignments when re-added as Viewer).
- **Stale roles:** on a 403/400, `useOptimisticWorkItemMutation` and `useCreateWorkItem` also invalidate the project detail (`mayBeStaleProjectRole`), so the UI catches up with a role that changed under it.

## Mutations

Every work-item mutation writes a change-log entry, so every mutation hook is built on `useOptimisticWorkItemMutation`. It invalidates the activity prefix, the detail and the board; without that, the Change Log and State History tabs go stale. Inactive tabs refetch when reopened. The board's drag-and-drop move (`useMoveBoardWorkItem`) takes the work item per call, so it builds on the same `workItemPatches` / `workItemInvalidations` helpers instead.

## Fields

- **Estimated points:** must be > 0 (the backend's `GreaterThan(0)`, on create and update) and at most `ESTIMATED_POINTS_MAX_DIGITS` (5) digits. Both `CreateWorkItemModal` and the sidebar editor feed input through `sanitizeEstimatedPoints`. It's a text input with `inputMode="numeric"`: a `type="number"` ignores `maxLength` and lets `0`, `1e5` and `-3` through.
- **Editors inside the detail modal:** an editor that handles Escape must `stopPropagation()`, or Escape also closes the work-item Dialog (`InlineEditText`, the comment editor and the sidebar points editor all do).
- **Limits:** `WORK_ITEM_TITLE_MAX_LENGTH` (200) and `WORK_ITEM_DESCRIPTION_MAX_LENGTH` (4000) in `constants/work-item-display.ts`, shared by the create modal and `InlineEditText`.
