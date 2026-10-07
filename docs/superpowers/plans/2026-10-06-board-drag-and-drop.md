# Board Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arrastrar una card del board de un proyecto a otra columna para cambiar su estado, aceptando el drop solo en columnas visibles a las que el flujo permite ir según el rol del usuario.

**Architecture:** El backend (PR #29 de `aurora-flowboard-api`) ya devuelve `availableTransitions` por columna en `GET /board`. En el frontend, la regla "¿puede ir de S a T?" es una función pura (`canMoveTo`). Un contexto React del board (`BoardDragProvider`) registra el monitor de Pragmatic DnD y el auto-scroll, guarda `activeDrag` y dispara un move optimista (`useMoveBoardWorkItem`) construido sobre los mismos helpers que `useOptimisticWorkItemMutation`. Las cards solo publican sus datos (`useDraggableCard`); cada columna o celda de swimlane es un destino (`useColumnDropTarget`) que deriva su estilo de una función pura (`getColumnDropState`).

**Tech Stack:** React 19.2 (`useEffectEvent`), TypeScript, Vite, `@tanstack/react-query` v5, Tailwind v4, `@atlaskit/pragmatic-drag-and-drop` 4.x + `@atlaskit/pragmatic-drag-and-drop-auto-scroll` 3.x, Vitest + Testing Library + MSW.

**Spec:** `docs/specs/board-drag-and-drop.spec.md` (aprobada, commit `9f65751`)

## Global Constraints

- **pnpm** exclusivamente. `package.json` y `pnpm-lock.yaml` van en el mismo commit.
- Dependencias nuevas, ambas en `dependencies`: `@atlaskit/pragmatic-drag-and-drop@^4.0.0` y `@atlaskit/pragmatic-drag-and-drop-auto-scroll@^3.2.1`. Ninguna otra.
- **Imports de Pragmatic 4.x:** solo los paths nuevos. Los antiguos (`element/adapter`, `combine`) están `@deprecated` en la 4.0.
  - `@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter` → `draggable`, `dropTargetForElements`, `monitorForElements`
  - `@atlaskit/pragmatic-drag-and-drop-auto-scroll/element` → `autoScrollForElements`
- **Destinos válidos (RF-3):** columna visible **y** distinta del origen **y** presente en `availableTransitions` de la columna origen **y** del mismo lane. Nunca se puede completar ni cancelar por drag.
- **Lane sin agrupación:** `SINGLE_LANE_KEY = 'all'`. Con swimlanes, el lane es `group.key`.
- **Solo arrastra** quien tiene `canEditWorkItems` (`canAddOrUpdateWorkItems && !isViewer`), y nunca una card con su move pendiente.
- **Drop rechazado en el cliente** (columna bloqueada, misma columna, fuera del board, Escape): sin request **y sin toast**.
- **Fallback del toast de error:** `"Couldn't move the work item"`. El toast completo lo arma `useOptimisticMutation`: `"<motivo> — changes reverted"`.
- **El move del board no invalida** `queryKeys.mySummary()` ni `queryKeys.projects.list()`.
- **Orden de una columna** (`GetProjectBoardHandler.cs`): `Priority` desc (Critical > High > Medium > Low, una desconocida al final), luego `createdOnUtc` asc comparado como fecha. Un empate va después de los existentes.
- **Las query keys** salen de `queryKeys`. Todo texto de error pasa por `getErrorMessage`.
- **No hacer `git push`** ni contactar el remoto. Solo commits locales en `feature/drag-and-drop`: un push a `staging` dispara un deploy real.
- Mensajes de commit en inglés, en imperativo, terminados con:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **Timestamps con y sin fracción de segundo** (`…12:00:00Z` vs `…12:00:00.5Z`): la card se inserta por fecha real, no por orden de string. El test va en la Task 3.
2. **Dos cards distintas movidas a la vez:** cada una se marca y se libera por separado, y si una falla no deja a la otra bloqueada. El test va en la Task 4.
3. **Se retira el permiso con la card montada** (pasa a Viewer o el proyecto se cierra): la card deja de ser arrastrable sin re-montarse. El test va en la Task 5.
4. **Arrastre sobre la misma columna de estado en otro lane:** se ve `blocked` y no acepta el drop. El test va en la Task 2.
5. **Datos de un drag ajeno** (un elemento arrastrable que no es una card): el board lo ignora, sin estado ni move. El test va en la Task 2.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/features/projects/types/project.types.ts` | Modify | `availableTransitions?` en `ProjectBoardColumn` |
| `src/features/projects/utils/board-drop-targets.ts` | Create | `canMoveTo(columns, from, to)` |
| `src/features/projects/utils/board-drag-data.ts` | Create | Constantes, tipos y guards de los datos de drag y de drop |
| `src/features/projects/utils/column-drop-state.ts` | Create | `ActiveDrag`, `ColumnDropState`, `getColumnDropState` |
| `src/features/projects/utils/board-order.ts` | Create | `compareBoardItems`, `insertInBoardOrder` |
| `src/features/work-items/constants/work-item-display.ts` | Modify | `getPriorityRank` |
| `src/features/work-items/hooks/useOptimisticWorkItemMutation.ts` | Modify | Helpers `workItemPatches` / `workItemInvalidations`; `updateCard` ordenado |
| `src/features/work-items/hooks/useMoveBoardWorkItem.ts` | Create | `{ move, pendingIds }` |
| `src/features/projects/hooks/useBoardDrag.ts` | Create | Contexto `BoardDragContext` + `useBoardDrag()` |
| `src/features/projects/hooks/useDraggableCard.ts` | Create | Registro `draggable()` de una card |
| `src/features/projects/hooks/useColumnDropTarget.ts` | Create | Registro `dropTargetForElements()` de columna o celda |
| `src/features/projects/components/board-drop-classes.ts` | Create | Clases y estilo por `ColumnDropState` |
| `src/features/projects/components/BoardDragProvider.tsx` | Create | Monitor, auto-scroll, `activeDrag`, drop → move |
| `src/features/projects/components/WorkItemCard.tsx` | Modify | Props `dragLaneKey`, `isDraggable`; opacidad al arrastrar |
| `src/features/projects/components/ProjectBoardPage.tsx` | Modify | Provider, ref del scroll, `BoardColumn` destino; quitar filtro `Cancelled` |
| `src/features/projects/components/BoardSwimlanes.tsx` | Modify | `SwimlaneCell` destino |
| `.claude/rules/projects.md` | Modify | Sección "Drag-and-drop" |
| `docs/specs/board-drag-and-drop.spec.md` | Modify | Dos precisiones de implementación (Task 7) |

---

### Task 1: Tipo del board y regla `canMoveTo`

**Files:**
- Modify: `src/features/projects/types/project.types.ts:1` y `:84-91`
- Create: `src/features/projects/utils/board-drop-targets.ts`
- Test: `src/features/projects/utils/board-drop-targets.test.ts`

**Interfaces:**
- Consumes: `WorkItemTransition` (`{ toStateId: string; toStateName: string }`) de `@/features/work-items/types/work-item.types`.
- Produces:
  - `ProjectBoardColumn.availableTransitions?: WorkItemTransition[]`
  - `canMoveTo(columns: ProjectBoardColumn[], fromStateId: string, toStateId: string): boolean`

- [ ] **Step 1: Agregar el campo al tipo**

En `src/features/projects/types/project.types.ts`, cambiar la línea 1:

```ts
import type { Priority, WorkItemTransition, WorkItemType } from '@/features/work-items/types/work-item.types'
```

y la interfaz `ProjectBoardColumn`:

```ts
export interface ProjectBoardColumn {
  flowStateId: string
  flowStateName: string
  category: StateCategory
  sortOrder: number
  color: string
  workItems: ProjectBoardWorkItem[]
  /**
   * Where the current user may move an item out of this state (already filtered by their
   * project role), including Completed / Cancelled states that aren't board columns. Optional
   * only to tolerate a backend that predates the field; read it as `?? []`.
   */
  availableTransitions?: WorkItemTransition[]
}
```

- [ ] **Step 2: Escribir el test que falla**

Crear `src/features/projects/utils/board-drop-targets.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { makeColumn } from '@/test/fixtures/board'
import { canMoveTo } from './board-drop-targets'

// Mirrors the backend contract: GetProjectBoardHandler.cs returns each column's
// availableTransitions already filtered by the user's role, Completed / Cancelled included.
const columns = [
  makeColumn('todo', [], {
    availableTransitions: [
      { toStateId: 'doing', toStateName: 'Doing' },
      { toStateId: 'done', toStateName: 'Done' }, // a Completed state: not a board column
    ],
  }),
  makeColumn('doing', [], { availableTransitions: [] }),
  makeColumn('review'),
]

describe('canMoveTo', () => {
  it('allows a transition that lands on a board column', () => {
    expect(canMoveTo(columns, 'todo', 'doing')).toBe(true)
  })

  it('rejects a column the flow does not reach from the origin', () => {
    expect(canMoveTo(columns, 'todo', 'review')).toBe(false)
  })

  it('rejects the origin column itself', () => {
    expect(canMoveTo(columns, 'todo', 'todo')).toBe(false)
  })

  it('rejects a permitted destination that is not a board column (Completed / Cancelled)', () => {
    expect(canMoveTo(columns, 'todo', 'done')).toBe(false)
  })

  it('rejects everything from a column without permitted transitions', () => {
    expect(canMoveTo(columns, 'doing', 'todo')).toBe(false)
  })

  it('rejects everything when the backend sent no availableTransitions', () => {
    expect(canMoveTo(columns, 'review', 'todo')).toBe(false)
  })

  it('rejects an origin that is not on the board', () => {
    expect(canMoveTo(columns, 'gone', 'doing')).toBe(false)
  })
})
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `pnpm test src/features/projects/utils/board-drop-targets.test.ts`
Expected: FAIL — `Failed to resolve import "./board-drop-targets"`.

- [ ] **Step 4: Implementar**

Crear `src/features/projects/utils/board-drop-targets.ts`:

```ts
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

/**
 * Whether an item in `fromStateId` may be dropped on the `toStateId` column: the origin column's
 * `availableTransitions` (already filtered by the user's role on the backend) narrowed to the
 * columns this board actually shows. Completed and Cancelled states are never columns, so a drag
 * can't complete or cancel an item.
 */
export function canMoveTo(columns: ProjectBoardColumn[], fromStateId: string, toStateId: string): boolean {
  if (fromStateId === toStateId) return false
  if (!columns.some((col) => col.flowStateId === toStateId)) return false
  const from = columns.find((col) => col.flowStateId === fromStateId)
  return (from?.availableTransitions ?? []).some((t) => t.toStateId === toStateId)
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `pnpm test src/features/projects/utils/board-drop-targets.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Verificar que el test puede fallar**

Cambiar temporalmente `return false` por `return true` en la primera línea del cuerpo de `canMoveTo`, correr el test (debe fallar "rejects the origin column itself") y revertir.

- [ ] **Step 7: Commit**

```bash
git add src/features/projects/types/project.types.ts src/features/projects/utils/board-drop-targets.ts src/features/projects/utils/board-drop-targets.test.ts
git commit -m "Add the board columns' available transitions and the drop rule" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Datos de drag y estado visual de una columna

**Files:**
- Create: `src/features/projects/utils/board-drag-data.ts`
- Create: `src/features/projects/utils/column-drop-state.ts`
- Test: `src/features/projects/utils/board-drag-data.test.ts`
- Test: `src/features/projects/utils/column-drop-state.test.ts`

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces:
  - `SINGLE_LANE_KEY: 'all'`
  - `type WorkItemDragData = { type: 'work-item'; workItemId: string; code: string; fromStateId: string; laneKey: string }` (alias `type`, no `interface`: tiene que ser asignable a `Record<string, unknown>`)
  - `makeWorkItemDragData(fields: Omit<WorkItemDragData, 'type'>): WorkItemDragData`
  - `isWorkItemDragData(data: Record<string | symbol, unknown>): data is WorkItemDragData & Record<string | symbol, unknown>`
  - `type BoardDropTargetData = { stateId: string; laneKey: string }`
  - `isBoardDropTargetData(data: Record<string | symbol, unknown>): data is BoardDropTargetData & Record<string | symbol, unknown>`
  - `interface ActiveDrag { fromStateId: string; laneKey: string }`
  - `type ColumnDropState = 'idle' | 'source' | 'allowed' | 'blocked' | 'over'`
  - `getColumnDropState(args: { activeDrag: ActiveDrag | null; stateId: string; laneKey: string; isOver: boolean; canMoveTo: (fromStateId: string, toStateId: string) => boolean }): ColumnDropState`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/features/projects/utils/board-drag-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isBoardDropTargetData, isWorkItemDragData, makeWorkItemDragData } from './board-drag-data'

describe('isWorkItemDragData', () => {
  it('recognizes the data a board card attaches to its drag', () => {
    const data = makeWorkItemDragData({ workItemId: 'wi-1', code: 'TST-1', fromStateId: 'todo', laneKey: 'all' })
    expect(isWorkItemDragData(data)).toBe(true)
  })

  it('ignores a drag that does not come from a board card', () => {
    expect(isWorkItemDragData({ type: 'column', id: 'todo' })).toBe(false)
    expect(isWorkItemDragData({})).toBe(false)
  })

  it('ignores card-typed data with a missing field', () => {
    expect(isWorkItemDragData({ type: 'work-item', workItemId: 'wi-1', code: 'TST-1', laneKey: 'all' })).toBe(false)
  })
})

describe('isBoardDropTargetData', () => {
  it('recognizes a column or cell drop target', () => {
    expect(isBoardDropTargetData({ stateId: 'todo', laneKey: 'all' })).toBe(true)
  })

  it('ignores anything else', () => {
    expect(isBoardDropTargetData({ stateId: 'todo' })).toBe(false)
  })
})
```

Crear `src/features/projects/utils/column-drop-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getColumnDropState, type ActiveDrag } from './column-drop-state'

// todo → doing is the only permitted move.
const canMoveTo = (from: string, to: string) => from === 'todo' && to === 'doing'
const dragFromTodo: ActiveDrag = { fromStateId: 'todo', laneKey: 'lane-a' }

function stateOf(stateId: string, overrides: { activeDrag?: ActiveDrag | null; laneKey?: string; isOver?: boolean } = {}) {
  return getColumnDropState({
    activeDrag: overrides.activeDrag === undefined ? dragFromTodo : overrides.activeDrag,
    stateId,
    laneKey: overrides.laneKey ?? 'lane-a',
    isOver: overrides.isOver ?? false,
    canMoveTo,
  })
}

describe('getColumnDropState', () => {
  it('is idle while nothing is being dragged', () => {
    expect(stateOf('doing', { activeDrag: null })).toBe('idle')
  })

  it('marks the origin column as the source', () => {
    expect(stateOf('todo')).toBe('source')
  })

  it('marks a permitted column as allowed', () => {
    expect(stateOf('doing')).toBe('allowed')
  })

  it('marks a permitted column under the pointer as over', () => {
    expect(stateOf('doing', { isOver: true })).toBe('over')
  })

  it('marks a column the flow does not reach as blocked', () => {
    expect(stateOf('review')).toBe('blocked')
  })

  it('blocks every cell of another lane, even the permitted state and the origin state', () => {
    expect(stateOf('doing', { laneKey: 'lane-b' })).toBe('blocked')
    expect(stateOf('todo', { laneKey: 'lane-b' })).toBe('blocked')
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `pnpm test src/features/projects/utils/board-drag-data.test.ts src/features/projects/utils/column-drop-state.test.ts`
Expected: FAIL — no se resuelven los imports `./board-drag-data` y `./column-drop-state`.

- [ ] **Step 3: Implementar `board-drag-data.ts`**

```ts
/** The lane every column shares when the board isn't grouped into swimlanes. */
export const SINGLE_LANE_KEY = 'all'

// Type aliases, not interfaces: Pragmatic's data is `Record<string, unknown>`, and only an
// object type alias is assignable to an index signature.

/** What a board card attaches to its drag (Pragmatic's `getInitialData`). */
export type WorkItemDragData = {
  type: 'work-item'
  workItemId: string
  code: string
  fromStateId: string
  laneKey: string
}

export function makeWorkItemDragData(fields: Omit<WorkItemDragData, 'type'>): WorkItemDragData {
  return { type: 'work-item', ...fields }
}

/** Narrows a drag's data to a board card's, so drags from anything else are ignored. */
export function isWorkItemDragData(
  data: Record<string | symbol, unknown>,
): data is WorkItemDragData & Record<string | symbol, unknown> {
  return (
    data.type === 'work-item' &&
    typeof data.workItemId === 'string' &&
    typeof data.code === 'string' &&
    typeof data.fromStateId === 'string' &&
    typeof data.laneKey === 'string'
  )
}

/** What a column (or a swimlane cell) exposes as a drop target (Pragmatic's `getData`). */
export type BoardDropTargetData = {
  stateId: string
  laneKey: string
}

export function isBoardDropTargetData(
  data: Record<string | symbol, unknown>,
): data is BoardDropTargetData & Record<string | symbol, unknown> {
  return typeof data.stateId === 'string' && typeof data.laneKey === 'string'
}
```

- [ ] **Step 4: Implementar `column-drop-state.ts`**

```ts
/** The drag in progress, as the columns need it to paint themselves. */
export interface ActiveDrag {
  fromStateId: string
  laneKey: string
}

export type ColumnDropState = 'idle' | 'source' | 'allowed' | 'blocked' | 'over'

/**
 * How a column (or a swimlane cell) looks while a card is dragged: neutral when it's the origin,
 * highlighted when the card may land on it, dimmed otherwise. Cells of another lane are always
 * blocked: a drop only changes the state, never the grouped field.
 */
export function getColumnDropState({
  activeDrag,
  stateId,
  laneKey,
  isOver,
  canMoveTo,
}: {
  activeDrag: ActiveDrag | null
  stateId: string
  laneKey: string
  isOver: boolean
  canMoveTo: (fromStateId: string, toStateId: string) => boolean
}): ColumnDropState {
  if (!activeDrag) return 'idle'
  if (activeDrag.laneKey !== laneKey) return 'blocked'
  if (activeDrag.fromStateId === stateId) return 'source'
  if (!canMoveTo(activeDrag.fromStateId, stateId)) return 'blocked'
  return isOver ? 'over' : 'allowed'
}
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `pnpm test src/features/projects/utils/board-drag-data.test.ts src/features/projects/utils/column-drop-state.test.ts`
Expected: PASS (5 + 6 tests).

- [ ] **Step 6: Verificar que un test puede fallar**

Quitar temporalmente la línea `if (activeDrag.laneKey !== laneKey) return 'blocked'`, correr (debe fallar "blocks every cell of another lane…") y revertir.

- [ ] **Step 7: Commit**

```bash
git add src/features/projects/utils/board-drag-data.ts src/features/projects/utils/board-drag-data.test.ts src/features/projects/utils/column-drop-state.ts src/features/projects/utils/column-drop-state.test.ts
git commit -m "Add the board drag data and the column drop state" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Orden del board, inserción ordenada y helpers de la mutación

**Files:**
- Modify: `src/features/work-items/constants/work-item-display.ts` (después de `getPriorityBars`, ~línea 46)
- Create: `src/features/projects/utils/board-order.ts`
- Modify: `src/features/work-items/hooks/useOptimisticWorkItemMutation.ts` (archivo completo)
- Test: `src/features/projects/utils/board-order.test.ts`
- Regresión: `src/features/work-items/hooks/useMoveWorkItem.test.ts` (**sin cambios**)

**Interfaces:**
- Consumes: `Priority` de `work-item.types`; `ProjectBoardWorkItem`, `ProjectBoardColumn`.
- Produces:
  - `getPriorityRank(priority: Priority): number` (Low 0 … Critical 3; desconocida −1)
  - `compareBoardItems(a: ProjectBoardWorkItem, b: ProjectBoardWorkItem): number`
  - `insertInBoardOrder(items: ProjectBoardWorkItem[], item: ProjectBoardWorkItem): ProjectBoardWorkItem[]`
  - `interface WorkItemTarget { workItemId: string; code: string; projectId?: string }`
  - `interface WorkItemPatchSet { detail: Partial<WorkItemDetailResponse>; card?: Partial<ProjectBoardWorkItem>; toStateId?: string }`
  - `workItemPatches(target: WorkItemTarget, changes: WorkItemPatchSet): CachePatch[]`
  - `workItemInvalidations(target: WorkItemTarget, error: Error | null, extra?: QueryKey[]): InvalidateQueryFilters[]`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/projects/utils/board-order.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Priority } from '@/features/work-items/types/work-item.types'
import { makeBoardItem } from '@/test/fixtures/board'
import { insertInBoardOrder } from './board-order'

// Mirrors GetProjectBoardHandler.cs: OrderByDescending(Priority).ThenBy(CreatedOnUtc).
const ids = (items: { workItemId: string }[]) => items.map((wi) => wi.workItemId)

describe('insertInBoardOrder', () => {
  const critical = makeBoardItem({ workItemId: 'critical', priority: 'Critical' })
  const medium = makeBoardItem({ workItemId: 'medium', priority: 'Medium', createdOnUtc: '2026-09-01T12:00:00Z' })
  const low = makeBoardItem({ workItemId: 'low', priority: 'Low' })
  const column = [critical, medium, low]

  it('places a higher priority before lower ones', () => {
    const high = makeBoardItem({ workItemId: 'high', priority: 'High' })
    expect(ids(insertInBoardOrder(column, high))).toEqual(['critical', 'high', 'medium', 'low'])
  })

  it('breaks a priority tie by creation date, oldest first', () => {
    const older = makeBoardItem({ workItemId: 'older', priority: 'Medium', createdOnUtc: '2026-08-01T12:00:00Z' })
    const newer = makeBoardItem({ workItemId: 'newer', priority: 'Medium', createdOnUtc: '2026-10-01T12:00:00Z' })
    expect(ids(insertInBoardOrder(column, older))).toEqual(['critical', 'older', 'medium', 'low'])
    expect(ids(insertInBoardOrder(column, newer))).toEqual(['critical', 'medium', 'newer', 'low'])
  })

  it('compares timestamps as dates when only one has fractional seconds', () => {
    // As strings, '…00.500Z' < '…00Z' ('.' sorts before 'Z'), which would put the newer one first.
    const sameSecondLater = makeBoardItem({ workItemId: 'later', priority: 'Medium', createdOnUtc: '2026-09-01T12:00:00.500Z' })
    expect(ids(insertInBoardOrder(column, sameSecondLater))).toEqual(['critical', 'medium', 'later', 'low'])
  })

  it('puts a full tie after the existing item', () => {
    const twin = makeBoardItem({ workItemId: 'twin', priority: 'Medium', createdOnUtc: '2026-09-01T12:00:00Z' })
    expect(ids(insertInBoardOrder(column, twin))).toEqual(['critical', 'medium', 'twin', 'low'])
  })

  it('puts a priority the frontend does not know yet last', () => {
    const unknown = makeBoardItem({ workItemId: 'unknown', priority: 'Blocker' as Priority })
    expect(ids(insertInBoardOrder(column, unknown))).toEqual(['critical', 'medium', 'low', 'unknown'])
  })

  it('handles an empty column', () => {
    expect(ids(insertInBoardOrder([], low))).toEqual(['low'])
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test src/features/projects/utils/board-order.test.ts`
Expected: FAIL — `Failed to resolve import "./board-order"`.

- [ ] **Step 3: Agregar `getPriorityRank`**

En `src/features/work-items/constants/work-item-display.ts`, debajo de `getPriorityBars`:

```ts
/** The backend enum's order (`Priority.cs`): higher is more urgent. */
const PRIORITY_RANK: Record<Priority, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }

/** An unknown priority ranks below Low, so it sorts last. */
export function getPriorityRank(priority: Priority): number {
  return PRIORITY_RANK[priority] ?? -1
}
```

- [ ] **Step 4: Implementar `board-order.ts`**

Crear `src/features/projects/utils/board-order.ts`:

```ts
import { getPriorityRank } from '@/features/work-items/constants/work-item-display'
import type { ProjectBoardWorkItem } from '@/features/projects/types/project.types'

/**
 * The order the backend sends a column in (GetProjectBoardHandler.cs): priority descending, then
 * oldest first. Timestamps are compared as dates, not strings: one may carry fractional seconds
 * and another not, and '.' sorts before 'Z'.
 */
export function compareBoardItems(a: ProjectBoardWorkItem, b: ProjectBoardWorkItem): number {
  const byPriority = getPriorityRank(b.priority) - getPriorityRank(a.priority)
  if (byPriority !== 0) return byPriority
  return Date.parse(a.createdOnUtc) - Date.parse(b.createdOnUtc)
}

/** `items` with `item` where the backend would place it; a tie goes after the existing items. */
export function insertInBoardOrder(items: ProjectBoardWorkItem[], item: ProjectBoardWorkItem): ProjectBoardWorkItem[] {
  const index = items.findIndex((existing) => compareBoardItems(item, existing) < 0)
  return index === -1 ? [...items, item] : [...items.slice(0, index), item, ...items.slice(index)]
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `pnpm test src/features/projects/utils/board-order.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Reescribir `useOptimisticWorkItemMutation.ts` con helpers e inserción ordenada**

Reemplazar el archivo completo por:

```ts
import type { InvalidateQueryFilters, QueryKey } from '@tanstack/react-query'
import { cachePatch, useOptimisticMutation, type CachePatch } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import type { ProjectBoardColumn, ProjectBoardWorkItem } from '@/features/projects/types/project.types'
import { insertInBoardOrder } from '@/features/projects/utils/board-order'
import type { WorkItemDetailResponse } from '../types/work-item.types'
import { mayBeStaleProjectRole } from '../utils/stale-project-role'

/** The work item a mutation targets. Omit `projectId` when the change never shows on a board card. */
export interface WorkItemTarget {
  workItemId: string
  code: string
  projectId?: string
}

/** One call's optimistic changes, already worked out from its variables. */
export interface WorkItemPatchSet {
  /** Fields to change on the work-item detail. */
  detail: Partial<WorkItemDetailResponse>
  /** Fields to change on its board card. The two shapes differ (the card has `component`, the detail `componentName`). */
  card?: Partial<ProjectBoardWorkItem>
  /** Moves the card to this flow state's column, after patching it. */
  toStateId?: string
}

interface OptimisticWorkItemOptions<TVars> extends WorkItemTarget {
  mutationFn: (vars: TVars) => Promise<unknown>
  patchDetail: (vars: TVars) => Partial<WorkItemDetailResponse>
  patchCard?: (vars: TVars) => Partial<ProjectBoardWorkItem>
  moveToState?: (vars: TVars) => string
  /** Other queries the change affects beyond detail, activity and board — e.g. counters. */
  alsoInvalidate?: (vars: TVars) => QueryKey[]
}

function updateCard(
  columns: ProjectBoardColumn[],
  workItemId: string,
  patch: Partial<ProjectBoardWorkItem>,
  toStateId: string | undefined,
): ProjectBoardColumn[] {
  if (toStateId === undefined) {
    return columns.map((col) => ({
      ...col,
      workItems: col.workItems.map((wi) => (wi.workItemId === workItemId ? { ...wi, ...patch } : wi)),
    }))
  }

  const card = columns.flatMap((col) => col.workItems).find((wi) => wi.workItemId === workItemId)
  if (!card) return columns

  // Lands where the backend will sort it, so the refetch doesn't make it jump.
  const moved = { ...card, ...patch }
  return columns.map((col) => {
    const workItems = col.workItems.filter((wi) => wi.workItemId !== workItemId)
    return col.flowStateId === toStateId ? { ...col, workItems: insertInBoardOrder(workItems, moved) } : { ...col, workItems }
  })
}

/** The cache patches of one optimistic work-item edit: its detail and, given a project, its board card. */
export function workItemPatches(target: WorkItemTarget, changes: WorkItemPatchSet): CachePatch[] {
  const patches: CachePatch[] = [
    cachePatch<WorkItemDetailResponse>(queryKeys.workItems.detail(target.code), (old) => ({ ...old, ...changes.detail })),
  ]
  if (target.projectId && (changes.card || changes.toStateId !== undefined)) {
    patches.push(
      cachePatch<ProjectBoardColumn[]>(queryKeys.projects.board(target.projectId), (old) =>
        updateCard(old, target.workItemId, changes.card ?? {}, changes.toStateId),
      ),
    )
  }
  return patches
}

/**
 * What a settled work-item mutation refetches: the detail, the activity tabs (every mutation
 * writes a change-log entry, so Change Log and State History would go stale otherwise), the
 * board when there is a project, then `extra`.
 */
export function workItemInvalidations(
  target: WorkItemTarget,
  error: Error | null,
  extra: QueryKey[] = [],
): InvalidateQueryFilters[] {
  const filters: InvalidateQueryFilters[] = [
    { queryKey: queryKeys.workItems.detail(target.code) },
    { queryKey: queryKeys.workItems.activity(target.workItemId) },
  ]
  if (target.projectId) filters.push({ queryKey: queryKeys.projects.board(target.projectId) })
  extra.forEach((queryKey) => filters.push({ queryKey }))
  // Refreshes the members' roles, so the UI turns read-only or drops the Viewer from the
  // assignee options. By prefix, because not every caller passes `projectId`.
  if (mayBeStaleProjectRole(error)) filters.push({ queryKey: queryKeys.projects.details() })
  return filters
}

/**
 * An optimistic edit to one work item: patches its detail and, when given a project, its board
 * card. On settle it refetches the detail, the activity tabs and the board.
 */
export function useOptimisticWorkItemMutation<TVars>({
  workItemId,
  code,
  projectId,
  mutationFn,
  patchDetail,
  patchCard,
  moveToState,
  alsoInvalidate,
}: OptimisticWorkItemOptions<TVars>) {
  const target: WorkItemTarget = { workItemId, code, projectId }

  return useOptimisticMutation<TVars>({
    mutationFn,
    patches: (vars) =>
      workItemPatches(target, { detail: patchDetail(vars), card: patchCard?.(vars), toStateId: moveToState?.(vars) }),
    invalidate: (vars, error) => workItemInvalidations(target, error, alsoInvalidate?.(vars)),
  })
}
```

- [ ] **Step 7: Correr toda la suite (regresión del refactor)**

Run: `pnpm test`
Expected: PASS. En particular, los 4 tests de `useMoveWorkItem.test.ts` siguen en verde **sin modificarlos**: el orden `[alreadyDone, card]` se mantiene porque los fixtures empatan en prioridad y fecha, y la lista de invalidaciones queda igual.

- [ ] **Step 8: Lint y tipos**

Run: `pnpm lint && pnpm build`
Expected: sin errores.

- [ ] **Step 9: Commit**

```bash
git add src/features/work-items/constants/work-item-display.ts src/features/projects/utils/board-order.ts src/features/projects/utils/board-order.test.ts src/features/work-items/hooks/useOptimisticWorkItemMutation.ts
git commit -m "Insert moved cards in board order and extract the work-item mutation helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `useMoveBoardWorkItem`

**Files:**
- Create: `src/features/work-items/hooks/useMoveBoardWorkItem.ts`
- Test: `src/features/work-items/hooks/useMoveBoardWorkItem.test.ts`

**Interfaces:**
- Consumes: `workItemPatches`, `workItemInvalidations`, `WorkItemTarget` (Task 3); `useOptimisticMutation` (`@/shared/hooks/useOptimisticMutation`); `moveWorkItem(workItemId, toStateId)` (`../services/work-item.service`).
- Produces:
  - `interface MoveBoardWorkItemVars { workItemId: string; code: string; toStateId: string; toStateName: string }`
  - `useMoveBoardWorkItem(projectId: string): { move: (vars: MoveBoardWorkItemVars) => void; pendingIds: ReadonlySet<string> }`

> **Por qué `mutateAsync`:** en React Query v5, los callbacks que se pasan a `mutate(vars, { onSettled })` solo se disparan para la **última** llamada del mismo observer. Con dos cards movidas a la vez, la primera nunca se liberaría. La promesa de `mutateAsync` es por llamada. El error ya lo manejan `useOptimisticMutation` (rollback + toast) y el `.catch` vacío, que solo evita un rechazo no manejado.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/work-items/hooks/useMoveBoardWorkItem.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'
import { makeBoardItem, makeColumn } from '@/test/fixtures/board'
import { apiUrl, server } from '@/test/msw-server'
import { createTestQueryClient, createWrapper } from '@/test/query-wrapper'
import { queryKeys } from '@/shared/lib/query-keys'
import { useMoveBoardWorkItem } from './useMoveBoardWorkItem'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const PROJECT_ID = 'p1'
const MOVE_URL = apiUrl('/v1/flowboard/work-items/:workItemId/move')

const card = makeBoardItem({ workItemId: 'wi-drag', code: 'TST-77', priority: 'Medium' })
const second = makeBoardItem({ workItemId: 'wi-second', code: 'TST-78', priority: 'Low' })
const urgent = makeBoardItem({ workItemId: 'wi-urgent', priority: 'High' })
const minor = makeBoardItem({ workItemId: 'wi-minor', priority: 'Low', createdOnUtc: '2026-08-01T12:00:00Z' })

const board: ProjectBoardColumn[] = [
  makeColumn('todo', [card, second], { flowStateName: 'To Do' }),
  makeColumn('doing', [urgent, minor], { flowStateName: 'Doing' }),
]

const boardKey = queryKeys.projects.board(PROJECT_ID)
const moveCard = { workItemId: card.workItemId, code: card.code, toStateId: 'doing', toStateName: 'Doing' }
const moveSecond = { workItemId: second.workItemId, code: second.code, toStateId: 'doing', toStateName: 'Doing' }

let client: QueryClient

beforeEach(() => {
  client = createTestQueryClient()
  client.setQueryData(boardKey, board)
})

function renderMove() {
  return renderHook(() => useMoveBoardWorkItem(PROJECT_ID), { wrapper: createWrapper(client) })
}

const columnIds = (stateId: string) =>
  client
    .getQueryData<ProjectBoardColumn[]>(boardKey)
    ?.find((c) => c.flowStateId === stateId)
    ?.workItems.map((wi) => wi.workItemId)

describe('useMoveBoardWorkItem', () => {
  it('moves the card into its sorted place and keeps it pending until the server answers', async () => {
    let respond!: () => void
    const answered = new Promise<void>((resolve) => (respond = resolve))
    server.use(
      http.patch(MOVE_URL, async () => {
        await answered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() => expect(columnIds('doing')).toEqual([urgent.workItemId, card.workItemId, minor.workItemId]))
    expect(columnIds('todo')).toEqual([second.workItemId])
    expect(result.current.pendingIds.has(card.workItemId)).toBe(true)

    respond()
    await waitFor(() => expect(result.current.pendingIds.has(card.workItemId)).toBe(false))
  })

  it('releases each card on its own when two cards move at once', async () => {
    let respondFirst!: () => void
    const firstAnswered = new Promise<void>((resolve) => (respondFirst = resolve))
    server.use(
      http.patch(MOVE_URL, async ({ params }) => {
        if (params.workItemId === card.workItemId) await firstAnswered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderMove()

    act(() => result.current.move(moveCard))
    act(() => result.current.move(moveSecond))

    await waitFor(() => expect(result.current.pendingIds.has(second.workItemId)).toBe(false))
    expect(result.current.pendingIds.has(card.workItemId)).toBe(true)

    respondFirst()
    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
  })

  it('rolls the board back, toasts the backend reason and releases the card when the move is rejected', async () => {
    server.use(
      http.patch(MOVE_URL, () =>
        HttpResponse.json(
          { detail: 'No transition is defined between the current state and the target state' },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No transition is defined between the current state and the target state — changes reverted',
      ),
    )
    expect(client.getQueryData(boardKey)).toEqual(board)
    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
  })

  it('toasts the fallback when the network fails', async () => {
    server.use(http.patch(MOVE_URL, () => HttpResponse.error()))
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't move the work item — changes reverted"),
    )
    expect(client.getQueryData(boardKey)).toEqual(board)
  })

  it('invalidates the detail, activity and board, but not the Sidebar summary or the project list', async () => {
    server.use(http.patch(MOVE_URL, () => new HttpResponse(null, { status: 204 })))
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    // pendingIds empties in mutateAsync's finally, after onSettled has invalidated.
    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      queryKeys.workItems.detail(card.code),
      queryKeys.workItems.activity(card.workItemId),
      boardKey,
    ])
  })

  it('also refreshes every project detail when the move is forbidden (the role may have changed)', async () => {
    server.use(
      http.patch(MOVE_URL, () =>
        HttpResponse.json({ detail: 'Project members with the Viewer role cannot modify work items' }, { status: 403 }),
      ),
    )
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.projects.details())
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test src/features/work-items/hooks/useMoveBoardWorkItem.test.ts`
Expected: FAIL — `Failed to resolve import "./useMoveBoardWorkItem"`.

- [ ] **Step 3: Implementar**

Crear `src/features/work-items/hooks/useMoveBoardWorkItem.ts`:

```ts
import { useCallback, useState } from 'react'
import { useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { moveWorkItem } from '../services/work-item.service'
import { workItemInvalidations, workItemPatches, type WorkItemTarget } from './useOptimisticWorkItemMutation'

export interface MoveBoardWorkItemVars {
  workItemId: string
  code: string
  toStateId: string
  toStateName: string
}

const NO_PENDING: ReadonlySet<string> = new Set()

/**
 * The board's drag-and-drop move: one hook for every card, so the work item comes with each call
 * instead of with the hook. `pendingIds` holds the cards whose move hasn't settled, so the board
 * can stop them from being dragged again mid-request.
 */
export function useMoveBoardWorkItem(projectId: string) {
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(NO_PENDING)

  const { mutateAsync } = useOptimisticMutation<MoveBoardWorkItemVars>({
    mutationFn: ({ workItemId, toStateId }) => moveWorkItem(workItemId, toStateId),
    patches: ({ workItemId, code, toStateId, toStateName }) =>
      workItemPatches(
        { workItemId, code, projectId },
        {
          detail: { flowStateId: toStateId, flowStateName: toStateName },
          card: { flowStateId: toStateId, flowStateName: toStateName },
          toStateId,
        },
      ),
    // A drag only moves between Active states, so the open/closed counters behind
    // queryKeys.mySummary() and queryKeys.projects.list() don't change. Add them here if the
    // board ever gets a Completed drop zone.
    invalidate: ({ workItemId, code }, error) => {
      const target: WorkItemTarget = { workItemId, code, projectId }
      return workItemInvalidations(target, error)
    },
    errorMessage: "Couldn't move the work item",
  })

  const move = useCallback(
    (vars: MoveBoardWorkItemVars) => {
      setPendingIds((prev) => new Set(prev).add(vars.workItemId))
      // mutateAsync settles per call; mutate's per-call callbacks would fire only for the last
      // card when two moves overlap. The error is already rolled back and toasted.
      mutateAsync(vars)
        .catch(() => {})
        .finally(() =>
          setPendingIds((prev) => {
            const next = new Set(prev)
            next.delete(vars.workItemId)
            return next
          }),
        )
    },
    [mutateAsync],
  )

  return { move, pendingIds }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test src/features/work-items/hooks/useMoveBoardWorkItem.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Verificar que el test de concurrencia puede fallar**

Cambiar temporalmente `mutateAsync(vars).catch(() => {}).finally(...)` por `mutate(vars, { onSettled: () => setPendingIds(...) })` (desestructurando `mutate`). Correr: "releases each card on its own…" debe fallar. Revertir.

- [ ] **Step 6: Lint, tipos y suite completa**

Run: `pnpm lint && pnpm build && pnpm test`
Expected: sin errores; todo en verde.

- [ ] **Step 7: Commit**

```bash
git add src/features/work-items/hooks/useMoveBoardWorkItem.ts src/features/work-items/hooks/useMoveBoardWorkItem.test.ts
git commit -m "Add the board-level work-item move with per-card pending state" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Dependencias, contexto del board y card arrastrable

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (vía `pnpm add`)
- Create: `src/features/projects/hooks/useBoardDrag.ts`
- Create: `src/features/projects/hooks/useDraggableCard.ts`
- Modify: `src/features/projects/components/WorkItemCard.tsx:1` (imports), `:49-65` (firma, ref, clase)
- Test: `src/features/projects/components/WorkItemCard.test.tsx`

**Interfaces:**
- Consumes: `SINGLE_LANE_KEY`, `makeWorkItemDragData`, `WorkItemDragData` (Task 2); `ActiveDrag` (Task 2).
- Produces:
  - `interface BoardDragContextValue { enabled: boolean; activeDrag: ActiveDrag | null; canMoveTo: (fromStateId: string, toStateId: string) => boolean; pendingIds: ReadonlySet<string> }`
  - `BoardDragContext` (default: deshabilitado) y `useBoardDrag(): BoardDragContextValue`
  - `useDraggableCard(ref: RefObject<HTMLElement | null>, options: { enabled: boolean } & Omit<WorkItemDragData, 'type'>): boolean` (devuelve `isDragging`)
  - `WorkItemCard` acepta `dragLaneKey?: string` (default `SINGLE_LANE_KEY`) e `isDraggable?: boolean` (default `false`)

- [ ] **Step 1: Instalar las dependencias**

Run: `pnpm add @atlaskit/pragmatic-drag-and-drop@^4.0.0 @atlaskit/pragmatic-drag-and-drop-auto-scroll@^3.2.1`
Expected: ambas aparecen en `dependencies` de `package.json` y cambia `pnpm-lock.yaml`. Revisar con `git status` que no haya otros archivos modificados.

- [ ] **Step 2: Escribir el test que falla**

Crear `src/features/projects/components/WorkItemCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { makeBoardItem } from '@/test/fixtures/board'
import { WorkItemCard } from './WorkItemCard'

const item = makeBoardItem({ code: 'TST-500', title: 'Drag me' })

function cardElement() {
  // Pragmatic's draggable() marks the card's root with draggable="true".
  return screen.getByRole('button', { name: 'TST-500: Drag me' }).closest('[draggable="true"]')
}

function ui(isDraggable?: boolean) {
  return (
    <TooltipProvider>
      <WorkItemCard item={item} onSelect={vi.fn()} isDraggable={isDraggable} />
    </TooltipProvider>
  )
}

describe('WorkItemCard dragging', () => {
  it('can be dragged when the board allows it', () => {
    render(ui(true))
    expect(cardElement()).not.toBeNull()
  })

  it('cannot be dragged by default (Viewer, read-only project, move pending)', () => {
    render(ui())
    expect(cardElement()).toBeNull()
  })

  it('stops being draggable when the permission is withdrawn while it is on screen', () => {
    const { rerender } = render(ui(true))
    rerender(ui(false))
    expect(cardElement()).toBeNull()
  })
})
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `pnpm test src/features/projects/components/WorkItemCard.test.tsx`
Expected: FAIL — "can be dragged when the board allows it" (no existe `draggable="true"`). Los otros dos pasan de entrada; el primero es el que guía la implementación.

- [ ] **Step 4: Crear el contexto `useBoardDrag.ts`**

```ts
import { createContext, use } from 'react'
import type { ActiveDrag } from '@/features/projects/utils/column-drop-state'

export interface BoardDragContextValue {
  /** Whether the current user may drag cards at all (`canEditWorkItems`). */
  enabled: boolean
  /** The drag in progress, or null. Changes only when a drag starts and ends. */
  activeDrag: ActiveDrag | null
  canMoveTo: (fromStateId: string, toStateId: string) => boolean
  /** Cards whose move hasn't settled yet; they can't be dragged again until it does. */
  pendingIds: ReadonlySet<string>
}

const NO_PENDING: ReadonlySet<string> = new Set()

/** Outside a `BoardDragProvider` nothing is draggable and nothing accepts a drop. */
export const BoardDragContext = createContext<BoardDragContextValue>({
  enabled: false,
  activeDrag: null,
  canMoveTo: () => false,
  pendingIds: NO_PENDING,
})

export function useBoardDrag(): BoardDragContextValue {
  return use(BoardDragContext)
}
```

- [ ] **Step 5: Crear `useDraggableCard.ts`**

```ts
import { useEffect, useState, type RefObject } from 'react'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { makeWorkItemDragData, type WorkItemDragData } from '@/features/projects/utils/board-drag-data'

/**
 * Makes a board card draggable while `enabled`. The card only says what it is and where it sits;
 * whether it may land somewhere is decided by the drop targets. Returns whether it is the card
 * being dragged.
 */
export function useDraggableCard(
  ref: RefObject<HTMLElement | null>,
  { enabled, workItemId, code, fromStateId, laneKey }: { enabled: boolean } & Omit<WorkItemDragData, 'type'>,
): boolean {
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return
    return draggable({
      element,
      getInitialData: () => makeWorkItemDragData({ workItemId, code, fromStateId, laneKey }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [ref, enabled, workItemId, code, fromStateId, laneKey])

  return isDragging
}
```

- [ ] **Step 6: Hacer arrastrable `WorkItemCard`**

En `src/features/projects/components/WorkItemCard.tsx`:

Imports (línea 1 y nuevas):

```tsx
import { memo, useRef } from 'react'
import { cn } from '@/lib/utils'
// …imports existentes sin cambios…
import { useDraggableCard } from '@/features/projects/hooks/useDraggableCard'
import { SINGLE_LANE_KEY } from '@/features/projects/utils/board-drag-data'
```

Reemplazar la firma y la apertura del `<div>` raíz (líneas 49-65) por:

```tsx
export const WorkItemCard = memo(function WorkItemCard({
  item,
  onSelect,
  dragLaneKey = SINGLE_LANE_KEY,
  isDraggable = false,
}: {
  item: ProjectBoardWorkItem
  onSelect: (code: string) => void
  /** The swimlane the card sits in (`SINGLE_LANE_KEY` without grouping); it can only be dropped in that lane. */
  dragLaneKey?: string
  /** Primitive on purpose: a per-render object or callback here would defeat the `memo`. */
  isDraggable?: boolean
}) {
  const { icon: TypeIcon, className: typeClass, label: typeLabel } = getWorkItemTypeConfig(item.type)
  const priorityLabel = getPriorityBars(item.priority).label
  const ref = useRef<HTMLDivElement>(null)
  const isDragging = useDraggableCard(ref, {
    enabled: isDraggable,
    workItemId: item.workItemId,
    code: item.code,
    fromStateId: item.flowStateId,
    laneKey: dragLaneKey,
  })

  return (
    // The whole card stays clickable for the pointer; the keyboard reaches it through the title,
    // a real button (Tab, Enter/Space) that the card shows a focus ring for. A native drag never
    // fires the click, so dragging doesn't open the detail.
    <div
      ref={ref}
      onClick={() => onSelect(item.code)}
      className={cn(
        'bg-background border border-border rounded-lg p-3 flex flex-col gap-2.5 hover:border-foreground/20 transition-colors cursor-pointer has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50',
        isDragging && 'opacity-40',
      )}
    >
```

El resto del componente queda igual.

- [ ] **Step 7: Correr el test y verificar que pasa**

Run: `pnpm test src/features/projects/components/WorkItemCard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Lint, tipos y suite completa**

Run: `pnpm lint && pnpm build && pnpm test`
Expected: sin errores; todo en verde. (`ProjectBoardPage` y `BoardSwimlanes` todavía no pasan las props nuevas, y los defaults las dejan sin drag.)

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml src/features/projects/hooks/useBoardDrag.ts src/features/projects/hooks/useDraggableCard.ts src/features/projects/components/WorkItemCard.tsx src/features/projects/components/WorkItemCard.test.tsx
git commit -m "Add Pragmatic drag and drop and make board cards draggable" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Destinos de drop, provider e integración en el board

**Files:**
- Create: `src/features/projects/hooks/useColumnDropTarget.ts`
- Create: `src/features/projects/components/board-drop-classes.ts`
- Create: `src/features/projects/components/BoardDragProvider.tsx`
- Modify: `src/features/projects/components/ProjectBoardPage.tsx` (imports; `BoardColumn` ~64-94; `columns` ~143-146; contenedor del board ~305-335)
- Modify: `src/features/projects/components/BoardSwimlanes.tsx` (imports; celdas ~145-153)

**Interfaces:**
- Consumes:
  - Task 1: `canMoveTo`
  - Task 2: `isWorkItemDragData`, `isBoardDropTargetData`, `SINGLE_LANE_KEY`, `BoardDropTargetData`, `getColumnDropState`, `ActiveDrag`, `ColumnDropState`
  - Task 4: `useMoveBoardWorkItem`
  - Task 5: `BoardDragContext`, `useBoardDrag`, las props de `WorkItemCard`
- Produces:
  - `useColumnDropTarget(ref: RefObject<HTMLElement | null>, target: BoardDropTargetData): ColumnDropState`
  - `boardDropClassName(state: ColumnDropState): string` y `dropRingStyle(hex: string): CSSProperties`
  - `<BoardDragProvider projectId columns enabled scrollContainerRef>{children}</BoardDragProvider>`

> **Por qué `useEffectEvent`:** el monitor y los destinos se registran una vez por montaje (deps `enabled`, `stateId`, `laneKey`), pero sus callbacks leen las columnas y `canMoveTo` más recientes. Re-registrarlos en cada refetch del board podría hacer que un monitor nuevo se pierda el `onDrop` del drag en curso. React 19.2 trae `useEffectEvent` estable. Una función de efecto **no** se pasa por props ni por contexto; solo se llama desde los callbacks registrados en el efecto.

- [ ] **Step 1: Crear `useColumnDropTarget.ts`**

```ts
import { useEffect, useEffectEvent, useState, type RefObject } from 'react'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { useBoardDrag } from '@/features/projects/hooks/useBoardDrag'
import { isWorkItemDragData, type BoardDropTargetData } from '@/features/projects/utils/board-drag-data'
import { getColumnDropState, type ColumnDropState } from '@/features/projects/utils/column-drop-state'

/**
 * Makes a column (or a swimlane cell) a drop target that accepts only cards of its own lane whose
 * move to this state the flow permits. Returns how the column should look during the drag.
 */
export function useColumnDropTarget(
  ref: RefObject<HTMLElement | null>,
  { stateId, laneKey }: BoardDropTargetData,
): ColumnDropState {
  const { enabled, activeDrag, canMoveTo } = useBoardDrag()
  const [isOver, setIsOver] = useState(false)

  const accepts = useEffectEvent(
    (data: Record<string | symbol, unknown>) =>
      isWorkItemDragData(data) && data.laneKey === laneKey && canMoveTo(data.fromStateId, stateId),
  )

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return
    return dropTargetForElements({
      element,
      getData: () => ({ stateId, laneKey }),
      canDrop: ({ source }) => accepts(source.data),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    })
  }, [ref, enabled, stateId, laneKey])

  return getColumnDropState({ activeDrag, stateId, laneKey, isOver, canMoveTo })
}
```

- [ ] **Step 2: Crear `board-drop-classes.ts`**

```ts
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { ColumnDropState } from '@/features/projects/utils/column-drop-state'

// Inset rings: the swimlane panels clip anything drawn outside a cell (overflow-hidden).
const DROP_STATE_CLASS: Record<ColumnDropState, string> = {
  idle: '',
  source: '',
  allowed: 'ring-2 ring-inset ring-(--drop-ring)/40',
  over: 'ring-3 ring-inset ring-(--drop-ring)',
  blocked: 'opacity-50',
}

/** The classes a column or swimlane cell gets for its drop state. Pair with `dropRingStyle`. */
export function boardDropClassName(state: ColumnDropState): string {
  return cn('transition-[opacity,box-shadow] duration-150', DROP_STATE_CLASS[state])
}

/** The column's color, which the drop rings paint with. */
export function dropRingStyle(hex: string): CSSProperties {
  return { '--drop-ring': hex } as CSSProperties
}
```

- [ ] **Step 3: Crear `BoardDragProvider.tsx`**

```tsx
import { useCallback, useEffect, useEffectEvent, useMemo, useState, type ReactNode, type RefObject } from 'react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { useMoveBoardWorkItem } from '@/features/work-items/hooks/useMoveBoardWorkItem'
import { BoardDragContext, type BoardDragContextValue } from '@/features/projects/hooks/useBoardDrag'
import { canMoveTo } from '@/features/projects/utils/board-drop-targets'
import { isBoardDropTargetData, isWorkItemDragData } from '@/features/projects/utils/board-drag-data'
import type { ActiveDrag } from '@/features/projects/utils/column-drop-state'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

interface BoardDragProviderProps {
  projectId: string
  /** The columns the board shows; only these accept drops. */
  columns: ProjectBoardColumn[]
  /** `canEditWorkItems`: false for Viewers and for projects that take no work-item writes. */
  enabled: boolean
  /** The board's scrolling container, auto-scrolled when a drag nears its edges. */
  scrollContainerRef: RefObject<HTMLElement | null>
  children: ReactNode
}

/**
 * Drag-and-drop for one project board: watches every card drag, tells the columns which drag is
 * in progress, and moves the item when it is dropped on a column that accepts it. A drop anywhere
 * else does nothing — no request, no toast.
 */
export function BoardDragProvider({ projectId, columns, enabled, scrollContainerRef, children }: BoardDragProviderProps) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const { move, pendingIds } = useMoveBoardWorkItem(projectId)

  const canMove = useCallback((from: string, to: string) => canMoveTo(columns, from, to), [columns])

  const handleDrop = useEffectEvent(
    (source: Record<string | symbol, unknown>, target: Record<string | symbol, unknown> | undefined) => {
      setActiveDrag(null)
      if (!isWorkItemDragData(source) || !target || !isBoardDropTargetData(target)) return
      if (target.laneKey !== source.laneKey || !canMoveTo(columns, source.fromStateId, target.stateId)) return
      const toColumn = columns.find((col) => col.flowStateId === target.stateId)
      if (!toColumn) return
      move({
        workItemId: source.workItemId,
        code: source.code,
        toStateId: toColumn.flowStateId,
        toStateName: toColumn.flowStateName,
      })
    },
  )

  useEffect(() => {
    if (!enabled) return
    return monitorForElements({
      canMonitor: ({ source }) => isWorkItemDragData(source.data),
      onDragStart: ({ source }) => {
        if (isWorkItemDragData(source.data)) {
          setActiveDrag({ fromStateId: source.data.fromStateId, laneKey: source.data.laneKey })
        }
      },
      onDrop: ({ source, location }) => handleDrop(source.data, location.current.dropTargets[0]?.data),
    })
  }, [enabled])

  useEffect(() => {
    const element = scrollContainerRef.current
    if (!enabled || !element) return
    return autoScrollForElements({ element, canScroll: ({ source }) => isWorkItemDragData(source.data) })
  }, [enabled, scrollContainerRef])

  const value = useMemo<BoardDragContextValue>(
    () => ({
      enabled,
      // Derived rather than reset: if dragging is switched off mid-drag the monitor is gone and
      // its onDrop never fires, so a stale activeDrag would leave the columns painted.
      activeDrag: enabled ? activeDrag : null,
      canMoveTo: canMove,
      pendingIds,
    }),
    [enabled, activeDrag, canMove, pendingIds],
  )

  return <BoardDragContext value={value}>{children}</BoardDragContext>
}
```

- [ ] **Step 4: Convertir `BoardColumn` en destino (`ProjectBoardPage.tsx`)**

Agregar `useRef` al import de React (`import { useCallback, useMemo, useRef, useState } from 'react'`) y estos imports:

```tsx
import { BoardDragProvider } from './BoardDragProvider'
import { boardDropClassName, dropRingStyle } from './board-drop-classes'
import { useBoardDrag } from '@/features/projects/hooks/useBoardDrag'
import { useColumnDropTarget } from '@/features/projects/hooks/useColumnDropTarget'
import { SINGLE_LANE_KEY } from '@/features/projects/utils/board-drag-data'
```

Reemplazar la función `BoardColumn` completa por:

```tsx
function BoardColumn({
  column,
  onSelectItem,
}: {
  column: ProjectBoardColumn
  onSelectItem: (code: string) => void
}) {
  const hex = resolveSwatchColor(column.color)
  const ref = useRef<HTMLDivElement>(null)
  const dropState = useColumnDropTarget(ref, { stateId: column.flowStateId, laneKey: SINGLE_LANE_KEY })
  const { enabled, pendingIds } = useBoardDrag()

  return (
    <div
      ref={ref}
      style={dropRingStyle(hex)}
      className={cn(
        'flex-1 min-w-48 bg-sidebar border border-border rounded-xl overflow-hidden flex flex-col',
        boardDropClassName(dropState),
      )}
    >
      <div className="h-0.75 shrink-0" style={{ backgroundColor: hex }} />

      <div className="p-3 flex flex-col gap-3">
        <FlowStateHeading column={column} className="px-1" />

        <div className="flex flex-col gap-2">
          {column.workItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 flex items-center justify-center">
              <span className="text-xs text-muted-foreground/50">No items</span>
            </div>
          ) : (
            column.workItems.map((item) => (
              <WorkItemCard
                key={item.workItemId}
                item={item}
                onSelect={onSelectItem}
                dragLaneKey={SINGLE_LANE_KEY}
                isDraggable={enabled && !pendingIds.has(item.workItemId)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Quitar el filtro `Cancelled` redundante**

En `ProjectBoardPage`, reemplazar:

```tsx
  const columns = useMemo(
    () => rawColumns.filter((col) => col.category !== 'Cancelled'),
    [rawColumns],
  )
```

por:

```tsx
  // The board endpoint returns only Active states (GetProjectBoardHandler), so every column shows.
  const columns = rawColumns
```

Si después de esto `useMemo` queda sin uso en el archivo, quitarlo del import (sigue usándose para `groups`, así que debería quedar).

- [ ] **Step 6: Envolver el contenido del tab Board en el provider**

Junto a los otros hooks de `ProjectBoardPage` (antes de cualquier `return` temprano):

```tsx
  const boardScrollRef = useRef<HTMLDivElement>(null)
```

Reemplazar el bloque `activeTab === 'board' ? ( … )` del contenedor por:

```tsx
      {activeTab === 'board' ? (
        <div
          ref={boardScrollRef}
          className={cn(
            'flex-1 px-8',
            groupBy === 'none' ? 'overflow-y-auto py-4' : 'overflow-auto pb-4',
          )}
        >
          <TooltipProvider>
            {boardQuery.isError ? (
              <ErrorState
                title="Couldn't load the board"
                onRetry={retryBoard}
                isRetrying={boardQuery.isFetching}
              />
            ) : (
              <BoardDragProvider
                projectId={id}
                columns={columns}
                enabled={canEditWorkItems}
                scrollContainerRef={boardScrollRef}
              >
                {isLoading || groupBy === 'none' ? (
                  <div className={cn('flex flex-col sm:flex-row gap-4 pb-6', groupBy !== 'none' && 'pt-4')}>
                    {isLoading
                      ? Array.from({ length: 3 }).map((_, i) => <SkeletonColumn key={i} />)
                      : columns.map((col) => (
                          <BoardColumn key={col.flowStateId} column={col} onSelectItem={handleSelectItem} />
                        ))}
                  </div>
                ) : (
                  <BoardSwimlanes
                    columns={columns}
                    groups={groups}
                    openKeys={openKeys}
                    onOpenKeysChange={(keys) => setCollapsedKeys(groupKeys.filter((key) => !keys.includes(key)))}
                    onSelectItem={handleSelectItem}
                  />
                )}
              </BoardDragProvider>
            )}
          </TooltipProvider>
        </div>
      ) : activeTab === 'components' ? (
```

(Lo que sigue después de `: activeTab === 'components' ? (` queda igual.)

- [ ] **Step 7: Convertir las celdas de swimlane en destinos (`BoardSwimlanes.tsx`)**

Imports nuevos:

```tsx
import { useRef } from 'react'
import { useBoardDrag } from '@/features/projects/hooks/useBoardDrag'
import { useColumnDropTarget } from '@/features/projects/hooks/useColumnDropTarget'
import type { ProjectBoardWorkItem } from '@/features/projects/types/project.types'
import { boardDropClassName, dropRingStyle } from './board-drop-classes'
```

(`ProjectBoardWorkItem` va en el mismo `import type` que ya trae `ProjectBoardColumn`.)

Agregar este componente encima de `interface BoardSwimlanesProps`:

```tsx
/** One lane × column cell: a drop target that only takes cards from its own lane. */
function SwimlaneCell({
  column,
  laneKey,
  items,
  onSelectItem,
}: {
  column: ProjectBoardColumn
  laneKey: string
  items: ProjectBoardWorkItem[]
  onSelectItem: (code: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dropState = useColumnDropTarget(ref, { stateId: column.flowStateId, laneKey })
  const { enabled, pendingIds } = useBoardDrag()

  return (
    <div
      ref={ref}
      style={dropRingStyle(resolveSwatchColor(column.color))}
      className={cn('bg-sidebar rounded-lg p-2 flex flex-col gap-2 min-h-12', boardDropClassName(dropState))}
    >
      {items.map((item) => (
        <WorkItemCard
          key={item.workItemId}
          item={item}
          onSelect={onSelectItem}
          dragLaneKey={laneKey}
          isDraggable={enabled && !pendingIds.has(item.workItemId)}
        />
      ))}
    </div>
  )
}
```

Y dentro de `Accordion.Panel`, reemplazar el `columns.map` de las celdas por:

```tsx
                <div className="grid gap-3 pb-4" style={template}>
                  {columns.map((col) => (
                    <SwimlaneCell
                      key={col.flowStateId}
                      column={col}
                      laneKey={group.key}
                      items={group.cells[col.flowStateId] ?? []}
                      onSelectItem={onSelectItem}
                    />
                  ))}
                </div>
```

- [ ] **Step 8: Lint, tipos y suite completa**

Run: `pnpm lint && pnpm build && pnpm test`
Expected: sin errores; todo en verde. Si `react-hooks` marca algo sobre `useEffectEvent`, revisar que ninguna función de efecto aparezca en un array de dependencias ni se pase por props o contexto (solo `accepts` y `handleDrop`, llamadas dentro de callbacks registrados en efectos).

- [ ] **Step 9: Smoke test en el navegador**

Usar el `pnpm dev` que el usuario ya tiene corriendo (puerto **5175**); **no** arrancar otro servidor. Después del `pnpm add` de la Task 5, ese servidor puede servir una página en blanco (504 *outdated optimized dep*); esperar y recargar, sin reiniciarlo. El usuario inicia sesión él mismo. Con el backend local de PR #29 corriendo, abrir el board de *Test Manager* y comprobar que:
- arrastrar una card resalta las columnas permitidas y atenúa las demás;
- soltarla en una permitida la mueve sin errores en la consola.

- [ ] **Step 10: Commit**

```bash
git add src/features/projects/hooks/useColumnDropTarget.ts src/features/projects/components/board-drop-classes.ts src/features/projects/components/BoardDragProvider.tsx src/features/projects/components/ProjectBoardPage.tsx src/features/projects/components/BoardSwimlanes.tsx
git commit -m "Move work items by dragging them between board columns" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentación y verificación manual completa

**Files:**
- Modify: `.claude/rules/projects.md` (nueva sección después de "Board grouping")
- Modify: `docs/specs/board-drag-and-drop.spec.md` (RF-5 y §6.1)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: documentación al día y la verificación manual registrada.

- [ ] **Step 1: Agregar la sección a `.claude/rules/projects.md`**

Insertar antes de `## Status and permissions`:

```markdown
## Drag-and-drop (spec: `docs/specs/board-drag-and-drop.spec.md`)

- **Library:** Pragmatic drag and drop 4.x. Import from `@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter` and `@atlaskit/pragmatic-drag-and-drop-auto-scroll/element`; the old `element/adapter` / `combine` paths are deprecated.
- **Where it can drop:** `canMoveTo` (`utils/board-drop-targets.ts`) = the origin column's `availableTransitions` (from `GET /board`, already filtered by role) narrowed to the board's columns, minus the origin. The board shows only Active states, so a drag never completes or cancels an item; that stays in the `StatusSelect`.
- **Lanes:** without grouping every column is lane `SINGLE_LANE_KEY`; in swimlanes each cell is lane `group.key`, and a card drops only in its own lane. A drop changes the state, never the grouped field.
- **Who drags:** `BoardDragProvider` gets `enabled = canEditWorkItems`. A card with its move pending isn't draggable (`pendingIds` from `useMoveBoardWorkItem`).
- **Cards stay memoized:** `WorkItemCard` takes only primitives for drag (`dragLaneKey`, `isDraggable`); the rules live in the provider and the drop targets.
- **Move:** `useMoveBoardWorkItem` reuses `workItemPatches` / `workItemInvalidations`. It doesn't invalidate `mySummary` / `projects.list` (Active → Active only). `updateCard` inserts in the backend's order (`utils/board-order.ts`).
- **Tests:** jsdom has no native drag-and-drop, so the drag itself is verified by hand; the rules and the move hook are unit-tested.
```

- [ ] **Step 2: Alinear la spec con dos detalles de implementación**

En `docs/specs/board-drag-and-drop.spec.md`:
- **RF-5, fila `blocked`:** reemplazar `Opacidad reducida, cursor \`not-allowed\`` por `Opacidad reducida (el cursor de "no se puede soltar" lo pone el navegador: el CSS \`cursor\` no aplica durante un drag nativo)`.
- **§6.1, fila de `BoardDragProvider`:** reemplazar `\`canMoveTo\` estable que lee las columnas de un ref` por `\`canMoveTo\` derivado de las columnas actuales; el monitor y los destinos leen el estado más reciente con \`useEffectEvent\` sin re-registrarse`.

- [ ] **Step 3: Verificación manual (Chrome desktop, backend local con PR #29, `pnpm dev` del usuario en 5175)**

Marcar cada punto; ante una falla, parar y reportar con captura y consola.

- [ ] AC-1: con una card en un estado con transiciones parciales, las columnas permitidas se ven `allowed`, las demás `blocked` y la de origen neutra.
- [ ] AC-2: al pasar sobre una permitida se ve `over`, y se pierde al salir.
- [ ] AC-3 / AC-4: soltar en una bloqueada, en la de origen o fuera del board, o presionar Escape: la card vuelve, no aparece `PATCH …/move` en Network ni hay toast.
- [ ] AC-5 / AC-6: soltar en una permitida mueve la card al instante y en su posición por prioridad; tras el refetch no salta. Exactamente un `PATCH …/move`.
- [ ] AC-7: después del move no hay requests a `/users/my-summary` ni a la lista de proyectos.
- [ ] AC-9 / AC-10: con *Group by Assignee*, solo se aceptan celdas del mismo lane; la card no cambia de lane. Un lane colapsado no recibe drops. Los anillos de las celdas no se recortan.
- [ ] AC-16: un clic (sin arrastrar) abre el detalle; Tab hasta el título y Enter también.
- [ ] AC-18: con React DevTools → Profiler → "Highlight updates when components render", refetchear el board sin cambios (por ejemplo, abrir y cerrar el detalle de un item sin editarlo): ninguna `WorkItemCard` se resalta. Al empezar y terminar un drag se resaltan columnas o celdas, no cards.
- [ ] Auto-scroll: con la ventana angosta o con swimlanes, acercar la card al borde desplaza el contenedor.
- [ ] Firefox: arrastrar tomando la card **desde el título** (el `<button>`) también inicia el drag. Si no, reportarlo; no improvisar un fix.
- [ ] AC-11: pedirle al usuario que inicie sesión como **Rose Diez** (Viewer en *Test Manager*). Las cards no se arrastran y el clic abre el detalle. No escribir su contraseña.
- [ ] AC-14: con el usuario de prueba en otra pestaña, pedirle al usuario que cambie su rol a Viewer y, sin recargar, soltar una card. Debe haber 403, rollback, toast, y luego ninguna card arrastrable. Pedirle que restaure el rol.
- [ ] AC-15: con DevTools → Network → Offline, soltar una card: la card vuelve, aparece el toast `"Couldn't move the work item — changes reverted"` y la sesión sigue abierta.
- [ ] Touch (informativo, OQ-1 cerrada): si el usuario tiene un teléfono a mano, long-press y arrastrar. Anotar el resultado; no bloquea.

- [ ] **Step 4: Verificación final**

Run: `pnpm lint && pnpm build && pnpm test`
Expected: sin errores; todo en verde.

Run: `git status -sb`
Expected: `feature/drag-and-drop` sin cambios pendientes salvo `.design/` (que no es de esta feature) y **sin** "ahead/behind" respecto de un remoto: nada se pusheó.

- [ ] **Step 5: Commit**

```bash
git add .claude/rules/projects.md docs/specs/board-drag-and-drop.spec.md
git commit -m "Document the board drag-and-drop rules" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
