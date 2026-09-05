# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager

Use **pnpm** for all dependency management. Do not use npm or yarn.

```bash
pnpm install
pnpm add <package>
pnpm add -D <package>
```

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

> `tslib` must be installed (`pnpm add tslib`) for shadcn 4.7.0 to work — it's a required peer dependency of `recast`.

## Architecture

`main.tsx` mounts `<AppProviders>` (QueryClientProvider + `<Toaster>` from sonner) wrapping `<RouterProvider>`.

**Routing** (`src/app/router/`) uses `createBrowserRouter`. All authenticated routes live under `ProtectedLayout`, which reads `isAuthenticated` from the Zustand auth store and redirects to `/login` if false.

| Route | Component |
|---|---|
| `/login` | `LoginPage` |
| `/dashboard` | `DashboardPage` |
| `/projects` | `ProjectsPage` |
| `/projects/:id` | `ProjectBoardPage` |
| `/work-items` | `WorkItemsPage` |

**State** (`src/app/store/`) — Zustand only. Auth state (`user`, `isAuthenticated`) lives in `auth.store.ts`. The `logout()` action clears `aurora_access_token` from localStorage.

**HTTP** (`src/shared/lib/api-client.ts`) — `apiFetch<T>` wrapper around native `fetch`, reading `VITE_API_BASE_URL`. Injects JWT from `localStorage("aurora_access_token")`; redirects to `/login` on 401. Throws `ApiError` (with `.status`) on non-ok responses.

**Features** (`src/features/`) — one folder per domain (`auth`, `dashboard`, `people`, `profile`, `projects`, `template-flows`, `work-items`), each with `components/`, `hooks/`, `services/`, `types/`.

**One file per REST resource inside `services/` and `types/`** — not one file per feature. A feature that talks to a single resource keeps a single `<feature>.service.ts` / `<feature>.types.ts`; a feature that owns several resources gets one file per resource, named after the resource in the singular:

```
features/projects/
  services/  project.service.ts  component.service.ts  milestone.service.ts
  types/     project.types.ts    component.types.ts    milestone.types.ts
```

The trigger is a **distinct resource with its own endpoints and lifecycle** (components and milestones each have their own CRUD plus status verbs), not file size and not the number of operations. `work-items` keeps one service because every function acts on `/v1/flowboard/work-items` — splitting by verb is not this convention. Sub-collections that live under a parent's path and have no lifecycle of their own (`WorkItemComment`, `WorkItemTimeEntry`, `WorkItemStateTransition`, `WorkItemChangeLog` — read-only pages under `/v1/flowboard/work-items/:id/...`) stay in the parent resource's service and types files.

Import each resource from its own file (`../types/milestone.types`, `../services/milestone.service`). Do not add a barrel `index.ts` that re-exports them — it would keep every consumer coupled to every resource and make the split cosmetic.

**Shared components** (`src/shared/components/`) — reusable UI primitives not tied to a feature. Currently: `PageHeader` (title + optional subtitle + optional action button).

**Shared constants** (`src/shared/constants/`) — cross-feature constants. Currently: `colors.ts` exports `SWATCH_COLORS` (color name → hex map) and `resolveSwatchColor(key)`; used for project colors, work-item flow-state colors, and other color-swatch pickers. `password-rules.ts` exports `PASSWORD_RULES` (id/label/test tuples), `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`; used by password-change and user-creation forms (`profile`, `people` features) for both zod validation and the live rule checklist UI.

**Shared lib** (`src/shared/lib/`) — framework-agnostic helpers. `api-client.ts` (above), `query-client.ts`, and `date-format.ts`, which exports the app's two date formatters: `formatDate` (`Sep 5, 2026`) and `formatDateTime` (`Sep 5, 2026, 3:07 PM`). Both accept either a UTC timestamp or a bare `YYYY-MM-DD` — the shared `parse` helper splits a date-only string by hand, because `new Date('2026-08-31')` reads as UTC midnight and renders the previous day in negative-offset timezones. Callers never have to pick a variant. Import these instead of redefining a local copy — four identical copies had already drifted into feature components before they were consolidated here.

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

