# Especificación de Funcionalidad: Comentarios de Work Item (agregar, editar, eliminar)

- **Versión:** 1.0
- **Fecha:** 2026-09-23
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Implemented — assumptions confirmadas, implementado y verificado en el navegador contra backend real (2026-09-24)
- **Área afectada:** `src/features/work-items/components/`, `src/features/work-items/hooks/`,
  `src/features/work-items/services/`, `src/features/work-items/types/`, `src/features/projects/components/ProjectBoardPage.tsx`
- **Contrato backend:** `aurora-flowboard-api` — endpoints de comentarios ya implementados

---

## 1. Overview

El detalle de un work item (`WorkItemDetailModal`) ya muestra un tab **Comments** en modo solo lectura,
paginado y cargado de forma lazy. El backend expone ahora las operaciones de escritura sobre esa
sub-colección:

| Operación | Endpoint | Respuesta |
|---|---|---|
| Listar | `GET /v1/flowboard/work-items/{id}/comments?page=&pageSize=` | `200` `PagedResult<WorkItemComment>` |
| Agregar | `POST /v1/flowboard/work-items/{id}/comments` | `202 Accepted`, sin body |
| Editar | `PUT /v1/flowboard/work-items/{id}/comments/{commentId}` | `202 Accepted`, sin body |
| Eliminar | `DELETE /v1/flowboard/work-items/{id}/comments/{commentId}` | `202 Accepted`, sin body (soft delete) |

`{id}` es el **GUID** del work item (`workItemId` del detalle), no su `code`.

Esta especificación convierte el tab Comments en una superficie de escritura: un compositor para
agregar comentarios y, sobre los comentarios propios, acciones para editarlos inline y eliminarlos con
confirmación.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El tab Comments ya existe" | **Cierto.** `WorkItemActivitySections.tsx:251-270` renderiza autor, `formatDateTime(createdOnUtc)`, `(edited)` cuando `updatedOnUtc` no es null, y el contenido con `whitespace-pre-wrap`. Es el tab por defecto. |
| "La lista ya está paginada y conectada al endpoint" | **Cierto.** `getWorkItemComments` (`work-item.service.ts:115`) + `useWorkItemComments` con query key `['work-item-activity', workItemId, 'comments', page]`, `enabled` solo con el tab activo, `keepPreviousData`. |
| "Si una página queda vacía se retrocede" | **Cierto.** `ActivityPanel` salta a `totalPages` cuando `page > totalPages` (`WorkItemActivitySections.tsx:113-117`). Sirve tal cual para el caso "borré el último comentario de la página". |
| "Existe algún servicio/hook de escritura de comentarios" | **Falso.** No hay `addWorkItemComment`, `updateWorkItemComment` ni `deleteWorkItemComment`, ni sus hooks. |
| "El id del usuario autenticado está disponible" | **Cierto.** `useAuthStore().user.id` (`AuthUser.id`, `auth.types.ts`). |
| "El modal conoce el estado del proyecto" | **Falso.** `WorkItemDetailModal` solo recibe `canEdit` (= `project.canAddOrUpdateWorkItems`, `ProjectBoardPage.tsx:272,359`). `WorkItemDetailResponse` no trae el estado del proyecto. `ProjectBoardPage` sí tiene `project.status`. |
| "`apiFetch` expone el `detail` del ProblemDetails" | **Cierto.** `api-client.ts:100-102` lanza `ApiError(status, body.detail ?? statusText)`. Una respuesta `202` sin body resuelve a `undefined` sin error. |
| "El board expone el número de comentarios" | **Cierto.** `ProjectBoardWorkItem.commentCount` (`project.types.ts:109`). |
| "Change Log ya sabe describir eventos de comentario" | **Cierto.** `CommentAdded` / `CommentUpdated` / `CommentRemoved` están en `WorkItemChangeType` y en `work-item-display.ts:34-36,73-77`. |
| "Existe un componente AlertDialog" | **Falso.** `src/components/ui/` no tiene `alert-dialog.tsx`. Hay `dialog.tsx` y `dropdown-menu.tsx`. |

