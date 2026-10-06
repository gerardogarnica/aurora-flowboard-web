# Especificación de Funcionalidad: Drag-and-drop de work items en el Board

- **Versión:** 1.0
- **Fecha:** 2026-10-06
- **Repositorio:** `aurora-flowboard-web` (React 19 + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Aprobada por el usuario (2026-10-06) — pendiente de plan de implementación
- **Branch:** `feature/drag-and-drop`
- **Áreas afectadas:** `src/features/projects/`, `src/features/work-items/hooks/`
- **Dependencia de backend:** `aurora-flowboard-api` PR #29 (`feature/board-transitions` → `staging`, commit `5659192`)

---

## 1. Overview

Requerimiento: *"Implementar drag-and-drop en el board de un proyecto para mover un work item entre
columnas de estados, respetando las transiciones disponibles y aplicando solo a las columnas visibles
en el board."*

Hoy un work item cambia de estado solo desde el `StatusSelect` del detalle (`WorkItemSidebar`). Con
esta funcionalidad, el usuario arrastra la card a otra columna del board. Mientras arrastra, el board
resalta las columnas a las que el item **puede** ir según el flujo del proyecto y el rol del usuario,
y atenúa las demás. Soltar en una columna permitida mueve el item de forma optimista; soltar en
cualquier otro lugar no hace nada.

La librería elegida es **Pragmatic drag and drop** (`@atlaskit/pragmatic-drag-and-drop`, Atlassian),
sobre el drag-and-drop nativo de HTML5. Alternativas evaluadas y descartadas: `@dnd-kit/react` (0.x,
API inestable), `@dnd-kit/core` (sin releases desde 2024-12), `@hello-pangea/dnd` (modelo de
reordenamiento de listas, redux como dependencia, problemas con scroll anidado), HTML5 a mano.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El board sabe a qué estados puede ir cada card" | **Falso (antes del cambio de backend).** `ProjectBoardWorkItem` no trae transiciones; solo `GET /work-items/:code` devuelve `availableTransitions`. El backend las agrega por columna en `feature/board-transitions` (§7). |
| "Las transiciones dependen del work item" | **Falso.** Dependen solo del estado origen y del rol del usuario en el proyecto (`FlowTransition.AllowedRoles`, `WorkItem.Move` en el dominio). Una lista por columna alcanza para todas sus cards. |
| "Las columnas visibles excluyen `Cancelled`" | **Incompleto.** `GetProjectBoardHandler` devuelve **solo** estados de categoría `Active`. `Completed` y `Cancelled` nunca son columnas; el filtro `category !== 'Cancelled'` de `ProjectBoardPage` es redundante. |
| "Ya existe un move optimista" | **Cierto.** `useMoveWorkItem` → `useOptimisticWorkItemMutation` mueve la card entre columnas (`updateCard`), hace rollback y toast en error, e invalida detalle, actividad y board. Pero recibe `workItemId`/`code` al instanciar el hook, no por llamada. |
| "La card queda en su posición al moverla" | **Falso.** `updateCard` la agrega **al final** de la columna destino, pero el backend ordena por `Priority` desc y luego `CreatedOnUtc` asc: tras el refetch la card salta. |
| "Las columnas tienen orden manual de cards" | **Falso.** No existe posición persistida; reordenar dentro de una columna no tiene sentido. |
| "La card es un único botón" | **Falso.** `WorkItemCard` tiene `onClick` en toda la card y un `<button>` en el título (para teclado). Es `memo` y depende de props estables. |
| "Un Viewer puede mover items" | **Falso.** El backend responde 403 `WorkItem.ViewerCannotModify`; además los flujos no pueden otorgar transiciones al rol Viewer, así que recibe `availableTransitions: []` en todas las columnas. |

---

## 3. Goal

Que un miembro con permiso de edición pueda cambiar el estado de un work item arrastrando su card a
otra columna del board, sin abrir el detalle, y que el board le muestre **antes de soltar** a qué
columnas puede moverlo.

---

## 4. User Stories

- **US-1** — Como miembro con permiso de edición, quiero arrastrar una card a otra columna, para cambiar su estado sin abrir el detalle.
- **US-2** — Como miembro, quiero ver durante el arrastre qué columnas aceptan el item, para no intentar movimientos que el flujo no permite.
- **US-3** — Como miembro, quiero arrastrar también con el board agrupado en swimlanes, dentro de la misma franja.
- **US-4** — Como usuario de teclado o lector de pantalla, quiero seguir moviendo items con el `StatusSelect` del detalle (la alternativa accesible al arrastre).

---

## 5. Requisitos Funcionales

### RF-1 — Contrato del board (backend, ya implementado)
- `GET /v1/flowboard/projects/:id/board` agrega a cada columna
  `availableTransitions: [{ toStateId, toStateName }]`.
- Filtradas por el rol del usuario en el proyecto, con la misma lógica que
  `GET /work-items/:code` → `availableTransitions` para un item en ese estado.
- Incluye destinos de **toda** categoría (`Active`, `Completed`, `Cancelled`). Ordenadas por
  `toStateName`. Una columna sin transiciones permitidas trae `[]` (nunca `null` ni ausente).
- Sin endpoint nuevo: campo aditivo.

### RF-2 — Tipo en el frontend
- `ProjectBoardColumn.availableTransitions?: WorkItemTransition[]` (reutiliza el tipo existente).
- Opcional solo para tolerar un backend previo durante el despliegue; se lee siempre como `?? []`.

### RF-3 — Destinos válidos
- Un item en el estado `S` puede soltarse en la columna `T` si y solo si:
  1. `T` es una columna visible del board, **y**
  2. `T ≠ S`, **y**
  3. `T.flowStateId` está en `availableTransitions` de la columna `S`, **y**
  4. el destino está en el mismo lane que el origen (RF-6).
- La regla vive en una función pura (`canMoveTo`) sin dependencia de la librería de drag.
- Consecuencia: **no se puede completar ni cancelar un item por drag-and-drop**, porque esos estados
  no son columnas. Se sigue haciendo desde el `StatusSelect`.

### RF-4 — Quién puede arrastrar
- Las cards son arrastrables solo si `canEditWorkItems` (= `canAddOrUpdateWorkItems` del proyecto
  **y** el usuario no es Viewer), el mismo valor que hoy gobierna el detalle.
- Una card con un move propio aún pendiente no es arrastrable hasta que el request termine.
- Skeleton (cargando) y `ErrorState` no tienen cards arrastrables.

### RF-5 — Feedback durante el arrastre
Cada columna (o celda, en swimlanes) tiene uno de estos estados visuales mientras hay un drag activo:

| Estado | Cuándo | Estilo |
|---|---|---|
| `idle` | No hay drag activo | Como hoy |
| `source` | Es la columna de origen del item | Neutra |
| `allowed` | `canMoveTo` es verdadero | Anillo suave con el color de la columna |
| `over` | `allowed` y el puntero está encima | Anillo marcado con el color de la columna |
| `blocked` | Cualquier otro caso | Opacidad reducida (el cursor de "no se puede soltar" lo pone el navegador: el CSS `cursor` no aplica durante un drag nativo) |

- La card arrastrada queda semitransparente en su lugar de origen. La vista previa del arrastre es la
  nativa del navegador.
- El contenedor del board hace auto-scroll al acercar el puntero a sus bordes
  (`@atlaskit/pragmatic-drag-and-drop-auto-scroll`).

### RF-6 — Swimlanes
- Con `groupBy ≠ none`, el destino es la **celda** (lane × columna).
- Solo se aceptan drops en celdas del **mismo lane** que el origen; el resto queda `blocked`.
- Soltar solo cambia el estado; nunca cambia el campo de agrupación (asignado, tipo, milestone,
  componente).
- Los lanes colapsados no montan sus celdas, así que no reciben drops.
- Con `groupBy = none` todas las columnas comparten un único lane (`'all'`).

### RF-7 — Soltar
- Soltar en una columna `allowed` dispara
  `move({ workItemId, code, toStateId, toStateName })`, con `toStateName` tomado de la columna destino.
- Soltar en una columna `blocked`, en la de origen, fuera del board, o cancelar con Escape: la card
  vuelve a su lugar, **sin request y sin toast**.
- No se pide `reason` (el backend lo acepta opcional).

### RF-8 — Move optimista
- La card pasa a la columna destino **en su posición ordenada**: `Priority` desc (Critical > High >
  Medium > Low; una prioridad desconocida va al final), luego `createdOnUtc` asc. Un empate queda
  después de los items iguales existentes. Esta mejora de `updateCard` aplica también al move desde
  el `StatusSelect`.
- Si el detalle del item está en caché, se le actualizan `flowStateId` / `flowStateName`.
- Al terminar (éxito o error) se invalidan el detalle, la actividad y el board del proyecto.
- **No** se invalidan `queryKeys.mySummary()` ni `queryKeys.projects.list()`: un drag solo mueve entre
  estados `Active`, y los contadores abiertos/cerrados no cambian. Queda un comentario en el código
  para el día en que exista un destino `Completed` en el board.

### RF-9 — Errores
| Causa | Respuesta | Comportamiento |
|---|---|---|
| Otro usuario movió el item antes y no hay transición desde su estado real | 400 `WorkItem.TransitionNotAllowed` | Rollback + toast; el refetch muestra el estado real |
| El usuario pasó a Viewer | 403 `WorkItem.ViewerCannotModify` | Rollback + toast; se refresca el proyecto (`mayBeStaleProjectRole`), `canEditWorkItems` pasa a falso y el drag se apaga |
| Su rol ya no tiene la transición | 403 `WorkItem.TransitionRoleNotAllowed` | Igual que la fila anterior; el board trae las transiciones nuevas |
| El proyecto pasó a un estado que no admite escrituras | 400 `Project.OperationNotAllowedInCurrentStatus` | Rollback + toast; se refresca el proyecto y el drag se apaga |
| El item ya no existe o el usuario dejó de ser miembro | 404 | Rollback + toast; el refetch quita la card (o muestra "Project not found") |
| Red / 5xx | — | Rollback + toast con el fallback `"Couldn't move the work item"`; nunca cierra la sesión |

- Todo texto de error pasa por `getErrorMessage`; el toast es el estándar de
  `useOptimisticMutation`: `"<motivo> — changes reverted"`.

---

## 6. Diseño técnico

### 6.1 Componentes y responsabilidades
Las cards no conocen las transiciones: solo publican "soy el item X, en el estado Y, en el lane Z".
Las reglas viven en un único lugar del board, para no romper el `memo` de `WorkItemCard`.

| Unidad | Responsabilidad |
|---|---|
| `projects/utils/board-drop-targets.ts` | `canMoveTo(columns, fromStateId, toStateId)`: transiciones de la columna origen ∩ columnas visibles, excluida la propia |
| `projects/utils/column-drop-state.ts` | `getColumnDropState({ activeDrag, stateId, laneKey, isOver, canMoveTo })` → `idle \| source \| allowed \| blocked \| over` |
| `projects/components/BoardDragProvider.tsx` | Contexto React del board: `monitorForElements` (start / drop) y auto-scroll; estado `activeDrag = { fromStateId, laneKey }` que solo cambia al empezar y al terminar; `canMoveTo` derivado de las columnas actuales; el monitor y los destinos leen el estado más reciente con `useEffectEvent` sin re-registrarse; en el drop llama a `move` |
| `projects/hooks/useDraggableCard.ts` | `draggable({ element, getInitialData: () => ({ type: 'work-item', workItemId, code, fromStateId, laneKey }) })`; no registra nada si no está habilitado |
| `projects/hooks/useColumnDropTarget.ts` | `dropTargetForElements` con `canDrop = mismo lane && canMoveTo(...)`; maneja `isOver` local y devuelve el estado de `getColumnDropState` |
| `work-items/hooks/useMoveBoardWorkItem.ts` | `useMoveBoardWorkItem(projectId)` → `{ move, pendingIds }`; ids por llamada |

- `activeDrag` va en un **contexto de React**, no en Zustand: es estado efímero de una sola pantalla.
- `WorkItemCard` recibe solo props primitivas nuevas (`dragLaneKey: string`, `isDraggable: boolean`).
- Dependencias nuevas, en `dependencies`: `@atlaskit/pragmatic-drag-and-drop` y
  `@atlaskit/pragmatic-drag-and-drop-auto-scroll`. Quedan en el chunk lazy de `ProjectBoardPage`,
  no en el shell. El lockfile va en el mismo commit.

### 6.2 Flujo de un drag
1. `useProjectBoard` → columnas con `availableTransitions`. `ProjectBoardPage` pasa las columnas
   visibles y `enabled = canEditWorkItems` al provider.
2. **Drag start:** la card entrega su `initialData`; el monitor hace `setActiveDrag(...)`. Se
   re-renderizan las columnas (estilo); las cards no, porque sus props no cambian.
3. **Durante el drag:** cada destino evalúa `canDrop`; solo la columna bajo el puntero cambia su `isOver`.
4. **Drop:** el monitor lee `location.current.dropTargets[0]`; sin destino o mismo estado → nada; si
   no, `move(...)`. Siempre `setActiveDrag(null)`.
5. Si el board se refresca a mitad de un drag y la card de origen se re-monta, el drop sigue siendo
   correcto: usa `source.data` (capturada al iniciar) y las columnas actuales del ref.

### 6.3 Refactor de la mutación
- `useOptimisticWorkItemMutation` fija `workItemId`/`code` al crear el hook. En lugar de cambiar su
  firma (10 hooks la usan), se extraen dos helpers en el mismo archivo:
  `workItemPatches(ids, vars, opts)` y `workItemInvalidations(ids, error, extra)`. El hook existente
  delega en ellos sin cambiar su firma.
- `useMoveBoardWorkItem` usa `useOptimisticMutation` con esos helpers y los ids que trae cada llamada,
  de modo que la invalidación (detalle, actividad, board, `mayBeStaleProjectRole`) sigue en un solo lugar.
- `pendingIds` (un `Set<string>`): se agrega en `onMutate` y se quita en `onSettled`.
- `updateCard` inserta en posición ordenada (RF-8).

---

## 7. Acceptance Criteria

**Destinos y feedback**
- **AC-1** — Dado un usuario con permiso de edición y una card en `To Do`, cuya columna tiene la transición a `In Progress` pero no a `In Review`, cuando empieza a arrastrarla, entonces `In Progress` se ve `allowed`, `In Review` se ve `blocked` y `To Do` se ve neutra.
- **AC-2** — Dado un arrastre en curso, cuando el puntero pasa sobre una columna `allowed`, entonces esa columna muestra el estado `over`, y lo pierde al salir.
- **AC-3** — Dado un arrastre en curso, cuando el usuario suelta sobre una columna `blocked`, sobre la de origen o fuera del board, entonces la card vuelve a su lugar y no se dispara ninguna petición `PATCH …/move` ni ningún toast.
- **AC-4** — Dado un arrastre en curso, cuando el usuario presiona Escape, entonces la card vuelve y todas las columnas vuelven a `idle`.

**Move**
- **AC-5** — Dada una card arrastrada a una columna `allowed`, cuando se suelta, entonces la card aparece de inmediato en la columna destino, en la posición que le corresponde por prioridad y fecha de creación, y se observa exactamente una petición de move con el `toStateId` de esa columna.
- **AC-6** — Dado un move exitoso, cuando el board se refresca, entonces la card queda en la misma posición en que se mostró de forma optimista (sin saltos).
- **AC-7** — Dado un move exitoso, entonces no se dispara ninguna petición a `GET /users/my-summary` ni a la lista de proyectos.
- **AC-8** — Dado un move pendiente de una card, cuando el usuario intenta arrastrar esa misma card, entonces no puede; las demás cards siguen siendo arrastrables.

**Swimlanes**
- **AC-9** — Dado el board agrupado por `Assignee`, cuando el usuario arrastra una card del lane "Ana", entonces solo las celdas permitidas del lane "Ana" se ven `allowed`; todas las celdas de otros lanes se ven `blocked`.
- **AC-10** — Dado un move dentro de un lane, cuando termina, entonces la card sigue en el mismo lane (no cambia asignado, tipo, milestone ni componente).

**Permisos**
- **AC-11** — Dado un usuario Viewer del proyecto, cuando intenta arrastrar cualquier card, entonces no puede; hacer clic en la card sigue abriendo el detalle.
- **AC-12** — Dado un proyecto cuyo estado no admite escrituras (`canAddOrUpdateWorkItems = false`), entonces ninguna card es arrastrable.

**Errores**
- **AC-13** — Dado que el backend rechaza el move con 400 o 403, cuando llega la respuesta, entonces la card vuelve a la columna de origen y se muestra un toast con el mensaje del backend seguido de "— changes reverted".
- **AC-14** — Dado que al usuario le cambiaron el rol a Viewer desde otra sesión, cuando suelta una card y recibe 403, entonces tras el refetch del proyecto ninguna card es arrastrable.
- **AC-15** — Dado un fallo de red, cuando falla el move, entonces la card vuelve, se muestra `"Couldn't move the work item — changes reverted"` y la sesión sigue abierta.

**No regresión**
- **AC-16** — Dado cualquier modo de agrupación, cuando el usuario hace clic en una card (sin arrastrar), entonces se abre el detalle como hoy; el `<button>` del título sigue siendo alcanzable y activable con teclado.
- **AC-17** — Dado un move desde el `StatusSelect` del detalle, entonces la card también queda en su posición ordenada en la columna destino.
- **AC-18** — Dado el board en reposo, cuando se refresca sin cambios, entonces ninguna `WorkItemCard` se re-renderiza (se conserva la memoización).

---

## 8. Integration Points

| RF | Archivo | Cambio |
|---|---|---|
| RF-2 | `src/features/projects/types/project.types.ts` | `availableTransitions?` en `ProjectBoardColumn` |
| RF-3 | `src/features/projects/utils/board-drop-targets.ts` (nuevo) | `canMoveTo` |
| RF-5 | `src/features/projects/utils/column-drop-state.ts` (nuevo) | `getColumnDropState` |
| RF-4, RF-5, RF-7 | `src/features/projects/components/BoardDragProvider.tsx` (nuevo) | Contexto, monitor, auto-scroll, drop |
| RF-4 | `src/features/projects/hooks/useDraggableCard.ts` (nuevo) | Registro de la card |
| RF-5, RF-6 | `src/features/projects/hooks/useColumnDropTarget.ts` (nuevo) | Registro de columna/celda |
| RF-4 | `src/features/projects/components/WorkItemCard.tsx` | Props `dragLaneKey`, `isDraggable`; estilo de la card de origen |
| RF-5, RF-6 | `src/features/projects/components/ProjectBoardPage.tsx` | Provider; `BoardColumn` como destino; quitar el filtro `Cancelled` redundante |
| RF-6 | `src/features/projects/components/BoardSwimlanes.tsx` | Celdas como destino con `laneKey = group.key` |
| RF-8 | `src/features/work-items/hooks/useOptimisticWorkItemMutation.ts` | Helpers extraídos; `updateCard` ordenado |
| RF-8, RF-9 | `src/features/work-items/hooks/useMoveBoardWorkItem.ts` (nuevo) | `{ move, pendingIds }` |
| — | `package.json`, `pnpm-lock.yaml` | Dependencias de Pragmatic DnD |
| — | `.claude/rules/projects.md` | Sección "Drag-and-drop" con estas reglas |

---

## 9. Tests

jsdom no implementa el drag-and-drop nativo de HTML5, así que **no se simula el arrastre en Vitest**.
La lógica está aislada en funciones puras y hooks que se testean sin DOM de drag; el arrastre real se
verifica a mano.

| Archivo | Casos |
|---|---|
| `board-drop-targets.test.ts` | Permite con transición a columna visible; rechaza mismo estado, destino `Completed`/`Cancelled`, columna sin transiciones y `availableTransitions` ausente. Nombra `GetProjectBoardHandler.cs` como contrato reflejado |
| `column-drop-state.test.ts` | Las cinco salidas; otro lane → `blocked`; sin drag → `idle` |
| test de `updateCard` | Prioridad mayor primero; empate por `createdOnUtc`; prioridad desconocida al final; empate total después de los existentes |
| `useMoveBoardWorkItem.test.ts` | Optimista con ids por llamada; rollback + toast en 400; invalida detalle/actividad/board y **no** `mySummary`/`projects.list`; 403 invalida `projects.details()`; `pendingIds` se llena y se libera en éxito y en error |
| `useMoveWorkItem.test.ts` | **Sin cambios**: red de seguridad del refactor de helpers |

**Verificación manual** (Chrome desktop, backend local):
- Drop permitido; drop bloqueado, misma columna, fuera del board y Escape → sin request.
- Swimlanes: solo dentro del lane; lane colapsado no recibe drops.
- Clic abre el detalle; botón del título por teclado; auto-scroll con muchas columnas.
- Viewer (Rose Diez en *Test Manager*) → no arrastra.
- Cambio de rol desde otra pestaña → 403, rollback, drag apagado.
- Touch: long-press nativo en un teléfono real, informativo, no bloquea la entrega (ver §12, OQ-1).

---

## 10. Permisos

| Rol / estado | Arrastra | Destinos |
|---|---|---|
| Admin, Analyst, Developer, QA en proyecto que admite escrituras | Sí | Los que el flujo permite a su rol desde el estado origen |
| Viewer | No | — (además recibe `[]`) |
| Cualquiera, proyecto con `canAddOrUpdateWorkItems = false` | No | — |

El rol de workspace (`Administrator`) no da permisos adicionales: manda el rol del proyecto.

---

## 11. Out of Scope

- Drag-and-drop por teclado y anuncios para lector de pantalla: la alternativa accesible es el `StatusSelect` del detalle.
- Completar o cancelar por drag (no hay columnas `Completed` / `Cancelled`); una zona "Done" queda para el futuro.
- Reordenar cards dentro de una columna (no hay posición persistida).
- Mover entre lanes cambiando asignado, tipo, milestone o componente.
- Pedir un `reason` al soltar.
- Toast al soltar en una columna bloqueada.
- Edición de flujos (son create-only).

---

## 12. Dependencias y Open Questions

**Dependencias**
- Backend PR #29 (`feature/board-transitions` → `staging`, `5659192`) debe mergearse **antes** que
  este frontend. Con un backend previo el board no se rompe: todas las columnas quedan `blocked`.
  El board y `GET /work-items/:code` construyen la lista con un mismo helper del backend, así que
  coinciden por construcción.
- `@atlaskit/pragmatic-drag-and-drop` 4.x y `@atlaskit/pragmatic-drag-and-drop-auto-scroll` 3.x.

**Open Questions** — ninguna abierta.
- **OQ-1 (cerrada, 2026-10-06)** — Soporte touch: Pragmatic usa el drag nativo del navegador
  (long-press en móvil), no configurable. **Decisión:** se acepta ese comportamiento y se implementa
  sin spike previo; el touch se revisa en la verificación manual. Si en el futuro no resulta
  aceptable, la lógica de §6 es independiente de la librería y permite cambiar a `@dnd-kit/react`.

---

## 13. Final Assumptions

- La alternativa accesible al drag es el `StatusSelect` existente, que ya respeta las transiciones.
- Los flujos no cambian después de crear el proyecto; las transiciones solo varían por cambios de rol.
- Las columnas del board son exactamente los estados `Active` que devuelve el backend.
- La vista previa nativa del navegador es aceptable como imagen de arrastre.