**Status transitions** (`getAllowedTransitions(kind, status)`) — depend on the project's `kind`:
- `Product` / `Internal` (operational): `Active` → Maintenance, Archived · `Maintenance` → Active, Archived · `Completed`/`Archived` → (none)
- `Client` / `Research` (lifecycle): `Active` → Completed, Archived · `Completed` → Archived · `Maintenance`/`Archived` → (none)

Each status maps to a REST action verb: `activate`, `maintenance`, `complete`, `archive` — called as `PATCH /v1/flowboard/projects/:id/:action`.

**Milestones** — a time-boxed initiative within one project (`name`, `description`, `targetStartDate`, `targetEndDate`, `status`). Surfaced as the `Milestones` tab of `ProjectBoardPage` via `ProjectMilestonesSection`; create/edit share `MilestoneFormModal` (react-hook-form + `schemas/milestone.schema.ts`). `PUT /v1/flowboard/milestones/:id` replaces all four fields. Status transitions (`getAllowedMilestoneTransitions`): `Draft` → Active, Archived · `Active` → OnHold, Completed, Archived · `OnHold` → Active, Archived · `Completed` → Archived · `Archived` → (none), mapped to `activate` / `hold` / `complete` / `archive` on `PATCH /v1/flowboard/milestones/:id/:action`. Target dates are date-only strings (`YYYY-MM-DD`) — render them with `formatDate` from `@/shared/lib/date-format`, which handles that shape; a raw `new Date(value)` would parse as UTC midnight and show the previous day.

**Sidebar** dynamically loads the user's summary via `useMySummary` (`src/features/auth/hooks/useMySummary.ts`, query key `MY_SUMMARY_QUERY_KEY`, `GET /v1/flowboard/users/my-summary`) — not `useProjects`. It renders every project the endpoint returns, with no client-side status filter. Each entry renders a `GlowDot` styled by status. The "+" button opens `CreateProjectModal`. Mutations that change what the Sidebar displays (`useCreateProject`, `useAddProjectMember`, `useRemoveProjectMember`, `useUpdateProjectStatus`) must invalidate `MY_SUMMARY_QUERY_KEY` in addition to their feature-local keys.

## Work items feature

`estimatedCompletionDate` is a date-only string (`YYYY-MM-DD`) — it round-trips through an `<input type="date">` in both `WorkItemSidebar` and `CreateWorkItemModal`. Every other work-item date (`createdOnUtc`, `updatedOnUtc`, `completedOnUtc`, and the activity timestamps) is a real UTC timestamp. Both shapes go through `formatDate` / `formatDateTime` from `@/shared/lib/date-format`.

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

Query key is `['work-item-activity', workItemId, <resource>, page]`, sharing the `['work-item-activity', workItemId]` prefix so one `invalidateQueries` call covers all four. **Every work-item mutation writes a change-log entry**, so all ten mutation hooks (`useAssignWorkItem`, `useMoveWorkItem`, `useUpdateWorkItem*`) invalidate that prefix in `onSettled` alongside `['work-item', code]` — otherwise the Change Log and State History tabs go stale. Inactive tabs refetch when reopened rather than immediately.

## Key config notes

- Tailwind v4 is configured via the `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`.
- `tsconfig.app.json` sets `"ignoreDeprecations": "6.0"` to silence the TypeScript 6 `baseUrl` deprecation warning.
- Environment variable: `VITE_API_BASE_URL` (see `.env.example`).
- Toast notifications use **sonner** (`import { toast } from 'sonner'`). `<Toaster />` is mounted in `AppProviders`.
- Forms use **react-hook-form** + **zod** (via `@hookform/resolvers/zod`).
