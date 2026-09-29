# Especificación de Funcionalidad: Agrupamiento del Board

- **Versión:** 1.0
- **Fecha:** 2026-09-25
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Decisiones confirmadas por el usuario — en implementación
- **Branch:** `feature/board-group`
- **Área afectada:** `src/features/projects/`

---

## 1. Overview

Requerimiento: *"Agregar criterios de agrupamiento en el board. Las opciones de agrupamiento son Ninguno,
Asignado, Tipo, Milestone, Componente."*

El board de un proyecto (`/projects/:id/board`) muestra hoy una columna por flow state con todas sus
cards. Se agrega un selector **Group by** que, con una opción distinta de *None*, reorganiza el board en
**swimlanes**: una franja horizontal colapsable por grupo, con las mismas columnas de estado dentro de
cada franja. Con *None* el board se ve exactamente como hoy.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El board trae los datos para agrupar" | **Cierto.** `ProjectBoardWorkItem` (`types/project.types.ts`) trae `assigneeId`, `assigneeFullName`, `assigneeInitials`, `type`, `milestoneName`, `milestoneColor`, `component`. |
| "Milestone y componente vienen con id" | **Falso.** El board solo trae el **nombre** (`milestoneName`, `component`). La clave de agrupamiento es el nombre. |
| "Hay espacio para el selector sin agregar una fila" | **Cierto.** La fila de tabs (`RouteTabs`, `ProjectBoardPage.tsx`) solo ocupa la izquierda. |
| "Existe un componente de acordeón" | **Parcial.** No hay wrapper en `src/components/ui/`, pero `@base-ui/react/accordion` ya está instalado. |
| "La config de tipos está centralizada" | **Parcial.** Existe `WORK_ITEM_TYPE_CONFIG` en `work-items/constants/work-item-display.ts`, pero `ProjectBoardPage` tiene una copia local (`TYPE_CONFIG`). |
| "Los milestones del proyecto tienen fecha" | **Cierto.** `ProjectMilestone.targetStartDate` (`YYYY-MM-DD` o `null`), vía `useProjectMilestones`. |

---

## 3. Goal

Que un miembro del proyecto pueda ver el board partido por responsable, tipo, milestone o componente,
colapsar las franjas que no le interesan y leer el avance de un grupo colapsado de un vistazo, sin salir
del board ni perder el layout actual cuando no agrupa.

---

## 4. User Stories

- **US-1** — Como miembro del proyecto, quiero agrupar el board por asignado, para ver la carga de cada persona (la mía primero).
- **US-2** — Como miembro, quiero agrupar por tipo, milestone o componente, para revisar el avance de cada uno por separado.
- **US-3** — Como miembro, quiero colapsar y expandir franjas (una o todas), para concentrarme en los grupos que me interesan.
- **US-4** — Como miembro, quiero que la opción elegida quede en la URL, para refrescar o compartir el link sin perderla.

---

## 5. Requisitos Funcionales

### RF-1 — Selector Group by
- Opciones: `None`, `Assignee`, `Type`, `Milestone`, `Component` (UI en inglés, como el resto de la app).
- Se ubica en la fila de tabs del proyecto, alineado a la derecha. Solo visible en el tab **Board**.
- Default: `None`.

### RF-2 — Persistencia en la URL
- `?groupBy=assignee|type|milestone|component`. `None` = parámetro ausente.
- Un valor desconocido se trata como `None`.
- Cambiar la opción preserva los demás parámetros (p.ej. `selected`) y no agrega entradas al historial.

### RF-3 — Modo None
- El board se renderiza exactamente como antes de esta feature.

### RF-4 — Swimlanes
- Encabezados de columna (flow states sin `Cancelled`, mismo orden que hoy) una sola vez, fijos arriba al hacer scroll, con el total de items por columna.
- Una franja por grupo con items. Dentro de cada franja, una celda por columna con las cards de ese grupo en ese estado, en el orden que envía la API.
- Solo se muestran grupos con al menos un item. Los items sin valor van a un grupo final: `Unassigned`, `No milestone`, `No component`.

