---
paths:
  - "nginx*.conf"
  - "Dockerfile"
  - ".github/**"
  - ".env*"
  - "vite.config.ts"
  - "src/vite-env.d.ts"
  - "src/shared/constants/app-env.ts"
  - "src/shared/components/EnvironmentRibbon.tsx"
  - "src/app/providers/app-providers.tsx"
---

# Build, deploy and environments

## Build-time environment

`VITE_API_BASE_URL` and `VITE_APP_ENV` are inlined at **build time**: the site ships as static files behind nginx, so nothing is read at runtime. Both are typed on `ImportMetaEnv` in `src/vite-env.d.ts`.

CI passes them as Docker build-args. `VITE_APP_ENV` reuses the `env_name` that the *Resolve environment* step computes (`main` → production, `staging` → staging). Each environment needs its own build.

## Environment ribbon

- **What it is:** a 24px non-dismissible strip on every route (including `/login`) for non-production builds. `EnvironmentRibbon` also prefixes `document.title` with `[STAGING]` / `[DEV]`.
- **Where the value comes from:** `VITE_APP_ENV` (`development | staging | production`). Not `import.meta.env.MODE`, which is `production` in staging too, because the Dockerfile always runs `pnpm run build`.
- **Missing value:** an absent or unknown value resolves to `development` on purpose, so a misconfigured site fails visibly and never passes for production.
- **Keep `IS_NON_PRODUCTION` literal:** it is `import.meta.env.VITE_APP_ENV !== 'production'`, not derived from `APP_ENV`. Vite folds it to `false` in production and drops the ribbon and its Spanish labels from the bundle.
- **Colors:** amber for staging, violet for development. Red means destructive, and aurora teal is reserved for atmosphere.
- **Layout:** `AppProviders` renders it as the first row of the viewport column (see `CLAUDE.md`).

## Security headers (nginx)

- **Where they live:** `nginx-security-headers.conf` holds the CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. It's copied to `/etc/nginx/snippets/security-headers.conf`. `server_tokens off` hides the version.
- **Include it in every `location` with its own `add_header`,** as well as at `server` level: nginx drops inherited `add_header`s once a block declares one.
- **CSP sources:**
  - `script-src 'self'`: the build has no inline scripts.
  - `style-src 'self' 'unsafe-inline'`: sonner and Base UI inject `<style>`.
  - `connect-src 'self'` plus the API origin. The Dockerfile takes it from the `VITE_API_BASE_URL` build-arg into `__API_ORIGIN__`; a relative `/api` adds nothing.
- **New external origin:** any new one (fonts, analytics, images) must be added to the matching CSP directive, or the browser blocks it.
- **Validation:** the same `RUN` step runs `nginx -t`, so a broken config fails the image build.
- **HSTS** belongs in the Dokploy proxy, where TLS terminates, not here.
