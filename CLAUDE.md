# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager

Use **pnpm** for all dependency management. Do not use npm or yarn.

```bash
pnpm install
pnpm add <package>
pnpm add -D <package>
```

`pnpm-lock.yaml` is the only lockfile; don't commit a `package-lock.json` or `yarn.lock`. CI and the `Dockerfile` run `pnpm install --frozen-lockfile`, so a `package.json` change must ship with its updated lockfile in the same commit.

**dependencies vs devDependencies** — `dependencies` holds only what ends up in the browser bundle. Build-time tooling goes in `devDependencies`: `vite`, `tailwindcss`, `@tailwindcss/vite`, `shadcn` and `tslib`. The build still gets them because the `Dockerfile` installs without `--prod`, and `pnpm audit --prod` stays a clean check of what actually ships. `shadcn` is more than the CLI: `src/index.css` does `@import "shadcn/tailwind.css"`, so it's a build input. It's held at **4.7.0**, the same version as the CLI below. A newer `shadcn` package changes that stylesheet (4.21 adds `scroll-fade-*` / `shimmer` utilities and their `@property` rules), so bump it on purpose, not as a side effect of `pnpm add`.

## Commands

```bash
pnpm dev        # dev server at http://localhost:5173
pnpm build      # tsc -b + vite build
pnpm lint       # eslint
pnpm preview    # preview production build
```

## Adding shadcn components

```bash
npx shadcn@4.7.0 add <component>
```

> `tslib` must be installed (a devDependency, `pnpm add -D tslib`) for shadcn 4.7.0 to work — it's a required peer dependency of `recast`.

## Architecture

`main.tsx` mounts `<AppProviders>` (QueryClientProvider + `<Toaster>` from sonner) wrapping `<RouterProvider>`.

`AppProviders` also owns the **viewport column**: a `flex flex-col h-screen` wrapper whose first row is `<EnvironmentRibbon />` (rendered only when `IS_NON_PRODUCTION`) and whose second row (`flex-1 min-h-0 overflow-y-auto`) holds the router. Because the ribbon takes 24px off the top, the app shell no longer owns the full screen height — `ProtectedLayout`, `Sidebar` and `LoginPage` size against `h-full` / `min-h-full`, **not** `h-screen`. Do not reintroduce `h-screen` below `AppProviders`; it would push the shell past the viewport whenever the ribbon is present.

**Routing** (`src/app/router/`) uses `createBrowserRouter`. All authenticated routes live under `ProtectedLayout`, which reads `isAuthenticated` from the Zustand auth store and redirects to `/login` if false.

| Route | Component |
|---|---|
| `/login` | `LoginPage` |
| `/dashboard` | `DashboardPage` |
| `/projects` | `ProjectsPage` |
| `/projects/:id` | `ProjectBoardPage` |
| `/work-items` | `WorkItemsPage` |

**State** (`src/app/store/`) — Zustand only. Auth state (`user`, `isAuthenticated`) lives in `auth.store.ts`. The `logout()` action clears `aurora_access_token` from localStorage.

**Permissions** — two independent roles, mirroring the backend:
- **Workspace role** (`UserRole` = `Administrator | Member`, `src/shared/types/user-role.types.ts`) on `user.role`. Read it through `useIsAdministrator()` (`features/auth/hooks/`), never by comparing the string inline. It gates creating projects (`POST /projects` requires the role: Sidebar "+", Projects page header, empty state and new-project card) and managing people.
- **Project role** (`ProjectRole`, `Admin` among others) on the project's `members`. Check it with `hasProjectAdminRole(members, userId)` (`features/projects/utils/project-permissions.ts`). The backend gates every project-level write on it (status, members, details, components, milestones). The workspace `Administrator` role alone is **not** enough, so the Projects page status menu shows only on cards where the user is a project `Admin`; elsewhere it's a plain badge.

The store's `user` is written at login and persisted, so `ProtectedLayout`'s authenticated shell (`AppShell`) runs `useSyncAuthUser()`: whenever `my-summary` loads or refetches, the stored user is refreshed from `me` (`toAuthUser` in `features/auth/utils/auth-user.ts`, shared with `useLogin`). A role change made by an administrator therefore reaches an open session without a re-login. The hook only updates an existing session and never recreates one after logout.