No hay causa raíz que corregir: es funcionalidad nueva sobre una lectura ya existente.

---

## 3. Goal y criterios de éxito

**Goal:** que un miembro del proyecto pueda agregar comentarios a un work item, y editar o eliminar los
propios, desde el tab Comments del detalle, sin salir del modal.

**Criterios de éxito:**
- Un comentario recién agregado aparece al tope de la lista sin recargar el modal.
- Solo el autor de un comentario ve las acciones Edit/Delete sobre él.
- En un proyecto `Completed` o `Archived` no se ofrece ninguna acción de escritura.
- Tras cualquier escritura, el tab Change Log y el `commentCount` del board reflejan el cambio.

---

## 4. User Stories

- **US-1** — Como miembro del proyecto, quiero escribir un comentario en un work item, para dejar
  contexto o preguntas a mi equipo.
- **US-2** — Como autor de un comentario, quiero corregir su texto, para arreglar errores sin borrar y
  volver a escribir.
- **US-3** — Como autor de un comentario, quiero eliminarlo, para retirar algo que ya no aplica o que
  publiqué por error.
- **US-4** — Como miembro de un proyecto cerrado (`Completed`/`Archived`), quiero leer los comentarios
  sin ver controles que el backend va a rechazar.

---

## 5. Requisitos Funcionales

### RF-1 — Tipos de request

En `src/features/work-items/types/work-item.types.ts`:

```ts
export interface AddWorkItemCommentRequest {
  content: string
}

export interface UpdateWorkItemCommentRequest {
  content: string
}
```

`WorkItemComment` agrega `authorInitials: string` (nunca null; `"U"` si el backend no resuelve al autor),
acordado con el backend el 2026-09-24. El avatar de cada comentario lo usa tal cual: el front no calcula
iniciales a partir de `authorFullName`. El compositor usa `user.initials` del auth store (`"U"` si es null).
`content: string | null` se sigue renderizando como `''` cuando es null.

### RF-2 — Servicios

En `src/features/work-items/services/work-item.service.ts` (sub-colección sin ciclo de vida propio: se
queda en el servicio del recurso padre, según `CLAUDE.md`):

```ts
addWorkItemComment(workItemId: string, content: string): Promise<void>
  // POST /v1/flowboard/work-items/{workItemId}/comments        body { content }
updateWorkItemComment(workItemId: string, commentId: string, content: string): Promise<void>
  // PUT  /v1/flowboard/work-items/{workItemId}/comments/{commentId}  body { content }
deleteWorkItemComment(workItemId: string, commentId: string): Promise<void>
  // DELETE /v1/flowboard/work-items/{workItemId}/comments/{commentId}
```

El `content` se envía ya con `trim()` aplicado.

### RF-3 — Schema de validación

`src/features/work-items/schemas/work-item-comment.schema.ts`:

```ts
export const COMMENT_MAX_LENGTH = 4000
export const COMMENT_COUNTER_THRESHOLD = 3600

export const workItemCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(COMMENT_MAX_LENGTH),
})
```

Lo usan el compositor (RF-6) y el editor inline (RF-8), vía react-hook-form + `zodResolver`.

### RF-4 — Hook `useAddWorkItemComment(workItemId, projectId)`

- **No optimista**: el `POST` responde `202` sin body, así que no hay `commentId` para insertar una fila
  fiable.
- `onSuccess`: el llamador limpia el compositor y lleva la paginación de Comments a la página 1.
- `onError`: `toast.error(err.message)` (el `detail` del ProblemDetails) y el borrador **se conserva**.
- `onSettled`: invalida `['work-item-activity', workItemId]` y `['project-board', projectId]`.

### RF-5 — Hooks `useUpdateWorkItemComment` y `useDeleteWorkItemComment` (optimistas)

