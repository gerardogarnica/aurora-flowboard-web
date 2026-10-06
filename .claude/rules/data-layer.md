---
paths:
  - "src/**/hooks/**"
  - "src/**/services/**"
  - "src/shared/lib/**"
  - "src/app/store/**"
---

# Data layer: HTTP, query keys, cache updates

## `apiFetch` and `apiPath` (`src/shared/lib/api-client.ts`)

- `apiFetch<T>` reads `VITE_API_BASE_URL`, injects the JWT from `localStorage('aurora_access_token')` and throws `ApiError` (`.status`, `.message` = ProblemDetails `detail` or `statusText`) on non-ok responses.
- `apiPath` percent-encodes each interpolated value as exactly one path segment. `encodeURIComponent` alone isn't enough: it leaves `.` alone, and the URL parser resolves `.` / `..` (even written `%2E%2E`) as dot segments. So `apiPath` refuses `.`, `..` and `''` with `ApiError(404)`, the same answer the backend gives a malformed id.
- A query string goes **after** the tag (`` `${apiPath`/v1/…/${id}/comments`}?${query}` ``); inside it, `=` and `&` would be encoded.

## Token refresh

On a 401, `apiFetch` refreshes once (`POST /v1/flowboard/auth/refresh-token`) and retries; a second 401 on the retry ends the session.
- **Single-flight:** concurrent 401s share one refresh.
- **What ends the session:** only 400 / 401 / 403 *from the refresh endpoint* (`SESSION_ENDED_STATUSES`). The backend answers 403 `Auth.InvalidRefreshToken` for an invalid or expired token, and 400 for a missing one.
- **What doesn't:** a 5xx, a 429 or a network error is transient. The tokens stay, the error propagates, and the next request retries the refresh.
- **Credential errors:** wrong credentials on login and change-password are **403**, not 401, so they surface in their form instead of triggering a refresh.

## Auth store (`src/app/store/auth.store.ts`)

- Only `user` is persisted (`aurora_auth`); `isAuthenticated` is derived from it on rehydration.
- `logout()` removes both tokens and calls `queryClient.clear()`, so no data leaks into the next session.
- `useSyncAuthUser()` (run by `AppShell` in `protected-layout.tsx`) refreshes the stored user from `my-summary`'s `me` whenever it loads or refetches. It uses `toAuthUser`, shared with `useLogin`. It only updates an existing session and never recreates one after logout.

## Query keys (`src/shared/lib/query-keys.ts`)

The shapes are load-bearing because invalidation matches by prefix:
- `projects.boards()` covers every board; `workItems.all()` covers every work-item detail.
- `workItems.activity(id)` covers all four activity tabs and all their pages: `activityPage(id, resource, page)` = `['work-item-activity', id, resource, page]`.
- `projects.list()` (`'projects'`) and `projects.detail(id)` (`'project'`) are separate roots on purpose; `projects.details()` is the prefix of every detail.

A new query gets a new factory entry, next to the keys it has to line up with.

## Query client (`src/shared/lib/query-client.ts`)

- It never retries a 4xx (a 404/403 is an answer) and retries other failures once.
- React Query pauses retries while the tab is hidden, so a background-tab failure reaches its error state only once the tab is visible again.

## `useOptimisticMutation` (`src/shared/hooks/useOptimisticMutation.ts`)

Signature: `useOptimisticMutation({ mutationFn, patches, invalidate, errorMessage? })`.
- **`patches(vars)`** returns one `cachePatch<T>(queryKey, (old) => …)` per cache; `useUpdateProject` patches detail + list.
- **Uncached queries are skipped, never seeded.** Patching `undefined` as `[]` would show an empty list with nothing to roll back.
- **On error** it restores every snapshot and toasts `getErrorMessage(err, errorMessage) — changes reverted`.
- **`invalidate(vars, error)`** returns `InvalidateQueryFilters[]` and runs on settle, success (`error` null) or error.

`useOptimisticWorkItemMutation` (`features/work-items/hooks/`) is the work-item wrapper:
- `patchDetail` / `patchCard`: the shapes differ, the card has `component` and the detail `componentName`.
- `moveToState` relocates the card; `alsoInvalidate` covers counters.
- Omit `projectId` when the change never shows on a card (description), so the board is neither patched nor refetched.

## What else to invalidate

The Sidebar reads `queryKeys.mySummary()`, not the project list.
- **Sidebar's project list, name, color and status:** `useCreateProject`, `useUpdateProject`, `useUpdateProjectStatus`, `useAddProjectMember` and `useRemoveProjectMember` must invalidate `mySummary()`.
- **"My Issues" counter:** `useCreateWorkItem`, `useAssignWorkItem` and `useMoveWorkItem` must invalidate it too. `useMoveBoardWorkItem` (drag-and-drop) doesn't: it only moves between Active states, so no counter changes.
- **Open/closed counts on Projects cards:** `useCreateWorkItem` and `useMoveWorkItem` also invalidate `projects.list()`; project status changes move them too.
- **Members count:** `counts.members` is the sum of members across the user's own projects, so creating a workspace user doesn't move it.
- **Names on cards and details:** `useRenameComponent` and `useUpdateMilestone` invalidate the project's board (`refetchType: 'all'`) and `workItems.all()`.

## Services

One file per REST resource (see `CLAUDE.md`). Sub-collections without a lifecycle of their own (comments, time entries, state history, change logs under `/work-items/:id/…`) stay in the parent's service and types files.
