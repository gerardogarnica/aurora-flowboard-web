# aurora-flowboard-web

Web application for Aurora Flowboard — a project/work-item management board built with React 19, TypeScript, and Vite.

## Tech stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build tool
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no `tailwind.config.js`)
- **React Router** (`createBrowserRouter`) for routing
- **Zustand** for global state (auth store)
- **TanStack Query** for server state / data fetching
- **react-hook-form** + **zod** for forms and validation
- **shadcn/ui** for UI primitives
- **sonner** for toast notifications

## Getting started

This project uses **pnpm**. Do not use npm or yarn.

```bash
pnpm install
```

Copy the example environment file and set the API base URL:

```bash
cp .env.example .env.local
```

```bash
pnpm dev        # dev server at http://localhost:5173
pnpm build      # tsc -b + vite build
pnpm lint       # eslint
pnpm preview    # preview production build
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the Flowboard API (e.g. `https://api.staging.flowboardweb.com`). Read via `import.meta.env.VITE_API_BASE_URL` in `src/shared/lib/api-client.ts` and baked in at **build time** — Vite does not read it at runtime. |

Vite loads a different `.env` file per mode: `.env.development` for `vite dev`, `.env.production` for `vite build`, and `.env.local`/`.env.*.local` for untracked local overrides (gitignored). Only variables prefixed with `VITE_` are exposed to client code — this is a Vite security feature to prevent accidentally leaking non-public env vars into the browser bundle.

## Project structure

```
src/
  app/
    router/       # createBrowserRouter routes, ProtectedLayout
    store/        # Zustand stores (auth.store.ts, etc.)
  features/       # one folder per domain: auth, dashboard, projects, work-items
    <feature>/
      components/
      hooks/
      services/
      types/
  shared/
    components/   # reusable UI primitives not tied to a feature (PageHeader, etc.)
    lib/          # api-client.ts and other cross-cutting utilities
```

The `@/` path alias maps to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`).

See [CLAUDE.md](CLAUDE.md) for a detailed breakdown of routes, state, the HTTP client, and the Projects feature (the most developed domain).

## Deployment

The app is built as a static SPA and served via nginx. See:
- [`Dockerfile`](Dockerfile) — multi-stage build (`node:24-alpine` build stage + `nginx:1.27-alpine` runtime).
- [`nginx.conf`](nginx.conf) — SPA fallback routing, gzip, and cache headers.
- [`.github/workflows/build.yml`](.github/workflows/build.yml) — CI/CD: lint/build/test, build & push image to GHCR, deploy via Dokploy webhook.

The `VITE_API_BASE_URL` build argument must be provided at `docker build` time (or as a CI secret) since Vite inlines it into the JS bundle — it cannot be changed after the image is built.

## Best practices followed in this project

- **Build-time env vars only, never runtime**: `import.meta.env.VITE_*` values are inlined by Vite at build time. Each deployment target (staging/production) needs its own build with the correct `VITE_API_BASE_URL`, rather than a single image reused across environments.
- **Module-level component definitions**: components are declared at the top level of a file, not created inline inside another component's render — defining a component inside a parent's render body recreates it on every render, causing state loss and unnecessary re-mounts.
- **Memoize expensive work, not everything**: `useMemo`/`useCallback` are reserved for genuinely expensive computations or to preserve referential equality for memoized children — not applied reflexively to every value.
- **Dead-code elimination via `import.meta.env.DEV`**: dev-only code (verbose logging, debug panels) can be guarded with `if (import.meta.env.DEV)` and Vite/Rollup will tree-shake it out of the production build entirely.
- **Watch the production bundle size**: `vite build` warns when a chunk exceeds 500 kB after minification. If a route or dependency pushes past that threshold, prefer dynamic `import()` for route-level code splitting over disabling the warning.
- **Path aliases over relative imports**: use `@/` instead of long `../../../` chains, kept consistent between `tsconfig.app.json` and `vite.config.ts`.

## Adding shadcn components

```bash
npx shadcn@4.7.0 add <component>
```

> `tslib` must be installed (`pnpm add tslib`) for shadcn 4.7.0 to work — it's a required peer dependency of `recast`.

## License

See [LICENSE](LICENSE).