Firma: `(workItemId, projectId)`. Variables: `{ commentId, content }` / `{ commentId }`.

- `onMutate`: `cancelQueries(['work-item-activity', workItemId, 'comments'])`, snapshot de **todas** las
  páginas cacheadas de comments (`getQueriesData`) y luego:
  - **update**: reemplaza `content` y pone `updatedOnUtc = new Date().toISOString()` en la fila con ese
    `commentId`.
  - **delete**: quita la fila y decrementa `totalCount` en la página que la contenía.
- `onError`: restaura cada snapshot y `toast.error(\`${reason} — changes reverted\`)`, igual que el resto
  de mutations del work item. Si `status === 404` (comentario ya eliminado), el toast usa el `detail` y
  el refetch de `onSettled` sincroniza la lista.
- `onSettled`: invalida `['work-item-activity', workItemId]`. **Delete** además invalida
  `['project-board', projectId]` (`commentCount`). **Update** no toca el board.
- Sin toast de éxito en ninguna de las tres operaciones.

### RF-6 — Compositor de comentarios

Nuevo componente `WorkItemCommentComposer` dentro del tab Comments, **encima** de la lista (y encima del
empty state "No comments yet.").

- `Textarea` con placeholder `Add a comment…`, auto-crecimiento de 3 a 10 líneas, `maxLength={4000}`.
- Botón primario **Comment** alineado a la derecha, deshabilitado si el texto (trim) está vacío o si la
  mutación está en curso; muestra estado de carga mientras envía.
- `Ctrl+Enter` / `⌘+Enter` envía (misma validación que el botón).
- Durante el envío el textarea queda deshabilitado.
- Contador `3,812 / 4,000` (formato con `toLocaleString('en-US')`) visible solo cuando la longitud
  es ≥ 3600.

### RF-7 — Menú de acciones por comentario

- En la cabecera de cada tarjeta de comentario cuyo `authorId === useAuthStore().user?.id`, un botón
  icono `⋯` (`MoreHorizontal`, `aria-label="Comment actions"`) abre un `DropdownMenu` con **Edit** y
  **Delete** (este último con estilo destructive).
- Comentarios de otros autores no muestran el botón.

### RF-8 — Edición inline

- **Edit** sustituye el párrafo de contenido de esa tarjeta por un `Textarea` precargado (mismas reglas
  que RF-6: auto-crecimiento, `maxLength`, contador) con botones **Save** y **Cancel**.
- **Save** deshabilitado si el texto (trim) está vacío o es igual al original (trim).
- `Ctrl/⌘+Enter` guarda; `Esc` cancela.
- Solo un comentario en edición a la vez: abrir Edit en otro cancela (descarta) la edición abierta.
- Al guardar, la tarjeta sale del modo edición inmediatamente (update optimista, RF-5).
- Cambiar de página o de tab cancela la edición en curso.

### RF-9 — Confirmación de eliminación

- **Delete** abre un `Dialog` (del `dialog.tsx` existente; no se agrega un componente nuevo) con:
  - Título: `Delete comment`
  - Texto: `Delete this comment? This can't be undone.`
  - Botones: **Cancel** (outline) y **Delete** (destructive).
- Al confirmar, el diálogo se cierra y la fila desaparece de forma optimista (RF-5). Si la página queda
  vacía, el fallback existente de `ActivityPanel` retrocede a la última página con filas.

### RF-10 — Gating por permisos y estado del proyecto

- `ProjectBoardPage` calcula
  `canComment = canAddWorkItems && (project.status === 'Active' || project.status === 'Maintenance')`
  y lo pasa a `WorkItemDetailModal` → `WorkItemActivitySections` como prop `canComment`.
- Con `canComment === false`: el compositor **no se renderiza** y el menú `⋯` **no aparece**, ni siquiera
  en comentarios propios. No se muestra ningún texto explicativo.
