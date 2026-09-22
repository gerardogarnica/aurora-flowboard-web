# Especificación de Funcionalidad: Color en Milestones

- **Versión:** 1.0
- **Fecha:** 2026-09-19
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Assumptions confirmadas por el usuario (13/13) — en implementación
- **Branch:** `feature/milestone-color`
- **Área afectada:** `src/features/projects/`, `src/features/work-items/`, `src/shared/constants/colors.ts`

---

## 1. Overview

El backend agregó un campo `color` **obligatorio** a Milestone (branch `feature/milestone-color`, ya
mergeada del lado API). El front hoy no conoce ese campo: no lo envía al crear/editar, no lo muestra
en el listado, y la tarjeta del board tiñe el milestone con un indigo fijo igual para todos.

Además hay un **breaking change** en el board: `ProjectBoardWorkItem.milestone` (string | null) fue
reemplazado por `milestoneName` (string | null) + `milestoneColor` (string | null). Todo código que
lea `workItem.milestone` deja de compilar/funcionar.

Esta especificación cubre: picker de color obligatorio en el form de milestone, color en el listado,
color en la tarjeta del board, y color en el detalle del work item.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El color de Project/FlowState viaja como hex `#F97316`" | **Falso.** Viaja como **clave del swatch** (`"orange"`). `ColorSwatchGrid` emite `key` (`ColorSwatchGrid.tsx:47`) y todo consumidor hace `resolveSwatchColor(key)` (Sidebar, ProjectsPage, BoardColumn, StatusSelect…). Como el backfill del backend copió el color del proyecto padre, los milestones existentes ya tienen claves, no hex. |
| "`ProjectMilestone` tiene `color`" | **Falso.** `milestone.types.ts:3-14`. |
| "`MilestoneRequest` tiene `color`" | **Falso.** `milestone.types.ts:16-21`; `MilestoneFormModal.toPayload()` arma 4 campos. |
| "El form de milestone tiene picker de color" | **Falso.** Ni el form ni `milestoneSchema` (`schemas/milestone.schema.ts`). |
| "La tarjeta del board colorea el milestone" | **Falso.** `MilestoneTag` hardcodea `bg-indigo-50 text-indigo-600` (`ProjectBoardPage.tsx:41-60`). |
| "El sidebar del work item muestra indicador de color" | **Falso.** La fila Milestone es texto plano (`WorkItemSidebar.tsx:341-372`). |
| "Existe un picker compartido reutilizable" | **Cierto.** `ColorSwatchGrid` (`shared/components/`), 20 swatches, `value`/`onChange` por clave, `size` `md` \| `sm`. |
| "El update optimista del board escribe el milestone" | **Cierto y se rompe.** `useUpdateWorkItemMilestone.ts:34` escribe `wi.milestone`, campo que ya no existe. |
| "El botón Edit del listado respeta la regla del backend" | **Falso.** `canEdit = isProjectAdmin && status !== 'Archived'` (`ProjectMilestonesSection.tsx:184`): un milestone `Completed` muestra el lápiz y el backend rechaza el `PUT` con 403/409. |
| "La app tiene dark mode activo" | **Falso.** `.dark` existe en `index.css:65` pero nada setea la clase; la UI es light-only (por eso `bg-*-50` funciona hoy). |

---

## 3. Goal y criterios de éxito

**Goal:** que cada milestone tenga un color propio, elegido con el mismo picker que Project y Flow
State, y que ese color llegue a las tres superficies donde el milestone se reconoce de un vistazo:
listado de Milestones, tarjeta del board y detalle del work item.

**Criterios de éxito:**

- No se puede crear ni editar un milestone sin color (el backend responde 400 si falta).
- El mismo hex se ve en listado, tarjeta y detalle — una sola fuente de resolución (`resolveSwatchColor`).
- Ningún consumidor sigue leyendo `ProjectBoardWorkItem.milestone`.
- El texto del chip de milestone en el board mantiene contraste AA (≥ 4.5:1) con **cualquiera** de los
  20 colores del catálogo, no sólo con el indigo actual.

---

## 4. User Stories

- **US-1** — Como project admin creando un milestone, quiero elegir su color, para distinguirlo de los
  demás milestones del proyecto de un vistazo.
- **US-2** — Como project admin editando un milestone, quiero cambiar su color, con las mismas reglas
  que el resto del update.
- **US-3** — Como miembro del proyecto viendo el listado de Milestones, quiero ver el color de cada uno.
- **US-4** — Como miembro viendo el board, quiero que la tarjeta muestre el milestone con su color, para
  agrupar visualmente el trabajo de una misma iniciativa sin leer cada etiqueta.
