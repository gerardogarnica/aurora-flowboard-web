---
paths:
  - "src/**/*.test.*"
  - "src/test/**"
  - "vitest.config.ts"
---

# Testing: Vitest, Testing Library, MSW

## Setup (`vitest.config.ts`)

- It merges `vite.config.ts` with `mergeConfig`, so the `@/` alias works in tests. A bare `vitest.config.ts` would replace the Vite config instead.
- **Environment:** `jsdom`. Tests are `src/**/*.test.{ts,tsx}`, next to the code they test.
- **`TZ=America/Bogota`** (UTC−5, no DST), set in the config before the workers start. It makes the "previous day" bug of `new Date('YYYY-MM-DD')` reproducible anywhere. `date-format.test.ts` fails first if the offset isn't applied.
- **`VITE_API_BASE_URL=http://api.test`** through `test.env`. `api-client` reads it once at import, and this keeps `.env.local` out of the tests.
- `restoreMocks` and `unstubGlobals` are on, so `vi.spyOn` and `vi.stubGlobal` reset after each test.
- No `globals`: import `describe`, `it`, `expect` and `vi` from `vitest`.

## Helpers (`src/test/`)

- **`setup.ts`:** jest-dom matchers, the MSW server lifecycle, and Testing Library's `cleanup()` plus `localStorage.clear()` after each test.
- **`msw-server.ts`:** `server` has **no default handlers**, and `onUnhandledRequest: 'error'` fails any request a test didn't declare. Each test adds its own with `server.use(http.get(apiUrl('/v1/…'), …))`. `resetHandlers()` runs after each test.
- **`query-wrapper.tsx`:** `createTestQueryClient()` (no retries, `gcTime: Infinity`) and `createWrapper(client)` for `renderHook` / `render`. Every test gets a fresh client, never the app's `queryClient` singleton.
- **`fixtures/board.ts`:** `makeBoardItem(overrides)` and `makeColumn(stateId, items, overrides)`. The column rewrites its items' `flowStateId` / `flowStateName` the way the API sends them.

## Conventions

- **Query keys** come from `queryKeys`, both to seed caches and to assert invalidations, exactly as in the app.
- **Backend contracts:** tests that mirror a backend rule, such as the status-transition tables, name the backend file they copy. A change there means the backend changed too.
- **Redirects:** `apiFetch` leaves through `window.location.href`. Stub it with `vi.stubGlobal('location', { pathname, search, hash, href })` and assert `href` (see `api-client.test.ts`).
- **Toasts:** `vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))` and assert the call.
- **Optimistic hooks:** to observe the optimistic state, have the MSW handler await a promise the test resolves. Seeded queries have no observers, so invalidating them on settle doesn't trigger a request.
- **Check that a new test can fail:** break the code it guards, watch it go red, then revert.