- El estado `Cancelled` del work item (`isCancelled`) **no** afecta a comentarios.

---

## 6. UI/UX Behavior

| Elemento | Comportamiento |
|---|---|
| Compositor | Arriba de la lista. Textarea + botón **Comment**. Oculto si `canComment` es false. |
| Placeholder | `Add a comment…` |
| Botón enviar | `Comment`; deshabilitado con texto vacío/solo espacios o en envío. |
| Atajos | `Ctrl/⌘+Enter` envía/guarda; `Esc` cancela la edición. |
| Contador | Solo desde 3600 caracteres: `3,812 / 4,000`. |
| Menú por comentario | `⋯` → Edit / Delete, solo para el autor y con `canComment`. |
| Edición | Inline en la tarjeta; Save / Cancel; una a la vez. |
| Eliminación | Dialog de confirmación; Delete destructive. |
| Marca de edición | `(edited)` cuando `updatedOnUtc` no es null (sin cambios respecto a hoy). |
| Contenido | Texto plano, saltos de línea preservados (`whitespace-pre-wrap`); sin markdown. |
| Errores | `toast.error` con el `detail` del ProblemDetails; en update/delete se añade `— changes reverted`. |
| Éxito | Sin toast. |
| Borrador al cerrar el modal | Se descarta sin confirmación. |
| Idioma | Todos los textos de UI en inglés, consistentes con el modal. |

---

## 7. Data Requirements

| Campo | Origen | Regla |
|---|---|---|
| `content` (request) | Usuario | Requerido, `trim()`, 1–4000 caracteres. |
| `workItemId` | `WorkItemDetailResponse.workItemId` | GUID, nunca el `code`. |
| `commentId` | `WorkItemComment.commentId` | GUID. |
| Autor | Implícito (JWT) | No se envía. |
| `authorId` vs usuario | `useAuthStore().user.id` | Igualdad estricta de string para mostrar Edit/Delete. |

Paginación de lectura: sin cambios (`ACTIVITY_PAGE_SIZE = 20`, página 1-based, nunca < 1).

---

## 8. Non-Functional Requirements

- **Accesibilidad:** textarea con `aria-label="Add a comment"`; botón `⋯` con `aria-label`; foco al
  textarea al entrar en modo edición; foco devuelto al botón `⋯` al cancelar.
- **Sin parpadeo:** el refetch tras escribir mantiene la lista visible (`keepPreviousData` +
  `opacity-60` existente), sin skeleton.
- **Sin requests redundantes:** una escritura provoca como máximo un `GET .../comments` de la página
  activa; los tabs inactivos no se refetchean hasta que se abren.

---

## 9. Acceptance Criteria

### Agregar

**AC-1 — Enviar un comentario**
- **Dado** un work item de un proyecto `Active` y un usuario con `canAddOrUpdateWorkItems`
- **Cuando** escribe `"  Hola equipo  "` y pulsa **Comment**
- **Entonces** se envía `POST /v1/flowboard/work-items/{workItemId}/comments` con `{ "content": "Hola equipo" }`
- **Y** tras el `202` el textarea queda vacío, la lista está en la página 1 y el comentario aparece
  primero, con el nombre del usuario.

**AC-2 — Botón deshabilitado con texto vacío**
- **Dado** el compositor vacío o con solo espacios/saltos de línea
- **Entonces** el botón **Comment** está deshabilitado y `Ctrl/⌘+Enter` no envía nada.

**AC-3 — Atajo de teclado**
- **Dado** texto válido en el compositor
- **Cuando** el usuario pulsa `Ctrl+Enter` (o `⌘+Enter` en macOS)
- **Entonces** se comporta igual que pulsar **Comment**.

**AC-4 — Límite de longitud**
- **Dado** el compositor
- **Cuando** el texto llega a 3600 caracteres
- **Entonces** aparece el contador `3,600 / 4,000`
- **Y** el textarea no admite más de 4000 caracteres.

