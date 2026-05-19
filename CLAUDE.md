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

`main.tsx` mounts `<AppProviders>` (QueryClientProvider + ReactQueryDevtools) wrapping `<RouterProvider>`.

**Routing** (`src/app/router/`) uses `createBrowserRouter`. All authenticated routes live under `ProtectedLayout`, which reads `isAuthenticated` from the Zustand auth store and redirects to `/login` if false.

**State** (`src/app/store/`) — Zustand only. Auth state (`user`, `isAuthenticated`) lives in `auth.store.ts`. The `logout()` action clears `aurora_access_token` from localStorage.

**HTTP** (`src/shared/lib/axios-instance.ts`) — single Axios instance reading `VITE_API_BASE_URL`. Request interceptor injects JWT from `localStorage("aurora_access_token")`; response interceptor redirects to `/login` on 401.

**Features** (`src/features/`) — one folder per domain (`auth`, `dashboard`, `projects`, `work-items`), each with `components/`, `hooks/`, `services/`, `types/`.

**Path alias** — `@/` maps to `src/`. Configured in `tsconfig.app.json` and `vite.config.ts`.

## Key config notes

- Tailwind v4 is configured via the `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`.
- `tsconfig.app.json` sets `"ignoreDeprecations": "6.0"` to silence the TypeScript 6 `baseUrl` deprecation warning.
- Environment variable: `VITE_API_BASE_URL` (see `.env.example`).
