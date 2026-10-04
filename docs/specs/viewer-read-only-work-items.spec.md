# Especificación de Funcionalidad: Viewer de solo lectura sobre work items

- **Versión:** 1.0
- **Fecha:** 2026-10-03
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Implemented — assumptions confirmadas, implementado y verificado en el navegador contra backend real (2026-10-03): AC1–AC4 y AC8; AC6/AC7 cubiertos solo a nivel de API (403/400 confirmados), sin simular la UI desincronizada
- **Área afectada:** `src/features/projects/components/ProjectBoardPage.tsx`,
  `src/features/projects/utils/project-permissions.ts`, `src/features/work-items/components/AssigneeSelect.tsx`,
  `src/features/work-items/hooks/`, `src/shared/hooks/useOptimisticMutation.ts`, `src/shared/lib/query-keys.ts`
- **Contrato backend:** `aurora-flowboard-api`, rama `fix/block-viewer`, commit `faa42d1` ("Block Viewer role from modifying work items")

---

## 1. Overview

El backend convierte el rol de proyecto `Viewer` en solo lectura sobre work items, salvo comentarios. La
regla vive en el dominio (`WorkItem`); no cambió ningún endpoint, request ni response, solo hay errores nuevos:

| Error | HTTP | Cuándo |
|---|---|---|
| `WorkItem.ViewerCannotModify` | `403` | Un Viewer crea un work item, edita cualquier campo (title, description, type, priority, estimated-points, estimated-completion-date, component, milestone), hace `move`, `assign`/`unassign`, registra horas o agrega/quita tags. |
| `WorkItem.AssigneeIsViewer` | `400` | Se crea un work item con un assignee Viewer, o se hace `assign` a un Viewer. |

- `detail` del ProblemDetails: *"Project members with the Viewer role cannot modify work items"* / *"Work items cannot be assigned to project members with the Viewer role"*.
- El código de dominio no viene en un campo propio (va embebido en `title`).
- Un no-miembro sigue recibiendo `404`.
- **Comentarios:** el Viewer puede agregar, y editar/eliminar los propios (solo el autor, como cualquier rol).
- **Caso aceptado:** no hay endpoint para cambiar el rol de un miembro. Si se lo quita y se lo re-agrega como Viewer, conserva sus asignaciones; un item puede mostrar un assignee Viewer.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad |
|---|---|
| "`canAddOrUpdateWorkItems` ya bloquea al Viewer" | **Falso.** En el backend es `Project.CanAddOrUpdateWorkItem() => IsModifiable`: depende solo del estado del proyecto. Hoy un Viewer ve habilitados **+ New issue** y todos los campos del sidebar. |
| "Hay drag & drop en el board" | **Falso.** El move se hace desde `StatusSelect` en `WorkItemSidebar`. |
| "Hay UI para registrar horas o para tags" | **Falso.** Solo lectura (tab Time entries y tags del detalle). No hay nada que ocultar. |
| "Los comentarios dependen de una bandera propia" | **Cierto.** `canComment = canAddOrUpdateWorkItems && status ∈ {Active, Maintenance}` (`ProjectBoardPage.tsx`). No mira el rol. |
| "El error del backend llega legible" | **Cierto.** `getErrorMessage` muestra el `detail` del `ApiError`. |
| "El rol del usuario está disponible" | **Cierto.** `project.members[].role` + `useAuthStore().user.id`, el mismo patrón que `hasProjectAdminRole`. |
| "El selector de assignee recibe todos los miembros" | **Cierto.** `AssigneeSelect` recibe `project.members` desde `CreateWorkItemModal` y `WorkItemSidebar`. |
| "El detalle de work item se abre fuera del board" | **Falso.** `WorkItemDetailModal` solo se monta en `ProjectBoardPage`; My Issues es un placeholder. |

---

## 3. Goal y criterios de éxito

**Goal:** la UI no le ofrece a un Viewer ninguna escritura sobre work items que el backend vaya a rechazar,
salvo los comentarios, y nadie puede elegir a un Viewer como assignee.

**Criterios de éxito:**
- Un Viewer ve **+ New issue** deshabilitado, con un tooltip que explica el motivo.
- En el detalle, el Viewer ve todos los campos en el modo de solo lectura existente.
- El Viewer agrega comentarios y edita/elimina los suyos.
- Ningún miembro Viewer aparece como opción en el selector de assignee.
- Si la UI está desincronizada, el 403/400 muestra el mensaje del backend, revierte el cambio optimista y
  refresca el proyecto para que la UI pase a reflejar el rol real.

---

## 4. User flows y edge cases

### 4.1 Viewer en el board
1. El Viewer abre `/projects/:id/board`.
2. **+ New issue** aparece deshabilitado; al pasar el puntero muestra *"Viewers can't create work items"*.
3. Si además el proyecto no es modificable, prevalece el mensaje existente (*"You do not have permission to add work items to this project"*).

### 4.2 Viewer en el detalle de un work item
1. El Viewer abre un work item.
2. Título y descripción no son editables; status, assignee, type, priority, points, fecha, component y
   milestone se muestran como texto (el mismo modo `!canEditField` que usa un item `Cancelled`).
3. El tab Comments muestra el compositor y, sobre sus propios comentarios, Edit/Delete.

### 4.3 Elegir assignee (cualquier rol con permiso de edición)
1. Al crear o reasignar, la lista de opciones excluye a los miembros con rol `Viewer`.
2. Si el item ya tiene un Viewer asignado, el trigger sigue mostrándolo como valor actual; una vez cambiado,
   no se puede volver a elegir.