**AC-5 — Error al agregar conserva el borrador**
- **Dado** que el `POST` responde `400 Project.OperationNotAllowedInCurrentStatus`
- **Entonces** se muestra un toast de error con el `detail`
- **Y** el texto escrito permanece en el textarea.

**AC-6 — Efectos colaterales al agregar**
- **Dado** un `POST` exitoso
- **Entonces** se invalidan `['work-item-activity', workItemId]` y `['project-board', projectId]`
- **Y** al abrir el tab Change Log aparece una entrada "Comment added"
- **Y** el `commentCount` del work item en el board aumenta en 1.

### Editar

**AC-7 — Solo el autor ve el menú**
- **Dado** una página con comentarios propios y ajenos, en un proyecto `Active`
- **Entonces** solo los comentarios con `authorId === user.id` muestran el botón `⋯`.

**AC-8 — Edición inline exitosa**
- **Dado** un comentario propio
- **Cuando** el usuario elige **Edit**, cambia el texto y pulsa **Save**
- **Entonces** se envía `PUT .../comments/{commentId}` con el contenido recortado
- **Y** la tarjeta sale de edición mostrando el nuevo texto y `(edited)` de inmediato
- **Y** no se muestra toast de éxito.

**AC-9 — Save deshabilitado sin cambios**
- **Dado** el editor inline abierto
- **Cuando** el texto (trim) es igual al original o está vacío
- **Entonces** **Save** está deshabilitado.

**AC-10 — Cancelar edición**
- **Dado** el editor inline con cambios
- **Cuando** el usuario pulsa **Cancel** o `Esc`
- **Entonces** se restaura el texto original y no se envía ninguna request.

**AC-11 — Una edición a la vez**
- **Dado** el comentario A en edición con cambios
- **Cuando** el usuario elige **Edit** en el comentario B
- **Entonces** A vuelve a su texto original sin guardar y B entra en edición.

**AC-12 — Rollback al fallar la edición**
- **Dado** que el `PUT` responde `403 WorkItem.CommentNotOwnedByUser`
- **Entonces** el comentario vuelve a su texto anterior (y a su estado de `(edited)` anterior)
- **Y** se muestra un toast `"<detail> — changes reverted"`.

**AC-13 — Comentario eliminado desde otra sesión**
- **Dado** que el `PUT` o `DELETE` responde `404 WorkItem.CommentNotFound`
- **Entonces** se muestra un toast con el `detail`
- **Y** la lista se refetchea y el comentario ya no aparece.

**AC-14 — Editar no invalida el board**
- **Dado** un `PUT` exitoso
- **Entonces** se invalida `['work-item-activity', workItemId]` pero **no** `['project-board', projectId]`.

### Eliminar

**AC-15 — Confirmación**
- **Dado** un comentario propio
- **Cuando** el usuario elige **Delete**
- **Entonces** se abre un diálogo "Delete this comment? This can't be undone." y no se envía nada hasta
  confirmar.

**AC-16 — Eliminación exitosa**
- **Dado** el diálogo de confirmación abierto
- **Cuando** el usuario pulsa **Delete**
- **Entonces** se envía `DELETE .../comments/{commentId}`, el diálogo se cierra y la fila desaparece al
  instante
- **Y** se invalidan `['work-item-activity', workItemId]` y `['project-board', projectId]`.

**AC-17 — Último comentario de la página**
- **Dado** la página 2 con un único comentario (propio)
- **Cuando** el usuario lo elimina
- **Entonces** la vista retrocede a la página 1 sin mostrar un estado vacío intermedio.

**AC-18 — Rollback al fallar la eliminación**
- **Dado** que el `DELETE` responde `400 Project.OperationNotAllowedInCurrentStatus`
- **Entonces** el comentario reaparece en su posición y se muestra un toast `"<detail> — changes reverted"`.

### Permisos y estado

