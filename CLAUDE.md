# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Area-specific detail lives in `.claude/rules/` and loads only when you read matching files: `data-layer.md` (HTTP, query keys, cache updates), `projects.md`, `work-items.md`, `ui-components.md` (internals of shared and `ui/` components), `deploy.md` (nginx, Docker, CI, environment ribbon), `testing.md` (Vitest, MSW, test helpers). Feature specs, in Spanish, are in `docs/specs/`.

## Package manager and commands

Use **pnpm** only — never npm or yarn.

```bash
pnpm install
pnpm dev        # dev server at http://localhost:5173
pnpm build      # tsc -b + vite build
pnpm lint       # eslint
pnpm test       # vitest run (CI runs it after lint and build)
pnpm test:watch # vitest in watch mode
pnpm preview    # preview production build
```

- **Lockfile:** `pnpm-lock.yaml` is the only one. CI and the `Dockerfile` run `pnpm install --frozen-lockfile`, so a `package.json` change ships with its lockfile in the same commit.
- **`dependencies` vs `devDependencies`:** `dependencies` holds only what reaches the browser bundle. Build tooling (`vite`, `tailwindcss`, `@tailwindcss/vite`, `shadcn`, `tslib`) is in `devDependencies`. The Docker build still installs them, and `pnpm audit --prod` checks what actually ships.
- **`shadcn` stays at 4.7.0:** `src/index.css` imports `shadcn/tailwind.css`, and newer versions change that stylesheet. Bump it deliberately, never as a side effect of `pnpm add`.
- **Adding components:** `npx shadcn@4.7.0 add <component>` (needs `tslib`). On Windows it has ignored the `@/` aliases, writing into a literal `@/` folder and importing a bogus `cn` package, so check `git status` after every `add`.
- **Path alias:** `@/` → `src/`, in both `tsconfig.app.json` and `vite.config.ts`.
- **Tailwind v4:** configured via the `@tailwindcss/vite` plugin; there is no `tailwind.config.js`.
- **Backend:** the source is in `../aurora-flowboard-api`. Check its validators and domain rules there before assuming an API constraint.

## Architecture

- **Entry:** `main.tsx` → `<AppProviders>` (QueryClientProvider, sonner `<Toaster>`) → `<RouterProvider>`.
- **Viewport:** `AppProviders` owns a `flex flex-col h-screen` column. Row 1 is the non-production `EnvironmentRibbon` (24px); row 2 (`flex-1 min-h-0`) holds the router. Below it, size against `h-full` / `min-h-full`, **never `h-screen`**, or the shell overflows whenever the ribbon shows.
- **Routing** (`src/app/router/index.tsx`, `createBrowserRouter`): authenticated routes sit under `ProtectedLayout`, which redirects to `/login?returnTo=…` without a session.
  - Every page under it is lazy (`lazy: lazyPage(() => import(…), (m) => m.XPage)`); add new pages the same way, never as a static import.
  - `LoginPage` and the shell (`ProtectedLayout`, `Sidebar`, `TopNavbar`) are eager.
  - Keep heavy, rarely-used UI out of the shell: whatever it imports statically is in everyone's first load. `Sidebar` lazy-loads `CreateProjectModal` for that reason.
- **State:** Zustand only. The auth store is `src/app/store/auth.store.ts`; server state lives in React Query.
- **Features** (`src/features/<domain>/`) use the subfolders they need: `components/`, `hooks/`, `services/`, `types/`, `schemas/`, `constants/`, `utils/`. Cross-feature code goes in `src/shared/{components,hooks,lib,constants,types}`, and shadcn/Base UI primitives in `src/components/ui/`.
- **One file per REST resource** in `services/` and `types/`, named in the singular (`project.service.ts`, `component.service.ts`, `milestone.service.ts`). The trigger is a resource with its own endpoints and lifecycle, not file size; `work-items` keeps a single service because everything acts on `/work-items`. Import each resource from its own file, and **no barrel `index.ts`**.

## Session and permissions

- **Session ends** only when the token refresh itself is rejected (400/401/403 from the refresh endpoint). Network errors and 5xx never log out. Details in `data-layer.md`.
- **`returnTo` after login** is attacker-controlled: always pass it through `getSafeReturnTo` (`shared/lib/return-to.ts`). `LoginPage` is the only place that redirects after sign-in; `useLogin` doesn't navigate.
- **Workspace role** (`UserRole`: `Administrator | Member`): read it with `useIsAdministrator()`, never by comparing the string. It gates creating projects and managing people.
- **Project role:** check `hasProjectAdminRole(members, userId)` (`features/projects/utils/project-permissions.ts`). The backend gates every project-level write on project `Admin`; the workspace Administrator role alone is **not** enough.