### 4.4 UI desincronizada
- **Rol cambiado a Viewer con el detalle abierto:** la edición falla con `403`; toast
  *"Project members with the Viewer role cannot modify work items — changes reverted"*, rollback, y se
  refresca el detalle del proyecto, con lo que la UI pasa a solo lectura.
- **Assignee convertido en Viewer:** `assign` falla con `400`; toast con el `detail`, rollback, refresco del
  proyecto; el selector deja de ofrecerlo.
- **Crear:** el `403`/`400` aparece en el banner del modal (comportamiento actual) y se refresca el proyecto.

### 4.5 Edge cases
- Proyecto cargando o usuario ausente de `members`: no editable (comportamiento actual: `project` es `undefined`).
- Administrator del workspace que es Viewer en el proyecto: solo lectura; el backend decide por el rol de proyecto.

---

## 5. UI/UX

| Elemento | Viewer | Otros roles |
|---|---|---|
| **+ New issue** | Deshabilitado + tooltip *"Viewers can't create work items"* | Sin cambios |
| Campos del detalle | Solo lectura, sin candados ni iconos extra | Sin cambios |
| Comentarios | Habilitados (reglas actuales) | Sin cambios |
| Opciones del selector de assignee | — | Sin miembros Viewer |
| Assignee Viewer existente | Se ve igual que cualquier otro (avatar + nombre) | Igual |
| Banner/badge "Read-only" | No hay | — |

---

## 6. Data requirements

Sin cambios de contrato. Se usa `members[].role` (`ProjectRole`, serializado como string) de
`GET /projects/{id}` y el `user.id` del auth store.

---

## 7. Permissions & roles

- `canEditWorkItems = project.canAddOrUpdateWorkItems && !isProjectViewer(project.members, user.id)`.
- `canComment` no cambia (no depende del rol).
- `isProjectViewer` vive en `features/projects/utils/project-permissions.ts`, junto a `hasProjectAdminRole`.

---

## 8. Integration points

- `ProjectBoardPage` calcula `canEditWorkItems` y lo pasa como `canEdit` a `WorkItemDetailModal`.
- `AssigneeSelect` filtra las opciones; el lookup del valor actual sigue usando todos los miembros.
- `useOptimisticMutation`: `invalidate` recibe también el error del settle.
- `useOptimisticWorkItemMutation` y `useCreateWorkItem`: ante un `ApiError` `403` o `400` invalidan el detalle
  de proyecto. Se distingue solo por status; no se parsea el código del `title`.

---

## 9. Out of scope

- UI para tags y horas (no existe).
- Cambiar el rol de un miembro (no hay endpoint).
- Limpiar asignaciones existentes de Viewers.
- My Issues (placeholder).
- Agrupado por assignee, `MemberAvatarStack` y gestión de miembros en `ProjectDetailsModal`: sin cambios.

---

## 10. Acceptance criteria

**AC1 — Crear deshabilitado**
- *Given* un usuario Viewer en un proyecto Active
- *When* abre el board
- *Then* **+ New issue** está deshabilitado y su tooltip dice *"Viewers can't create work items"*.

**AC2 — Detalle en solo lectura**
- *Given* un usuario Viewer
- *When* abre un work item
- *Then* ningún campo (título, descripción, status, assignee, type, priority, points, fecha, component, milestone) es editable.

**AC3 — Comentarios habilitados**
- *Given* un usuario Viewer en un proyecto Active o Maintenance
- *When* abre el tab Comments
- *Then* puede agregar un comentario, y editar/eliminar solo los propios.

**AC4 — Viewers fuera del selector**
- *Given* un proyecto con un miembro Viewer
- *When* un Developer abre el selector de assignee al crear o reasignar
- *Then* el Viewer no aparece entre las opciones.

**AC5 — Assignee Viewer existente**
- *Given* un work item asignado a un miembro que hoy es Viewer
- *When* se abre el detalle
- *Then* el assignee se muestra con su avatar y nombre, y el selector lo muestra como valor actual.

**AC6 — 403 desincronizado**
- *Given* un usuario cuyo rol pasó a Viewer con el detalle abierto
- *When* edita un campo
- *Then* ve un toast con el mensaje del backend, el cambio se revierte y la UI pasa a solo lectura tras refrescar el proyecto.

**AC7 — 400 desincronizado**
- *Given* un miembro que pasó a Viewer y sigue en un selector abierto
- *When* se lo asigna
- *Then* aparece un toast con el mensaje del backend, el cambio se revierte y el selector deja de ofrecerlo.

**AC8 — Otros roles sin cambios**
- *Given* un usuario Developer, Analyst, QA o Admin
- *When* usa el board y el detalle
- *Then* todo funciona como antes.

---

## 11. Final assumptions

1. **+ New issue** visible pero deshabilitado para el Viewer, con el tooltip *"Viewers can't create work items"*.
2. Campos del detalle en el modo de solo lectura existente, sin candados ni iconos.
3. Sin banner ni badge "Read-only"; el tooltip del botón es la única pista explícita.
4. Comentarios con las reglas actuales: el Viewer agrega y edita/elimina solo los propios.
5. Viewers excluidos del selector de assignee al crear y reasignar; un assignee Viewer existente se sigue mostrando como valor actual, pero no se puede volver a elegir.
6. Un assignee Viewer se ve igual que cualquier otro, sin marca.
7. Ante `403`/`400`: toast con `getErrorMessage`, rollback optimista e invalidación del detalle de proyecto.
8. El `403`/`400` se distingue solo por status; no se parsea el código del `title`.
9. Proyecto cargando o usuario ausente de `members`: no editable.
10. Agrupado por assignee, `MemberAvatarStack` y gestión de miembros sin cambios.
11. Spec en `docs/specs/viewer-read-only-work-items.spec.md`; la regla se documenta en `.claude/rules/work-items.md`.