**AC-19 — Proyecto cerrado**
- **Dado** un work item de un proyecto `Completed` o `Archived`
- **Cuando** se abre el tab Comments
- **Entonces** no se renderiza el compositor ni el botón `⋯` (tampoco en comentarios propios)
- **Y** la lista y la paginación funcionan igual que hoy.

**AC-20 — Sin permiso de edición**
- **Dado** un usuario con `canAddOrUpdateWorkItems === false` en un proyecto `Active`
- **Entonces** no ve compositor ni menú `⋯`.

**AC-21 — Work item cancelado**
- **Dado** un work item en una columna de categoría `Cancelled`, en un proyecto `Active`, con usuario
  con permiso
- **Entonces** el compositor y el menú `⋯` de sus comentarios propios **sí** están disponibles.

### Regresión

**AC-22 — Lectura sin cambios**
- **Dado** el tab Comments sin escrituras
- **Entonces** la carga lazy, el skeleton, el empty state, el pager y `(edited)` se comportan igual que
  antes de este cambio.

---

## 10. Integration Points

| RF | Archivo | Cambio |
|---|---|---|
| RF-1 | `src/features/work-items/types/work-item.types.ts` | `AddWorkItemCommentRequest`, `UpdateWorkItemCommentRequest` |
| RF-2 | `src/features/work-items/services/work-item.service.ts` | `addWorkItemComment`, `updateWorkItemComment`, `deleteWorkItemComment` |
| RF-3 | `src/features/work-items/schemas/work-item-comment.schema.ts` (nuevo) | Schema zod + constantes de longitud |
| RF-4 | `src/features/work-items/hooks/useAddWorkItemComment.ts` (nuevo) | Mutación no optimista |
| RF-5 | `src/features/work-items/hooks/useUpdateWorkItemComment.ts`, `useDeleteWorkItemComment.ts` (nuevos) | Mutaciones optimistas con rollback |
| RF-6 | `src/features/work-items/components/WorkItemCommentComposer.tsx` (nuevo) | Compositor |
| RF-7/8/9 | `src/features/work-items/components/WorkItemCommentCard.tsx` (nuevo) | Tarjeta con menú, edición inline y diálogo de borrado; reemplaza el markup inline de `WorkItemActivitySections.tsx:259-267` |
| RF-6/10 | `src/features/work-items/components/WorkItemActivitySections.tsx` | Prop `canComment`; monta compositor; estado "comentario en edición"; `setPage('comments')(1)` tras agregar |
| RF-10 | `src/features/work-items/components/WorkItemDetailModal.tsx` | Recibe y propaga `canComment` |
| RF-10 | `src/features/projects/components/ProjectBoardPage.tsx` | Calcula `canComment` a partir de `canAddWorkItems` y `project.status` |
| — | `CLAUDE.md` | Documentar los tres endpoints de escritura y que sus hooks invalidan `['work-item-activity', workItemId]` (+ board en add/delete) |

Query keys afectadas:

| Key | Add | Update | Delete |
|---|---|---|---|
| `['work-item-activity', workItemId]` (prefijo: comments + change-logs) | invalida | optimista + invalida | optimista + invalida |
| `['project-board', projectId]` | invalida | — | invalida |
| `['work-item', code]` | — | — | — |
| `MY_SUMMARY_QUERY_KEY` | — | — | — |

---

## 11. Permissions & Roles

| Acción | Requisito |
|---|---|
| Ver comentarios | Ser miembro del proyecto (sin cambios; el backend responde 404 si no). |
| Agregar | `project.canAddOrUpdateWorkItems` **y** `project.status ∈ { Active, Maintenance }`. |
| Editar / Eliminar | Lo anterior **y** `comment.authorId === user.id`. Sin límite de tiempo. |

El backend es la autoridad: el gating de UI evita requests que fallarían, pero los errores 400/403/404
siguen manejándose (AC-5, AC-12, AC-13, AC-18).

