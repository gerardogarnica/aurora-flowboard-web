---
paths:
  - "src/features/projects/**"
  - "src/app/layout/Sidebar.tsx"
---

# Projects feature

## Board (`ProjectBoardPage`, route `/projects/:id/:tab`)

- **Tabs:** `board` / `components` / `milestones` through `RouteTabs`; an unknown `:tab` falls back to `board`.
- **Not found:** a 404 or 403 on the project detail or the board renders "Project not found" (whole page, link back to `/projects`); the backend answers 404 for an unknown or malformed id. Any other failure renders an `ErrorState` that refetches both.
- **Rendering:** `WorkItemCard` is `memo`ized and relies on React Query's structural sharing keeping unchanged `item`s identical across refetches. Keep `handleSelectItem` in `useCallback` and the empty board as the module constant `NO_COLUMNS`; otherwise every card re-renders on each refetch or URL change.
- **Edit rights:** `canAddOrUpdateWorkItems` reflects only the project's status. The work-item `canEdit` is that **and** `!isProjectViewer(members, userId)`; a Viewer also gets **+ New issue** disabled with its own tooltip (see `work-items.md`).
- **Comment rights:** `canComment` = `canAddOrUpdateWorkItems` **and** project status `Active`/`Maintenance`. It ignores the role: Viewers comment.

## Board grouping (spec: `docs/specs/board-grouping.spec.md`)

- **Control:** `BoardGroupByControl` sits on the right of the tab row, with None / Assignee / Type / Milestone / Component.
- **URL state:** the choice lives in `?groupBy=` (`parseBoardGroupBy`, unknown → `none`), written with `replace: true` and preserving `?selected=`.
- **Rendering:** `None` renders the plain columns. Anything else renders `BoardSwimlanes`: sticky column headers, so the container is `overflow-auto` on both axes, and one Base UI `Accordion` lane per group.
- **Grouping:** client-side in `utils/group-board-items.ts`. Milestones and components group by **name**, because that's all the board carries. Only non-empty groups show, plus a trailing "Unassigned / No milestone / No component" bucket.
- **Lane state:** the page tracks only the *collapsed* keys and resets them on each `groupBy` change, so new groups arrive expanded.

## Drag-and-drop (spec: `docs/specs/board-drag-and-drop.spec.md`)

- **Library:** Pragmatic drag and drop 4.x. Import from `@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter` and `@atlaskit/pragmatic-drag-and-drop-auto-scroll/element`; the old `element/adapter` / `combine` paths are deprecated.
- **Where it can drop:** `canMoveTo` (`utils/board-drop-targets.ts`) = the origin column's `availableTransitions` (from `GET /board`, already filtered by role) narrowed to the board's columns, minus the origin. The board shows only Active states, so a drag never completes or cancels an item; that stays in the `StatusSelect`.
- **Lanes:** without grouping every column is lane `SINGLE_LANE_KEY`; in swimlanes each cell is lane `group.key`, and a card drops only in its own lane. A drop changes the state, never the grouped field.
- **Who drags:** `BoardDragProvider` gets `enabled = canEditWorkItems`. A card with its move pending isn't draggable (`pendingIds` from `useMoveBoardWorkItem`).
- **Cards stay memoized:** `WorkItemCard` takes only primitives for drag (`dragLaneKey`, `isDraggable`); the rules live in the provider and the drop targets.
- **Move:** `useMoveBoardWorkItem` reuses `workItemPatches` / `workItemInvalidations`. It doesn't invalidate `mySummary` / `projects.list` (Active → Active only). `updateCard` inserts in the backend's order (`utils/board-order.ts`).
- **Tests:** jsdom has no native drag-and-drop, so the drag itself is verified by hand; the rules and the move hook are unit-tested.

## Status and permissions

- **Transitions:** `getAllowedTransitions(kind, status)` (`constants/project-status.ts`) depends on the kind. Each status maps to `PATCH /v1/flowboard/projects/:id/{activate|maintenance|complete|archive}`.
- **Who sees the status menu:** only users with `hasProjectAdminRole(project.members, userId)`; elsewhere it's a plain badge. The workspace Administrator role alone gets a backend error.
- **Projects page states:** load error, no projects at all (admins get a create action), and everything hidden by the status filters ("Show all statuses").

## Milestones

- Tab `Milestones` (`ProjectMilestonesSection`); create and edit share `MilestoneFormModal`.
- `PUT /v1/flowboard/milestones/:id` replaces all four fields.
- Status verbs: `PATCH …/milestones/:id/{activate|hold|complete|archive}` (`getAllowedMilestoneTransitions`).
- Target dates are date-only (`YYYY-MM-DD`): render them with `formatDate`, never `new Date(value)`.

## Project flows

- **Create-only.** Flow states are set only in the `POST /v1/flowboard/projects` payload, pre-filled from `GET /v1/flowboard/template-flows/:kind`. There are no endpoints to edit them, and a wrong flow can only be fixed with SQL on the backend.
- **Reads:** they come back as the board's columns and as a work item's `availableTransitions`. The flow types in `types/project.types.ts` model those two reads.
- Don't build flow-editing UI without confirming first.

## CreateProjectModal

- **Step 1:** a `useForm` owned by the modal body (`createProjectSchema`), so Back finds the fields as they were.
- **Step 2:** a reorderable list held in state, checked with `flowStatesSchema.safeParse` on the first submit and live after that. It mirrors the backend's 400s: a unique non-empty name ≤ 50 characters, at least one role per state, and at least one Active, Completed and Cancelled state.
- **Mounting:** `Sidebar` loads it with `React.lazy` because it's admin-only and heavy (react-hook-form, zod, Select, Popover). It mounts on the first open and stays mounted so later closes animate; the "+" preloads the chunk on `pointerenter` / `focus`.

## Sidebar

- Renders every project from `useMySummary` (`GET /v1/flowboard/users/my-summary`) with no client-side status filter, each with a `GlowDot` by status.
- The "+" renders only for workspace administrators, like every "New project" entry point.