**HTTP** (`src/shared/lib/api-client.ts`) — `apiFetch<T>` wrapper around native `fetch`, reading `VITE_API_BASE_URL`. Injects JWT from `localStorage("aurora_access_token")`. Throws `ApiError` (with `.status`) on non-ok responses.

On a **401** it refreshes the token once (`POST /v1/flowboard/auth/refresh-token`, single-flight: concurrent 401s share one refresh) and retries the request; a second 401 on the retry ends the session. Only **400 / 401 / 403 from the refresh endpoint** end it — the backend answers **403** (`Auth.InvalidRefreshToken`) for an invalid or expired refresh token, 400 for a missing one (`SESSION_ENDED_STATUSES`). A 5xx, a 429 or a network error during the refresh is transient: the tokens stay, the error propagates to the caller, and the next request tries the refresh again — never log out on those. Wrong credentials on login and change-password come back as **403**, not 401, so they surface in their form instead of triggering a refresh.

When the session ends, `redirectToLogin` clears the tokens and does a full reload to `/login?returnTo=<path+search+hash>`; `ProtectedLayout` builds the same URL when there's no session. The helpers live in `src/shared/lib/return-to.ts`: `buildLoginPath(target)` (omits `returnTo` for `/`, `/dashboard` and `/login*`) and `getSafeReturnTo(raw)`, which only lets same-origin paths through (rejects `//host`, `/\host`, absolute URLs and anything the URL parser normalizes to another origin) — the param is attacker-controlled, so always go through it. `LoginPage` is the **only** place that redirects after sign-in (`<Navigate>` to the safe `returnTo`, else `/dashboard`); `useLogin` deliberately doesn't navigate, so there are never two redirects racing.

**Features** (`src/features/`) — one folder per domain (`auth`, `dashboard`, `people`, `profile`, `projects`, `template-flows`, `work-items`), each with `components/`, `hooks/`, `services/`, `types/`.

**One file per REST resource inside `services/` and `types/`** — not one file per feature. A feature that talks to a single resource keeps a single `<feature>.service.ts` / `<feature>.types.ts`; a feature that owns several resources gets one file per resource, named after the resource in the singular:

```
features/projects/
  services/  project.service.ts  component.service.ts  milestone.service.ts
  types/     project.types.ts    component.types.ts    milestone.types.ts
```

The trigger is a **distinct resource with its own endpoints and lifecycle** (components and milestones each have their own CRUD plus status verbs), not file size and not the number of operations. `work-items` keeps one service because every function acts on `/v1/flowboard/work-items` — splitting by verb is not this convention. Sub-collections that live under a parent's path and have no lifecycle of their own (`WorkItemComment`, `WorkItemTimeEntry`, `WorkItemStateTransition`, `WorkItemChangeLog` — read-only pages under `/v1/flowboard/work-items/:id/...`) stay in the parent resource's service and types files.

Import each resource from its own file (`../types/milestone.types`, `../services/milestone.service`). Do not add a barrel `index.ts` that re-exports them — it would keep every consumer coupled to every resource and make the split cosmetic.

**Shared components** (`src/shared/components/`) — reusable UI primitives not tied to a feature. Currently: `PageHeader` (title + optional subtitle + optional action button), `EnvironmentRibbon` (the non-production environment strip — see "Environment ribbon" below), `ColorSwatchGrid` (the `SWATCH_COLORS` palette as a controlled 10-column swatch grid with tooltips, `size` `md` | `sm`) and `DatePicker`. Every color picker renders `ColorSwatchGrid` — `CreateProjectModal` (project color inline, flow-state color inside its popover) and `ProjectDetailsModal` — so don't hand-roll another swatch grid.