---

## 12. Out of Scope

- Menciones (`@usuario`), markdown o texto enriquecido.
- Adjuntos, reacciones, hilos/respuestas.
- Notificaciones por comentario.
- Restaurar comentarios eliminados o ver comentarios eliminados.
- Badge con el número de comentarios en el tab (ver `CLAUDE.md`: rompería la carga lazy).
- Auto-guardado o persistencia de borradores.
- Moderación: que un admin del proyecto edite/elimine comentarios ajenos.
- Mostrar `commentCount` en las tarjetas del board (si aún no se muestra).

---

## 13. Dependencies

- Backend `aurora-flowboard-api` con los endpoints `POST`/`PUT`/`DELETE` de comentarios desplegado en el
  entorno de prueba.
- Componentes existentes: `textarea.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, `button.tsx`. No se agregan
  componentes shadcn nuevos.
- `react-hook-form` + `zod` + `@hookform/resolvers/zod` (ya instalados).

---

## 14. Open Questions

- ~~**OQ-1 — Consistencia tras `202 Accepted`.**~~ **Cerrada (2026-09-24, confirmado por el backend).**
  Las escrituras son síncronas: el handler hace `SaveChangesAsync` y responde `202` solo tras el commit,
  en la misma transacción que el comentario y su entrada de change-log. El outbox (`ProcessOutboxJob`)
  solo difiere domain events, y no hay handlers para los de comentario. El `202` es una convención de
  todos los comandos del API, no indica procesamiento diferido. Un `GET` inmediato ya refleja el cambio,
  así que el refetch de `onSettled` (RF-4/RF-5) es suficiente. Devolver el `commentId` en el `POST` es
  viable (cambio chico), pero implica cambiar el contrato y **no está aprobado**. Se mantiene RF-4 (agregar
  no optimista + refetch de la página 1). Si el contrato cambia, revisar RF-4.
- **OQ-2 — `canAddOrUpdateWorkItems` ya considera el estado del proyecto?** Si el backend ya lo pone en
  `false` para `Completed`/`Archived`, la condición de `project.status` en RF-10 es redundante pero
  inofensiva. Confirmar para simplificar.
- **OQ-3 — Usuario inactivo (`400 User.Inactive`).** El front no conoce este estado de antemano; se
  maneja solo como toast de error. Confirmar que es aceptable.

---

## 15. Final Assumptions (locked)

1. El compositor va **encima** de la lista (orden más-reciente-primero).
2. Agregar **no** es optimista (espera el `202` y refetchea); editar y eliminar **sí** son optimistas con
   rollback.
3. Tras agregar, la lista vuelve automáticamente a la página 1.
4. Edit/Delete viven en un menú `⋯` por comentario, visible solo para el autor.
5. La edición es inline dentro de la tarjeta, no en un modal.
6. Eliminar pide confirmación con un diálogo.
7. `Ctrl/⌘+Enter` envía/guarda; `Esc` cancela la edición.
8. El contador de caracteres aparece solo desde 3600/4000.
9. Escribir requiere `canAddOrUpdateWorkItems` **y** proyecto `Active`/`Maintenance`.
10. En proyecto de solo lectura, el compositor y el menú se ocultan por completo, sin texto explicativo.
11. Un work item `Cancelled` **sí** acepta comentarios.
12. El autor puede editar/eliminar sin límite de tiempo.
13. Cerrar el modal con un borrador lo descarta sin aviso.
14. Solo un comentario en edición a la vez.
15. Errores como toast con el `detail` del ProblemDetails, igual que las demás mutaciones del work item.
16. Textos de UI en inglés, consistentes con el modal actual.
17. Contenido en texto plano con saltos de línea preservados.
18. Add y delete invalidan el board (`commentCount`); edit no.
19. Esta especificación vive en `docs/specs/work-item-comments.spec.md`, en español, con ACs
    Given/When/Then.