## Cross-cutting rules

- **API paths:** every path with a variable is built with the `apiPath` tag: ``apiFetch(apiPath`/v1/flowboard/projects/${id}/board`)``. Ids come from the URL, and `apiPath` keeps a crafted id from turning into a different endpoint. Never interpolate into a plain template string.
- **Query keys:** every key comes from the `queryKeys` factory (`shared/lib/query-keys.ts`), never a literal array, because a typo silently stops matching its invalidations.
- **Optimistic updates:** go through `useOptimisticMutation` (`shared/hooks/`), or `useOptimisticWorkItemMutation` for work items. Mutations that change what the Sidebar or the Projects cards show must also invalidate `queryKeys.mySummary()` / `projects.list()` (see `data-layer.md`).
- **Error text:** every banner, toast and load-error state uses `getErrorMessage(error, fallback?)` (`shared/lib/error-message.ts`), never `error.message` or `String(error)`. It shows the backend's ProblemDetails text and falls back for network and JS errors.
- **Failed queries:** every query-backed screen renders `ErrorState` on `isError`; a failed query must never look like an empty screen.
- **Backend enums:** display maps keyed by one (work-item type and priority, project kind and status, milestone and component status) are read through their getter with a fallback, never `MAP[value].x`. Examples: `getWorkItemTypeConfig`, `getPriorityConfig`, `getPriorityBars`, `getProjectKindConfig`, `getMilestoneStatusBadge`. The backend can ship a value the frontend doesn't know yet.
- **Dates:** render with `formatDate` / `formatDateTime` (`shared/lib/date-format.ts`), which handle both UTC timestamps and date-only `YYYY-MM-DD`. Never `new Date('YYYY-MM-DD')`, which is UTC midnight and shows the previous day west of UTC. Don't redefine local formatters.

## UI building blocks

| Need | Use |
|---|---|
| Yes/no confirmation | `ConfirmDialog`, never a hand-rolled `Dialog showCloseButton={false}` |
| A person's avatar | `UserAvatar` / `UnassignedAvatar` (color hashed from `userId`) |
| Client-side tabs / routed tabs | `UnderlineTabs` + `UnderlineTabsPanel` / `RouteTabs` |
| Click-to-edit text | `InlineEditText` |
| Any date field | `DatePicker` (string `YYYY-MM-DD`), never `<input type="date">` |
| Color choice | `ColorSwatchGrid` |
| Empty, error and table states | `EmptyState`, `ErrorState` (`onRetry` = `refetch`), `DataTable` |
| Hover hint | `ui/tooltip`, never the native `title` attribute |
| Dropdown / floating panel | `ui/select` / `ui/popover`, never a native `<select>` or a hand-rolled portal |
| Toast | `toast` from `sonner` |
| Ctrl/⌘+Enter to submit | `isSubmitShortcut(e)` + `SUBMIT_SHORTCUT_LABEL` (`shared/constants/platform.ts`), together so label and handler can't drift |
| Password rules (zod + live checklist) | `PASSWORD_RULES` (`shared/constants/password-rules.ts`) |

- **Clickable cards** keep their whole-card `onClick` for the pointer, but keyboard and screen-reader users reach them through a real control inside: a `<Link>` on the project name, a `<button>` on the work-item title. That control calls `stopPropagation` (or the card's handler fires twice), and the card shows a ring via `has-[a:focus-visible]` / `has-[button:focus-visible]`. Never wrap a card that contains controls in one big button.

## Forms

All forms use **react-hook-form + zod** (`@hookform/resolvers/zod`); never hand-validate with `useState` error maps.
- **Schema:** in the feature's `schemas/` folder, mirroring the backend validator's limits and rules. Field values are what the control produces (`''` for "none"); convert them to nulls and numbers in a `toPayload` at submit.
- **Form:** `mode: 'onChange'`. The submit button is enabled by `schema.safeParse(useWatch({ control })).success`. Non-input controls (Select, DatePicker, ColorSwatchGrid) go through `<Controller>`.
- **Errors:** inline `<p id="…-error">` wired with `aria-describedby`. API errors go in a top banner via `getErrorMessage`.
- **Layout:** buttons in `DialogFooter`; fields use the `ui/` components.

## Domain constraints

- **Project flows are create-only.** The backend has no endpoints to edit flow states after `POST /projects`. Don't build flow-editing UI without confirming first (see `projects.md`).
