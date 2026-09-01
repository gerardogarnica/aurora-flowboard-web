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

The trigger is a **distinct resource with its own endpoints and lifecycle** (components and milestones each have their own CRUD plus status verbs), not file size and not the number of operations. `work-items` keeps one service with 12 functions because they all act on `/v1/flowboard/work-items` — splitting by verb is not this convention. Nested value objects that arrive inside a parent response and have no endpoints of their own (`WorkItemComment`, `WorkItemTimeEntry`) stay in the types file of the parent resource.

Import each resource from its own file (`../types/milestone.types`, `../services/milestone.service`). Do not add a barrel `index.ts` that re-exports them — it would keep every consumer coupled to every resource and make the split cosmetic.

**Shared components** (`src/shared/components/`) — reusable UI primitives not tied to a feature. Currently: `PageHeader` (title + optional subtitle + optional action button).

**Shared constants** (`src/shared/constants/`) — cross-feature constants. Currently: `colors.ts` exports `SWATCH_COLORS` (color name → hex map) and `resolveSwatchColor(key)`; used for project colors, work-item flow-state colors, and other color-swatch pickers. `password-rules.ts` exports `PASSWORD_RULES` (id/label/test tuples), `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`; used by password-change and user-creation forms (`profile`, `people` features) for both zod validation and the live rule checklist UI.

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

**Milestones** — a time-boxed initiative within one project (`name`, `description`, `targetStartDate`, `targetEndDate`, `status`). Surfaced as the `Milestones` tab of `ProjectBoardPage` via `ProjectMilestonesSection`; create/edit share `MilestoneFormModal` (react-hook-form + `schemas/milestone.schema.ts`). `PUT /v1/flowboard/milestones/:id` replaces all four fields. Status transitions (`getAllowedMilestoneTransitions`): `Draft` → Active, Archived · `Active` → OnHold, Completed, Archived · `OnHold` → Active, Archived · `Completed` → Archived · `Archived` → (none), mapped to `activate` / `hold` / `complete` / `archive` on `PATCH /v1/flowboard/milestones/:id/:action`. Target dates are date-only strings (`YYYY-MM-DD`) — format them by splitting the parts, never via `new Date(value)`, which parses as UTC midnight and shows the previous day.

**Sidebar** dynamically loads the user's summary via `useMySummary` (`src/features/auth/hooks/useMySummary.ts`, query key `MY_SUMMARY_QUERY_KEY`, `GET /v1/flowboard/users/my-summary`) — not `useProjects`. It renders every project the endpoint returns, with no client-side status filter. Each entry renders a `GlowDot` styled by status. The "+" button opens `CreateProjectModal`. Mutations that change what the Sidebar displays (`useCreateProject`, `useAddProjectMember`, `useRemoveProjectMember`, `useUpdateProjectStatus`) must invalidate `MY_SUMMARY_QUERY_KEY` in addition to their feature-local keys.

## Key config notes

- Tailwind v4 is configured via the `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`.
- `tsconfig.app.json` sets `"ignoreDeprecations": "6.0"` to silence the TypeScript 6 `baseUrl` deprecation warning.
- Environment variable: `VITE_API_BASE_URL` (see `.env.example`).
- Toast notifications use **sonner** (`import { toast } from 'sonner'`). `<Toaster />` is mounted in `AppProviders`.
- Forms use **react-hook-form** + **zod** (via `@hookform/resolvers/zod`).
