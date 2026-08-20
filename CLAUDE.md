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

**Features** (`src/features/`) — one folder per domain (`auth`, `dashboard`, `projects`, `work-items`), each with `components/`, `hooks/`, `services/`, `types/`.

**Shared components** (`src/shared/components/`) — reusable UI primitives not tied to a feature. Currently: `PageHeader` (title + optional subtitle + optional action button).

**Shared constants** (`src/shared/constants/`) — cross-feature constants. Currently: `colors.ts` exports `SWATCH_COLORS` (color name → hex map) and `resolveSwatchColor(key)`; used for project colors, work-item flow-state colors, and other color-swatch pickers. `password-rules.ts` exports `PASSWORD_RULES` (id/label/test tuples), `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`; used by password-change and user-creation forms (`profile`, `people` features) for both zod validation and the live rule checklist UI.

**Path alias** — `@/` maps to `src/`. Configured in `tsconfig.app.json` and `vite.config.ts`.

## Projects feature

The most developed feature domain. Key files:

| File | Purpose |
|---|---|
| `types/project.types.ts` | `Project`, `ProjectApiStatus`, `CreateProjectRequest`, flow types, `ProjectBoardColumn`, `ProjectBoardWorkItem` |
| `constants/project-status.ts` | `ALLOWED_TRANSITIONS` map for valid status changes |
| `constants/flow-states.ts` | Default flow states used in project creation |
| `services/project.service.ts` | `getProjects`, `createProject`, `updateProjectStatus`, `getProjectBoard(projectId)` |
| `hooks/useProjects.ts` | React Query — query key `['projects']` |
| `hooks/useCreateProject.ts` | Mutation — invalidates `['projects']` on success |
| `hooks/useProjectBoard.ts` | React Query — query key `['project-board', id]` |
| `hooks/useUpdateProjectStatus.ts` | Mutation with optimistic update + rollback; toasts on error |

**Status transitions** (`ALLOWED_TRANSITIONS`):
- `Draft` → Active, Archived
- `Active` → OnHold, Completed, Archived
- `OnHold` → Active, Archived
- `Completed` → Archived
- `Archived` → (none)

Each status maps to a REST action verb: `activate`, `hold`, `complete`, `archive` — called as `PATCH /v1/flowboard/projects/:id/:action`.

**Sidebar** dynamically loads real projects via `useProjects` and shows only Active/Draft/OnHold entries. Each entry renders a `GlowDot` styled by status. The "+" button opens `CreateProjectModal`.

## Key config notes

- Tailwind v4 is configured via the `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`.
- `tsconfig.app.json` sets `"ignoreDeprecations": "6.0"` to silence the TypeScript 6 `baseUrl` deprecation warning.
- Environment variable: `VITE_API_BASE_URL` (see `.env.example`).
- Toast notifications use **sonner** (`import { toast } from 'sonner'`). `<Toaster />` is mounted in `AppProviders`.
- Forms use **react-hook-form** + **zod** (via `@hookform/resolvers/zod`).