### RF-5 — Orden de los grupos
| Group by | Orden |
|---|---|
| Assignee | Usuario logueado primero (marcado "(you)"), luego A→Z por nombre, `Unassigned` último |
| Type | Story, Bug, Technical Task, Investigation |
| Milestone | Por `targetStartDate` ascendente (cruce por nombre con los milestones del proyecto); sin fecha al final; `No milestone` último. Mientras cargan los milestones, A→Z |
| Component | A→Z, `No component` último |

### RF-6 — Encabezado de franja
- Chevron, identidad (avatar del asignado / ícono del tipo / color del milestone / nada para componente), nombre, conteo.
- Con la franja **colapsada**, se muestra además una barra segmentada (*flow strip*) con un segmento por estado con items, ancho proporcional y color del flow state; tooltip con el detalle por estado.

### RF-7 — Colapsar / expandir
- Click (o teclado) en el encabezado alterna la franja.
- Botón junto al selector: `Collapse all` si hay alguna franja abierta, si no `Expand all`.
- Al entrar a un agrupamiento todas las franjas están abiertas. El estado de colapso no se persiste y se resetea al cambiar de opción.

### RF-8 — Milestones bajo demanda
- La lista de milestones solo se pide con `groupBy=milestone` (si ya está en caché no hay request).

---

## 6. Acceptance Criteria

- **AC-1** — Dado el board sin `groupBy`, entonces se ve idéntico al board previo a esta feature.
- **AC-2** — Dado el board, cuando elijo `Assignee`, entonces la URL pasa a `?groupBy=assignee`, aparece una franja por persona con items, la mía primero con "(you)", y `Unassigned` al final si hay items sin asignar.
- **AC-3** — Dado `?groupBy=milestone`, entonces las franjas siguen el orden de `targetStartDate` de los milestones y `No milestone` va último.
- **AC-4** — Dada una franja abierta, cuando hago click en su encabezado, entonces se colapsa y muestra la flow strip con su tooltip por estado.
- **AC-5** — Dadas franjas abiertas, cuando uso `Collapse all`, entonces todas se colapsan y el botón pasa a `Expand all`.
- **AC-6** — Dado `?groupBy=type`, cuando refresco la página, entonces el board sigue agrupado por tipo.
- **AC-7** — Dado `?groupBy=foo`, entonces el board se ve como `None`.
- **AC-8** — Dado un board agrupado, cuando abro una card, entonces la URL conserva `groupBy` y al cerrar el modal el board sigue agrupado.
- **AC-9** — Dado un board agrupado, cuando reasigno o muevo un item desde el modal, entonces tras el refetch del board el item aparece en su nueva franja/columna.
- **AC-10** — Dado un board agrupado con muchas franjas, cuando hago scroll vertical, entonces los encabezados de columna quedan visibles arriba.
- **AC-11** — Dado `groupBy` ≠ `milestone`, entonces no se dispara `GET` de milestones.

---

## 7. Integration Points

| RF | Archivo |
|---|---|
| RF-1, RF-7 | `src/features/projects/components/BoardGroupByControl.tsx` (nuevo) |
| RF-1, RF-2, RF-3 | `src/features/projects/components/ProjectBoardPage.tsx` |
| RF-1 | `src/features/projects/constants/board-group-by.ts` (nuevo) |
| RF-4, RF-5 | `src/features/projects/utils/group-board-items.ts` (nuevo) |
| RF-4, RF-6, RF-7 | `src/features/projects/components/BoardSwimlanes.tsx` (nuevo) |
| RF-4 | `src/features/projects/components/WorkItemCard.tsx` (extraído de `ProjectBoardPage`) |
| RF-8 | `src/features/projects/hooks/useProjectMilestones.ts` |

---

## 8. Permisos

Sin cambios: cualquier miembro que ve el board puede agrupar. Agrupar no modifica datos.

---

## 9. Out of Scope

- Drag & drop entre franjas o columnas.
- Conservar `groupBy` al cambiar de tab (Components/Milestones → Board): `RouteTabs` navega sin query string.
- Persistir la opción por proyecto (localStorage) o el estado de colapso.
- Mostrar grupos vacíos (milestones/componentes sin items).
- Agrupar por otros campos (prioridad, tags, reporter).

---

## 10. Final Assumptions

1. La clave de grupo de Milestone y Component es el nombre (el board no trae ids).
2. Los items con estado `Cancelled` siguen fuera del board, igual que hoy.
3. Si dos milestones compartieran nombre, el orden usa el primero que coincida.