`DatePicker` is the shadcn Popover + Calendar composition, and **every date field renders it — never `<input type="date">`**. It is controlled and string-based: `value` / `onChange` carry `YYYY-MM-DD` (`''` when empty), the same shape the API uses, so callers never handle `Date` objects. The trigger shows `formatDate`; `minDate` disables earlier days (`startOfToday()` for fields that can't be in the past); a Clear button empties the value (`clearable`, default `true`); the calendar is `required`, so re-clicking the selected day doesn't clear it by accident. `id` lands on the trigger button so a `<Label htmlFor>` still targets it. Current users: `MilestoneFormModal` (start/end, end's `minDate` is the start), `CreateWorkItemModal` and `WorkItemSidebar` (completion date, `minDate` today; the sidebar uses `defaultOpen` + `onOpenChange` like its Selects).

`InlineEditText` is the one click-to-edit text field — work-item title and description (`WorkItemDetailModal`) and component rename (`ProjectComponentsSection`) — so don't hand-roll another `isEditing` + `<p onClick>` pair. Read mode is a real `<button>` (Tab + Enter/Space), or plain text when `!canEdit`. Enter (single-line) / Ctrl/⌘+Enter (`multiline`) and blur commit, Escape cancels and `stopPropagation`s so it doesn't close a surrounding Dialog. Pass `onCommit={(v) => mutation.mutateAsync(v)}`: if the promise rejects, the editor reopens with what the user typed. `maxLength` is a hard input limit single-line; multiline it never blocks typing — over the limit the counter turns red and saving is refused, keeping the editor open. Limits live next to their feature (`WORK_ITEM_TITLE_MAX_LENGTH` 200 / `WORK_ITEM_DESCRIPTION_MAX_LENGTH` 4000 in `work-items/constants/work-item-display.ts`, `COMPONENT_NAME_MAX_LENGTH` 50 in `projects/constants/component-limits.ts`) and the create modals use the same constants. Two non-obvious details: focus returns to the button from its ref callback during React's commit — later (a `requestAnimationFrame`) loses to Base UI's Dialog focus manager, which grabs focus for the dialog container in a microtask; and the "Edit …" hint is a `hidden` element wired through `aria-describedby`, because visible-to-AT text inside a `DialogTitle` would leak into the dialog's accessible name.

**List states** — `EmptyState` (icon / title / description / optional action), `ErrorState` (title, `onRetry` = the query's `refetch`, `role="alert"`) and `DataTable` (the bordered admin-table shell: eyebrow header row from `columns`, then exactly one of skeleton rows, `error`, `empty` or the rows) live in `src/shared/components/`. Components, Milestones and People use `DataTable`; every query-backed screen renders `ErrorState` on `isError` — never let a failed query look like an empty screen. The project board treats a **404 or 403** on the project detail or the board as "Project not found" (whole page, link back to `/projects`; the backend answers 404 for an unknown or malformed id), and any other failure as an `ErrorState` that refetches both. The Projects page distinguishes load error, no projects at all (admins get a create action) and every project hidden by the status filters ("Show all statuses").

**Shared interaction primitives** (`src/shared/components/`):
- `ConfirmDialog` — every yes/no confirm (project and milestone status, retire component, remove member, demote role, delete comment). Forced Cancel/Confirm (no close X), `variant="destructive"` for removals; pass `isPending` + `pendingLabel` only for confirms that wait for the server — it then disables both buttons and blocks dismissal. Don't hand-roll another `Dialog showCloseButton={false}`.
- `UserAvatar` / `UnassignedAvatar` — every avatar of a known user, colored by a hash of `userId` (`MEMBER_BG` in `shared/constants/avatar-colors.ts`), sizes `sm` 24 / `md` 28 / `lg` 40. Never draw a neutral or differently-colored circle for a person.
- `UnderlineTabs` + `UnderlineTabsPanel` — client-side tabs on Base UI Tabs (arrow keys / Home / End move focus, Enter/Space selects — manual activation, so lazily-fetched tabs only load when chosen). Inactive panels unmount unless `keepMounted` (ProjectDetailsModal keeps them to preserve an unsaved General draft). Routed tabs stay `RouteTabs`; both share the class recipe in `underline-tab-classes.ts`, which lives apart because the react-refresh lint rule forbids non-component exports from a `.tsx`.
- **Clickable cards** keep their whole-card `onClick` for the pointer, but the keyboard and screen readers reach them through a real control inside: the project card's name is a `<Link>` (so open-in-new-tab works too), the work-item card's title is a `<button>`. Both `stopPropagation` so the card's own handler doesn't fire a second time (a duplicate history entry), and the card shows a ring via `has-[a:focus-visible]` / `has-[button:focus-visible]`. Don't turn a card with controls inside it into one big button — nested interactive elements.

The query client (`shared/lib/query-client.ts`) **never retries a 4xx** — a 404/403 is an answer, and retrying it only delays the not-found state — and retries other failures once. React Query pauses retries while the tab is hidden, so a failure in a background tab only reaches its error state once the tab is visible again.

**Shared constants** (`src/shared/constants/`) — cross-feature constants. Currently: `colors.ts` exports `SWATCH_COLORS` (color name → hex map) and `resolveSwatchColor(key)`; used for project colors, work-item flow-state colors, and other color-swatch pickers. `password-rules.ts` exports `PASSWORD_RULES` (id/label/test tuples), `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`; used by password-change and user-creation forms (`profile`, `people` features) for both zod validation and the live rule checklist UI. `platform.ts` exports `IS_MAC`, `SUBMIT_SHORTCUT_LABEL` (`⌘ ↵` / `Ctrl ↵`, shown next to submit buttons) and `isSubmitShortcut(e)`, the matching Ctrl/⌘+Enter detector — the label and the detector live together so the shortcut can't drift between what's shown and what's handled.

**Shared lib** (`src/shared/lib/`) — framework-agnostic helpers. `api-client.ts` (above), `query-client.ts`, and `date-format.ts`, which exports the app's two date formatters: `formatDate` (`Sep 5, 2026`) and `formatDateTime` (`Sep 5, 2026, 3:07 PM`). Both accept either a UTC timestamp or a bare `YYYY-MM-DD` — the shared `parse` helper splits a date-only string by hand, because `new Date('2026-08-31')` reads as UTC midnight and renders the previous day in negative-offset timezones. Callers never have to pick a variant. Import these instead of redefining a local copy — four identical copies had already drifted into feature components before they were consolidated here. The same file holds the date-only conversions `DatePicker` relies on: `parseDateOnly` (`YYYY-MM-DD` → local-midnight `Date`, `''` → `undefined`), `toDateOnly` (`Date` → local `YYYY-MM-DD` — never `toISOString()`, which shifts to UTC) and `startOfToday()`.

**Query keys** (`src/shared/lib/query-keys.ts`) — every React Query key comes from the `queryKeys` factory: `mySummary()`, `profile()`, `users()`, `projects.{list, detail, boards, board, components, milestones}`, `workItems.{all, detail, activity, activityResource, activityPage}`. **Never type a key as a literal array** — a typo doesn't fail, it just silently stops matching what it should invalidate. The factory returns exactly the arrays the app used before it existed (`['project-board', id]`, …), and the shapes are load-bearing because invalidation matches by prefix: `projects.boards()` / `workItems.all()` cover every board / every work-item detail, `workItems.activity(id)` covers all four activity tabs and all their pages, and `projects.list()` (`'projects'`) and `projects.detail(id)` (`'project'`) are separate roots on purpose. A new query gets a new entry there, next to the keys it has to line up with.

**Optimistic mutations** (`src/shared/hooks/useOptimisticMutation.ts`) — every optimistic mutation goes through `useOptimisticMutation({ mutationFn, patches, invalidate, errorMessage? })`; don't hand-roll the cancel → snapshot → patch → rollback → toast → invalidate cycle again (seventeen hooks did, before it existed). `patches(vars)` returns one `cachePatch<T>(queryKey, (old) => …)` per cache to update — `useUpdateProject` patches two (detail + list). A query that **isn't cached yet is skipped, never seeded**: patching `undefined` as `[]` used to make the Projects grid flash empty after editing a project from the board, with nothing to roll back. On error it restores every snapshot and toasts `<ApiError message, else errorMessage> — changes reverted`; `invalidate(vars)` returns `InvalidateQueryFilters[]` and runs on settle, success or error. Work items have a domain wrapper on top, `useOptimisticWorkItemMutation` (`features/work-items/hooks/`): `patchDetail` / `patchCard` (the two shapes differ — the card has `component`, the detail `componentName`), `moveToState` to relocate the card, `alsoInvalidate` for counters; omit `projectId` when the change never shows on a card (description) and the board is neither patched nor refetched.

**Shared types** (`src/shared/types/`) — cross-feature types. Currently: `paged-result.types.ts` exports `PagedResult<T>` (`items`, `page`, `pageSize`, `totalCount`, `totalPages`), the envelope every paginated collection endpoint returns.

**Path alias** — `@/` maps to `src/`. Configured in `tsconfig.app.json` and `vite.config.ts`.

## Projects feature

The most developed feature domain. Key files:

| File | Purpose |
|---|---|
| `types/project.types.ts` | `Project`, `ProjectApiStatus`, `ProjectKind`, `ProjectRole`, `CreateProjectRequest`, flow types, `ProjectBoardColumn`, `ProjectBoardWorkItem` |
| `types/component.types.ts` | `ProjectComponent`, `ProjectComponentStatus`, `CreateComponentRequest`, `RenameComponentRequest` |
| `types/milestone.types.ts` | `ProjectMilestone`, `MilestoneStatus`, `MilestoneRequest` |
| `constants/project-status.ts` | `getAllowedTransitions(kind, status)` — valid status changes, kind-dependent |
| `constants/milestone-status.ts` | `getAllowedMilestoneTransitions(status)`, `MILESTONE_STATUS_BADGE`, `MILESTONE_STATUS_ORDER` |
| `constants/flow-states.ts` | Default flow states used in project creation |
| `services/project.service.ts` | `getProjects`, `getProjectById`, `getProjectBoard`, `createProject`, `updateProjectStatus`, `addProjectMember`, `removeProjectMember` |
| `services/component.service.ts` | `getComponentsByProject`, `createComponent`, `renameComponent`, `retireComponent` |
| `services/milestone.service.ts` | `getMilestonesByProject`, `createMilestone`, `updateMilestone`, `updateMilestoneStatus` |
| `hooks/useProjects.ts` | React Query — query key `['projects']` |
| `hooks/useCreateProject.ts` | Mutation — invalidates `['projects']` on success |
| `hooks/useProjectBoard.ts` | React Query — query key `['project-board', id]` |
| `hooks/useUpdateProjectStatus.ts` | Mutation with optimistic update + rollback; toasts on error |
| `hooks/useProjectComponents.ts` | React Query — query key `['project-components', projectId]` |
| `hooks/useProjectMilestones.ts` | React Query — query key `['project-milestones', projectId]` |
| `hooks/useCreateMilestone.ts` / `useUpdateMilestone.ts` / `useUpdateMilestoneStatus.ts` | Mutations on `['project-milestones', projectId]`; the last two are optimistic with rollback |

**Board grouping** (spec: `docs/specs/board-grouping.spec.md`) — the Board tab has a **Group by** select (`BoardGroupByControl`) on the right of the tab row: `None` / `Assignee` / `Type` / `Milestone` / `Component`. The choice lives in `?groupBy=` (`BOARD_GROUP_BY_PARAM`, parsed by `parseBoardGroupBy` in `constants/board-group-by.ts`; absent or unknown → `none`) and is written with `replace: true`, preserving `?selected=`. `None` renders the original columns untouched; anything else renders `BoardSwimlanes`: column headers once (sticky — so the board container becomes `overflow-auto`, x and y on the same element) and one collapsible lane per group (Base UI `Accordion`, `multiple`, controlled). Grouping is pure client-side over the board payload — `utils/group-board-items.ts` (`groupBoardItems`). The board only carries milestone/component **names**, so those are the group keys. Only groups with items appear, plus a trailing `Unassigned` / `No milestone` / `No component` bucket. Order: Assignee → current user first ("(you)"), then A→Z; Type → `WORK_ITEM_TYPE_CONFIG` order; Milestone → `targetStartDate` from `useProjectMilestones` (called with `enabled` only while grouping by milestone), A→Z until it loads; Component → A→Z. Lanes start open; the page tracks only the **collapsed** keys, reset on every groupBy change, so newly appearing groups arrive expanded. A collapsed lane shows a *flow strip* — one segment per flow state with items, sized by count, in the state's color. Both views share the card (`components/WorkItemCard.tsx`) and the column heading (`components/FlowStateHeading.tsx`, which also exports the `CountPill` used on lane headers).

**Status transitions** (`getAllowedTransitions(kind, status)`) — depend on the project's `kind`:
- `Product` / `Internal` (operational): `Active` → Maintenance, Archived · `Maintenance` → Active, Archived · `Completed`/`Archived` → (none)
- `Client` / `Research` (lifecycle): `Active` → Completed, Archived · `Completed` → Archived · `Maintenance`/`Archived` → (none)

Each status maps to a REST action verb: `activate`, `maintenance`, `complete`, `archive` — called as `PATCH /v1/flowboard/projects/:id/:action`.

**Milestones** — a time-boxed initiative within one project (`name`, `description`, `targetStartDate`, `targetEndDate`, `status`). Surfaced as the `Milestones` tab of `ProjectBoardPage` via `ProjectMilestonesSection`; create/edit share `MilestoneFormModal` (react-hook-form + `schemas/milestone.schema.ts`). `PUT /v1/flowboard/milestones/:id` replaces all four fields. Status transitions (`getAllowedMilestoneTransitions`): `Draft` → Active, Archived · `Active` → OnHold, Completed, Archived · `OnHold` → Active, Archived · `Completed` → Archived · `Archived` → (none), mapped to `activate` / `hold` / `complete` / `archive` on `PATCH /v1/flowboard/milestones/:id/:action`. Target dates are date-only strings (`YYYY-MM-DD`) — render them with `formatDate` from `@/shared/lib/date-format`, which handles that shape; a raw `new Date(value)` would parse as UTC midnight and show the previous day.

**Project flows** — a project's flow states are set **only** in the `POST /v1/flowboard/projects` payload, pre-filled from `GET /v1/flowboard/template-flows/:kind` (see `constants/flow-states.ts`). There is no way to edit them afterwards: the five `projects/:id/flow/...` administration endpoints were removed from the backend on 2026-09-05, and none are planned short or medium term. Flow states are read back two ways — the columns of `GET /v1/flowboard/projects/:projectId/board` and `availableTransitions` on `GET /v1/flowboard/work-items/:code`. The flow types in `types/project.types.ts` model those two reads, not a future editing UI; they stay for that reason. A project created with the wrong flow can only be corrected by direct SQL on the backend. Do not build flow-editing UI without confirming first — it would require a new backend slice.

**Sidebar** dynamically loads the user's summary via `useMySummary` (`src/features/auth/hooks/useMySummary.ts`, query key `queryKeys.mySummary()`, `GET /v1/flowboard/users/my-summary`) — not `useProjects`. It renders every project the endpoint returns, with no client-side status filter. Each entry renders a `GlowDot` styled by status. The "+" button opens `CreateProjectModal` and, like every "New project" entry point, renders only for workspace administrators. Mutations that change what the Sidebar displays must invalidate `queryKeys.mySummary()` in addition to their feature-local keys — the project list, name, color and status (`useCreateProject`, `useUpdateProject`, `useUpdateProjectStatus`, `useAddProjectMember`, `useRemoveProjectMember`) **and its counters**: "My Issues" moves with `useCreateWorkItem`, `useAssignWorkItem` and `useMoveWorkItem`. The same three plus project status change the open/closed counts on the Projects page cards, so `useCreateWorkItem` and `useMoveWorkItem` also invalidate `queryKeys.projects.list()`. `counts.members` is the sum of members across the user's own projects (verified against the backend), so creating a workspace user doesn't move it.

## Work items feature

`estimatedCompletionDate` is a date-only string (`YYYY-MM-DD`) — it round-trips through the shared `DatePicker` in both `WorkItemSidebar` and `CreateWorkItemModal`, which both block past dates (`minDate={startOfToday()}`). Every other work-item date (`createdOnUtc`, `updatedOnUtc`, `completedOnUtc`, and the activity timestamps) is a real UTC timestamp. Both shapes go through `formatDate` / `formatDateTime` from `@/shared/lib/date-format`.

`GET /v1/flowboard/work-items/:code` returns the scalars plus `tags` and `availableTransitions` — **not** the activity collections. Comments, time entries, state history and change logs each live behind their own paginated sub-endpoint:

```
GET /v1/flowboard/work-items/:workItemId/comments
GET /v1/flowboard/work-items/:workItemId/time-entries
GET /v1/flowboard/work-items/:workItemId/state-history
GET /v1/flowboard/work-items/:workItemId/change-logs
```

They are keyed by the work item's **GUID** (`workItemId` from the detail response), not its code — unlike `getWorkItem`, which takes the code. All four return `PagedResult<T>` and accept `?page=&pageSize=`:

- `page` is 1-based, `pageSize` defaults to 20 (`ACTIVITY_PAGE_SIZE` in `constants/work-item-display.ts`).
- `page <= 0`, `pageSize <= 0` and `pageSize > 100` are **400 ProblemDetails** — there is no silent clamp, so never build a page number below 1.
- A page past the end is **200 with `items: []`** and the real `totalCount`, not a 404. `WorkItemActivitySections` uses this to fall back to the last page that still has rows.
- 404 means the work item does not exist or the user is not a project member — same as the detail endpoint.
- **All four come back newest-first.** Render in the order received; do not re-sort client-side (that would only order the current page).

`WorkItemActivitySections` renders the four as tabs and fetches each one lazily — the hooks (`useWorkItemComments`, `useWorkItemTimeEntries`, `useWorkItemStateHistory`, `useWorkItemChangeLogs`) are `enabled` only while their tab is active, and use `keepPreviousData` so paging doesn't flash. Tab labels carry no count badge: the detail response has no per-collection counters and fetching four collections just to render numbers would undo the lazy loading.

**Comments are the one writable collection** (spec: `docs/specs/work-item-comments.spec.md`): `POST .../comments`, `PUT .../comments/:commentId`, `DELETE .../comments/:commentId` (soft delete), all answering **202 with no body**. The write is already persisted when the 202 arrives, so an immediate refetch sees it — but the new comment's id is not returned, so `useAddWorkItemComment` is not optimistic (it refetches and jumps to page 1), while `useUpdateWorkItemComment` / `useDeleteWorkItemComment` patch every cached comments page optimistically and roll back on error. Add and delete also invalidate `['project-board', projectId]` (the card's `commentCount`); edit doesn't. Only the author gets Edit/Delete (`authorId === user.id`), and only when `canComment` — computed in `ProjectBoardPage` as `canAddOrUpdateWorkItems` **and** project status `Active`/`Maintenance`. Unlike title/description, a `Cancelled` work item still takes comments. Avatars use the API's `authorInitials`; don't derive initials from `authorFullName`.

Query key is `queryKeys.workItems.activityPage(workItemId, resource, page)` (`['work-item-activity', workItemId, <resource>, page]`), sharing the `queryKeys.workItems.activity(workItemId)` prefix so one `invalidateQueries` call covers all four. **Every work-item mutation writes a change-log entry**, so all ten mutation hooks (`useAssignWorkItem`, `useMoveWorkItem`, `useUpdateWorkItem*`) are built on `useOptimisticWorkItemMutation`, which invalidates that prefix on settle alongside the detail and the board — otherwise the Change Log and State History tabs go stale. A new work-item mutation should use it too. Renaming a component or editing a milestone changes what cards and details show by name, so `useRenameComponent` and `useUpdateMilestone` also invalidate the project's board (`refetchType: 'all'`) and `queryKeys.workItems.all()`. Inactive tabs refetch when reopened rather than immediately.

## Environment ribbon

A 24px strip at the very top of the viewport marks the site as **non-production**. It is visible on every route including `/login`, is not dismissible, and carries no data beyond the environment name.

The environment comes from **`VITE_APP_ENV`** (`development | staging | production`), resolved at **build time** — the site ships as static files behind nginx, so there is nothing to read at runtime. `import.meta.env.MODE` cannot be used for this: `Dockerfile` runs `pnpm run build` for every environment, so MODE is `production` in staging too. CI passes the value as a Docker build-arg, reusing the `env_name` the *Resolve environment* step already computes (`main` → production, `staging` → staging).

An absent or unrecognized value resolves to `development` **on purpose** — a non-production site that forgets the variable should fail visibly, never silently pass itself off as production.

| File | Role |
|---|---|
| `src/shared/constants/app-env.ts` | `APP_ENV`, `IS_NON_PRODUCTION`, `ENV_RIBBON` (label / title prefix / aria label / colors per environment) |
| `src/shared/components/EnvironmentRibbon.tsx` | The strip itself; also prefixes `document.title` with `[STAGING]` / `[DEV]` |
| `src/app/providers/app-providers.tsx` | Mounts it behind `IS_NON_PRODUCTION` |

`IS_NON_PRODUCTION` is written as `import.meta.env.VITE_APP_ENV !== 'production'` rather than `APP_ENV !== 'production'` so Vite folds it to a literal `false` and rollup drops the component and its strings from the production bundle entirely. Keep it that way — deriving it from `APP_ENV` would leave the ribbon's markup and Spanish labels shipping to production.

Colors follow the design system: **amber** for staging (shared environment, caution), **violet** for development. Red is deliberately unused — it already means destructive/overdue. Aurora teal is unused too — the design system reserves it for atmosphere, never structural chrome. The leading dot reuses the sidebar's glow-dot shape.

## Security headers

nginx sends a CSP plus `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` on every response, and `server_tokens off` hides the nginx version. The headers live in `nginx-security-headers.conf`, copied to `/etc/nginx/snippets/security-headers.conf` and included at `server` level **and again in every `location` that has its own `add_header`** — nginx drops inherited `add_header`s as soon as a block declares one, so a new `location` with `add_header` must include the snippet too.

The CSP is `script-src 'self'` (the Vite build has no inline scripts) with `style-src 'self' 'unsafe-inline'` (sonner and Base UI inject `<style>` at runtime, and a static site can't mint nonces). `connect-src` is `'self'` plus the API origin: the `Dockerfile` takes scheme + host + port from the `VITE_API_BASE_URL` build-arg and substitutes the `__API_ORIGIN__` placeholder; a relative base URL (`/api`) adds nothing. The same `RUN` step runs `nginx -t`, so a broken config fails the image build instead of the deploy. **Adding any new external origin** (a font CDN, analytics, an image host) means adding it to the matching directive in the snippet — otherwise the browser blocks it. HSTS is deliberately not set here: TLS terminates at the Dokploy proxy, which is the place to add it.

## Key config notes

- Tailwind v4 is configured via the `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`.
- `tsconfig.app.json` sets `"ignoreDeprecations": "6.0"` to silence the TypeScript 6 `baseUrl` deprecation warning.
- Environment variables: `VITE_API_BASE_URL` and `VITE_APP_ENV` (see `.env.example`). `src/vite-env.d.ts` types both on `ImportMetaEnv`.
- Floating panels (the flow-state color and roles pickers in `CreateProjectModal`) use the Base UI **Popover** in `src/components/ui/popover.tsx`. Do not hand-roll one again with `createPortal` + a `getBoundingClientRect` offset + a `mousedown` listener: that shape froze the panel's position while the step-2 list scrolled, never closed on Escape, and forced a manual `z-index` above the swatch tooltips.
- The **Calendar** in `src/components/ui/calendar.tsx` wraps `react-day-picker` (v10). `date-fns` is only its transitive dependency — don't import it for display; dates render through `formatDate`. The calendar needs `buttonVariants`, which lives in `src/components/ui/button-variants.ts` rather than `button.tsx`: exporting a non-component from `button.tsx` fails the `react-refresh/only-export-components` lint rule. On Windows, `npx shadcn@4.7.0 add` has been seen to ignore the `@/` aliases — it wrote files into a literal `@/` folder, imported `cn` from a bogus npm package `cn`, and shipped its own copy of `button.tsx`. Check `git status` after every `add`.
- Hover hints go through the **Tooltip** in `src/components/ui/tooltip.tsx`, never the native `title` attribute — the two look nothing alike, and an element carrying both shows two tooltips at once. A disabled trigger (`PageHeader`'s action button) needs a wrapping `<span>` as the trigger, since `disabled` sets `pointer-events-none`. `Sidebar` wraps its rows in `CollapsedLabel`, which adds the tooltip only while the rail is collapsed and the label is hidden.
- Dropdowns use the Base UI **Select** in `src/components/ui/select.tsx`, whose `SelectContent` defaults `alignItemWithTrigger` to **`false`** — deliberately not shadcn's `true`. With `true` the list shifts so the selected option sits over the trigger and the popup jumps up or down depending on the selection; with `false` it always opens below, flipping above only when there's no room. Don't set it back, globally or per call site. Separately, when an item's `value` differs from its label (an id), `SelectValue` needs a render function mapping the value to the label (see `AssigneeSelect`) — otherwise the trigger shows the raw id. A function child also overrides `placeholder`, so it has to return the placeholder text itself.
- Toast notifications use **sonner** (`import { toast } from 'sonner'`). `<Toaster />` is mounted in `AppProviders`.
- Forms use **react-hook-form** + **zod** (via `@hookform/resolvers/zod`).