- **US-5** — Como miembro viendo el detalle de un work item, quiero ver el color del milestone asignado
  y de los milestones elegibles al reasignarlo.

---

## 5. Requisitos Funcionales

### RF-1 — Tipos y contrato

- `ProjectMilestone` += `color: string`.
- `MilestoneRequest` += `color: string` (requerido, sin default en el tipo).
- `ProjectBoardWorkItem`: **se elimina** `milestone: string | null`; se agregan `milestoneName: string | null`
  y `milestoneColor: string | null`.
- `WorkItemDetailResponse` += `milestoneColor: string | null`.

### RF-2 — Tinta accesible del catálogo (`SWATCH_INK`)

El chip del board pasa de un par fijo (`bg-indigo-50` / `text-indigo-600`) a un par derivado del color
del milestone. Los 20 hex crudos **no sirven como color de texto**: sobre un tinte claro de sí mismos,
`yellow` (#EAB308) da 1.77:1 y `lime` 1.82:1, muy por debajo de AA.

Se agrega a `shared/constants/colors.ts` un mapa `SWATCH_INK` — la fila "-600" del catálogo — con cada
color oscurecido hasta alcanzar **≥ 5:1** sobre su propio tinte al 12%, más `resolveSwatchInk(key)`
con el mismo contrato de fallback que `resolveSwatchColor`. Valores precomputados, sin cálculo en runtime.

### RF-3 — Campo Color en `MilestoneFormModal`

Campo obligatorio `Color` (sin sufijo "(optional)"), entre Description y las fechas, renderizado con
`ColorSwatchGrid size="sm"` **inline** (no popover). Wired a react-hook-form vía `Controller`.

- **Crear:** preseleccionado con el color del proyecto padre (`defaultColor`), el mismo criterio del
  backfill del backend; si el proyecto todavía no cargó, `DEFAULT_SWATCH_COLOR`.
- **Editar:** preseleccionado con `milestone.color`.
- `milestoneSchema` += `color: z.string().min(1, 'Color is required')`. El mensaje es inalcanzable con
  el preselect; existe para blindar el submit.
- `toPayload()` incluye `color: values.color`.

### RF-4 — Color en el listado de Milestones

`MilestoneRow` antepone un punto del color al nombre (`w-2.5 h-2.5 rounded-full shrink-0`, la misma
forma que `ColorValue` en `ProjectDetailsModal.tsx:124`), con tooltip del nombre del color. El punto
vive dentro de la celda Name: **no** se agrega una columna al `ROW_GRID`. `SkeletonRow` gana el punto.

### RF-5 — `isMilestoneEditable` y alineación del botón Edit

`constants/milestone-status.ts` exporta `MILESTONE_EDITABLE_STATUSES = ['Draft', 'Active', 'OnHold']` e
`isMilestoneEditable(status)`. `ProjectMilestonesSection` usa `canEdit = isProjectAdmin && isMilestoneEditable(status)`,
de modo que en `Completed` y `Archived` el lápiz no se renderiza y el 403/409 por estado deja de ser
alcanzable desde la UI. El dropdown de status no cambia: sigue gobernado por `getAllowedMilestoneTransitions`
(un milestone `Completed` todavía puede archivarse).

### RF-6 — Chip de milestone teñido en la tarjeta del board

`MilestoneTag` pasa de `{ name, standalone }` a `{ name, color, standalone }`. Reemplaza las clases
indigo por estilo inline: fondo `${hex}1F` (12% alpha sobre el blanco de la tarjeta) y texto
`resolveSwatchInk(color)`. `color === null` cae al gris de fallback de `resolveSwatchColor`
(`#94A3B8`) en vez de ocultar el chip.

**Se elimina el ícono de milestone del chip:** con el color cumpliendo la función de identificar el
milestone, el ícono dejó de aportar. Al quedar un solo hijo, el truncado vuelve a ir directo en el
`Badge` (`min-w-0 shrink truncate`, igual que el chip de Component) en lugar del split ícono + `<span>`
que exigía el combo de dos elementos, y se cae el `gap-1`. El tooltip sigue diciendo
`Milestone: {name}`, que es lo que ahora distingue semánticamente los dos chips. La regla de
una-fila/dos-filas no cambia.

### RF-7 — Color en el detalle del work item

- `WorkItemSidebar`: la fila Milestone antepone el punto de color (mismo shape que RF-4) cuando hay
  milestone asignado; sin milestone se mantiene el texto "No milestone" sin punto.
- `MilestoneSelect`: cada opción y el valor del trigger muestran su punto de color.
- `useUpdateWorkItemMilestone`: `UpdateMilestoneVars` += `milestoneColor: string | null`; el update
  optimista escribe `milestoneName` + `milestoneColor` en `['work-item', code]` y en
  `['project-board', projectId]`, tomando el color del `ProjectMilestone` ya cargado en el cliente.

### RF-8 — El board refleja el rename/recolor de un milestone

`ProjectBoardWorkItem` guarda una **copia** del nombre y el color del milestone, igual que
`WorkItemDetailResponse`: no hay join por `milestoneId` en el cliente. Por eso `useUpdateMilestone`
—que hoy sólo invalida `['project-milestones', projectId]`— deja el board mostrando el nombre y el
color viejos hasta que su query expire por `staleTime` (5 min, default global).

`useUpdateMilestone.onSettled` pasa a invalidar también:

- `['project-board', projectId]` con **`refetchType: 'all'`**: mientras la tab Milestones está abierta
  esa query está inactiva, y el default (`'active'`) sólo la marcaría stale — al volver a Board se
  vería el chip viejo durante el refetch en background. Con `'all'` el refetch ocurre en el momento
  de la edición, así que la vuelta a Board ya encuentra el cache correcto.
- `['work-item']` (prefijo, refetch por default sólo de las activas): el detalle abierto se actualiza
  y los detalles cacheados quedan stale para el próximo open.

No aplica a `useCreateMilestone` (un milestone nuevo no tiene work items) ni a
`useUpdateMilestoneStatus` (el board no muestra el status del milestone; el sufijo "(Archived)" del
sidebar sale de `['project-milestones']`, que ya se invalida).

---

## 6. UI/UX

| Elemento | Tratamiento |
|---|---|
| Label del campo | `Color`, sin "(optional)" — junto a Name, los dos obligatorios |
| Picker | `ColorSwatchGrid size="sm"`, inline, alineado a la izquierda |
| Error de validación | `Color is required`, `text-xs text-destructive` bajo el grid |
| Punto de color (listado / sidebar) | `w-2.5 h-2.5 rounded-full shrink-0`, `backgroundColor: hex` |
| Chip del board | `Badge` actual sin ícono, `backgroundColor: hex+1F`, `color: ink` |
| Fallback | `resolveSwatchColor('')` → `#94A3B8` |

---

## 7. Data Requirements

- `color`: string, requerido, ≤ 20 chars, clave del catálogo `SWATCH_COLORS` (20 entradas).
- Sin unicidad: dos milestones del mismo proyecto pueden compartir color.
- `milestoneColor` (board y detalle de work item): `string | null`.

---

## 8. Non-Functional

- Contraste AA (≥ 4.5:1) del texto del chip para los 20 colores; `SWATCH_INK` se calcula con objetivo
  5:1 para dejar margen.
- Sin requests adicionales: el color viaja dentro de payloads y respuestas ya existentes.
- Sin cálculo de contraste en runtime.

---

## 9. Acceptance Criteria

- **AC-1** — Dado un project admin en la tab Milestones, cuando abre "Add milestone", entonces el campo
  Color aparece preseleccionado con el color del proyecto y "Create milestone" está habilitado sin tocarlo.
- **AC-2** — Dado el form de creación, cuando elige un swatch y guarda, entonces el `POST` incluye
  `color` con la clave elegida y la fila nueva del listado muestra ese color.
- **AC-3** — Dado un milestone existente, cuando abre "Edit", entonces el swatch de su color actual
  aparece seleccionado.
- **AC-4** — Dado el form de edición, cuando cambia sólo el color y guarda, entonces el `PUT` envía los
  cinco campos y el listado refleja el color nuevo.
- **AC-5** — Dado un milestone en `Completed` o `Archived`, entonces el botón Edit no se renderiza.
- **AC-6** — Dado un milestone en `Completed`, entonces el dropdown de status sigue ofreciendo `Archived`.
- **AC-7** — Dado el board con work items de distintos milestones, entonces cada chip se tiñe con el
  color de su milestone y ninguno usa el indigo fijo anterior.
- **AC-8** — Dado un work item cuyo `milestoneColor` es `null` pero con `milestoneName`, entonces el chip
  se muestra en gris de fallback, no se oculta.
- **AC-9** — Dado el detalle de un work item con milestone, entonces la fila Milestone muestra el punto
  del color del milestone.
- **AC-10** — Dado el sidebar, cuando reasigna el milestone, entonces el punto y el nombre cambian de
  inmediato (optimista) y el chip de la tarjeta del board detrás también, sin esperar al refetch.
- **AC-11** — Dado que la reasignación falla, entonces nombre y color vuelven al valor previo y aparece
  el toast de rollback.
- **AC-12** — Dado `pnpm build`, entonces no queda ninguna referencia a `ProjectBoardWorkItem.milestone`.
- **AC-13** — Dado un milestone con work items en el board, cuando se le cambia el nombre o el color
  desde la tab Milestones y se vuelve a la tab Board, entonces las tarjetas muestran el nombre y el
  color nuevos, sin refresh de página y sin mostrar primero los viejos.
- **AC-14** — Dado ese mismo cambio, cuando se abre el detalle de uno de esos work items, entonces la
  fila Milestone muestra el nombre y el color nuevos.

---

## 10. Integration Points

| RF | Archivo |
|---|---|
| RF-1 | `features/projects/types/milestone.types.ts`, `features/projects/types/project.types.ts`, `features/work-items/types/work-item.types.ts` |
| RF-2 | `shared/constants/colors.ts` |
| RF-3 | `features/projects/components/MilestoneFormModal.tsx`, `features/projects/schemas/milestone.schema.ts`, `features/projects/components/ProjectBoardPage.tsx` (pasa `defaultColor`) |
| RF-4 | `features/projects/components/ProjectMilestonesSection.tsx` |
| RF-5 | `features/projects/constants/milestone-status.ts`, `features/projects/components/ProjectMilestonesSection.tsx` |
| RF-6 | `features/projects/components/ProjectBoardPage.tsx` |
| RF-7 | `features/work-items/components/WorkItemSidebar.tsx`, `features/work-items/components/MilestoneSelect.tsx`, `features/work-items/hooks/useUpdateWorkItemMilestone.ts` |
| RF-8 | `features/projects/hooks/useUpdateMilestone.ts` |

---

## 11. Permissions

Sin cambios de modelo: el color se edita dentro del `PUT` existente — project admin y milestone en
`Draft`/`Active`/`OnHold`. RF-5 sólo alinea la UI con esa regla ya vigente en el backend.

---

## 12. Out of Scope

- Filtrar o agrupar el board por milestone.
- Endpoint dedicado para cambiar sólo el color (va dentro del `PUT` completo).
- Color de milestone en `MyIssuesPage`.
- Editar el color desde la tarjeta del board.
- Color en el change-log / distinguir un `MilestoneChanged` por cambio de color.
- Input libre de hex o color picker nativo — el catálogo es el de siempre.

---

## 13. Dependencies

Backend `feature/milestone-color` desplegado en el entorno donde se verifique: los cinco cambios de
contrato (POST, PUT, GET milestones, GET board, GET work-item) son simultáneos.

---

## 14. Open Questions

- **OQ-1 — RESUELTA (2026-09-19)**, verificada contra el backend local (`https://localhost:7066`,
  proyecto Test Manager `883364fb-…`): el color viaja como **clave del swatch**, no como hex. La nota
  del backend ejemplificaba `"#F97316"`, pero:
  - `GET projects/{id}/milestones` devuelve `"color": "sky"` — los 9 milestones existentes quedaron con
    la clave del proyecto padre (Test Manager es `sky`), confirmando el backfill.
  - `GET projects/{id}/board` ya trae `milestoneName` + `milestoneColor` (`"sky"`) y **no** trae `milestone`.
  - `GET work-items/TST-5` trae `milestoneColor: "sky"`.
  - `POST …/milestones` sin `color` → **400**; con `"color":"orange"` → creado; `PUT` con `"violet"` → 202
    y el readback devuelve `violet`.
- **OQ-2 — Nota de contrato:** el `PUT` sobre un milestone congelado responde **400**, no 403/409 como
  indicaba la nota del backend. No afecta la implementación (RF-5 impide llegar a ese estado desde la
  UI) y el banner del form muestra igual el mensaje del `ApiError`.

---

## 15. Final Assumptions

1. `color` es la clave del swatch (`"orange"`), no el hex.
2. El color sale del catálogo fijo de 20 `SWATCH_COLORS`; sin input libre.
3. Default al crear = color del proyecto padre.
4. Picker inline (`ColorSwatchGrid size="sm"`), no popover.
5. Campo Color entre Description y las fechas.
6. En el listado, punto a la izquierda del nombre; sin columna nueva.
7. En la tarjeta del board, el color tiñe fondo + texto e ícono del badge.
8. `milestoneColor === null` → gris de fallback, no se oculta el indicador.
9. En el sidebar del work item, punto antes del nombre; no un badge completo.
10. `MilestoneSelect` muestra punto de color por opción.
11. El update optimista propaga `milestoneColor` desde el `ProjectMilestone` ya cargado.
12. `canEdit` se alinea con el backend vía `isMilestoneEditable` (`Draft`/`Active`/`OnHold`).
13. Sin color en el historial/change-log.
