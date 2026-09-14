# Especificación de Funcionalidad: Editar proyecto (name / description / color)

- **Versión:** 1.1
- **Fecha:** 2026-09-11
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Implemented — assumptions locked, implementado y verificado contra backend real
  (proyectos `Verify Project` / `Task7 E2E Verification`, 2026-09-11)
- **Cambio 1.0 → 1.1:** la edición dejó de ser un "modo edición in-place" con botón lápiz y pasó a un
  **tab `General`** dentro de `ProjectDetailsModal`, junto a `Members` y `Change Log`. Afecta
  RF-5 a RF-8, §7, AC-1/AC-6/AC-12 y las assumptions 1, 2, 5, 7 y 15.
- **Área afectada:** `src/features/projects/` (`components/`, `hooks/`, `services/`, `types/`, `schemas/`)
- **Contrato backend:** provisto por la sesión `fb-api-main` (`PUT /api/v1/flowboard/projects/{id:guid}`)

---

## 1. Overview

Los campos "de cabecera" de un proyecto — `name`, `description` y `color` — hoy solo se definen en el
asistente de creación (`CreateProjectModal`) y son **inmutables desde el frontend**: `project.service.ts`
no tiene ninguna operación de update sobre el recurso `project` (solo status y members).

El backend ya expone `PUT /api/v1/flowboard/projects/{id}`, que reemplaza esos tres campos. Esta
especificación reorganiza `ProjectDetailsModal` — la modal que ya abre el botón engranaje ("Configure
project") del `PageHeader` de `ProjectBoardPage`, hoy un scroll de tres secciones apiladas de solo
lectura — en **tres tabs independientes**: `General` (editable, esta feature), `Members` (la gestión de
miembros que ya existe) y `Change Log` (solo lectura, como hoy).

El formulario de edición vive en el tab `General`, siempre presente para un Admin — no hay toggle de
"modo edición". Separar las secciones en tabs evita que dos caminos de commit distintos (un formulario
con `Save` explícito y una lista que muta al instante) convivan en la misma pantalla.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "Ya existe un endpoint de update de proyecto en el front" | **Falso.** `project.service.ts` solo tiene `getProjects`, `getProjectById`, `getProjectBoard`, `createProject`, `updateProjectStatus`, `addProjectMember`, `removeProjectMember`. |
| "Ya existe una modal de configuración de proyecto" | **Cierto.** `ProjectDetailsModal.tsx`, abierta desde `ProjectBoardPage.tsx:281` (`titleAdornment`, icono `Settings`), **ya gateada a `isProjectAdmin`**. Muestra name/prefix/kind/color/description + Members + Change Log, todo read-only. |
| "El front ya sabe si el usuario es Admin del proyecto" | **Cierto.** `ProjectBoardPage.tsx:225` y `ProjectDetailsModal.tsx` (`canManageMembers`) lo derivan de `members.find(m => m.userId === currentUser.id)?.role === 'Admin'`. **No** existe un flag `canUpdateProject` en `ProjectDetailResponse`. |
| "El color es un string libre" | **Parcialmente.** El backend acepta cualquier string ≤20 chars; el front usa **claves** de `SWATCH_COLORS` (`cyan`, `emerald`, …) y `resolveSwatchColor()` cae a `#94A3B8` si no la reconoce. |
| "La respuesta del PUT trae el proyecto actualizado" | **Falso.** 202 Accepted con cuerpo vacío. `apiFetch` ya lo tolera (`text ? JSON.parse(text) : undefined`). |
| "El board expone el nombre/color del proyecto" | **Falso.** `ProjectBoardColumn` / `ProjectBoardWorkItem` no incluyen datos de cabecera del proyecto. |

No hay causa raíz que corregir: es funcionalidad nueva sobre un endpoint recién disponible.

---

## 3. Goal y criterios de éxito

**Goal:** permitir que un miembro con rol `Admin` del proyecto edite `name`, `description` y `color`
desde la UI, sin intervención de backend.

**Criterios de éxito:**
- Un Admin puede corregir un typo del nombre, ampliar la descripción o cambiar el color en menos de tres
  clics desde el board del proyecto.
- El cambio se refleja de inmediato en las tres superficies que muestran esos datos: **Sidebar**,
  tarjetas de **`ProjectsPage`** y header de **`ProjectBoardPage`**.
- Los errores de dominio del backend (403 no-admin, 400 status no editable) se muestran con su mensaje
  real (`ProblemDetails.detail`), no con un genérico.

---

## 4. User Stories

- **US-1** — Como Admin de un proyecto, quiero editar su nombre y descripción para corregir errores o
  reflejar un cambio de alcance.
- **US-2** — Como Admin, quiero cambiar el color del proyecto para reorganizar visualmente mi Sidebar.
- **US-3** — Como miembro no-Admin, no quiero ver affordances de edición que el backend va a rechazar.
- **US-4** — Como Admin de un proyecto `Completed`/`Archived`, quiero entender por qué no puedo editarlo,
  en lugar de descubrirlo con un error al guardar.

---

## 5. Contrato del backend

```
PUT /api/v1/flowboard/projects/{id:guid}
Authorization: Bearer <jwt>   (requerido)

{
  "name": string,          // requerido, máx 100
  "description": string?,  // opcional/nullable, máx 500
  "color": string          // requerido, máx 20 (string libre, sin formato hex forzado)
}
```

El `id` viaja **solo en la ruta**, no en el body.

| Código | Significado |
|---|---|
| **202 Accepted** | Éxito. Cuerpo vacío — no devuelve el proyecto actualizado. |
| **400 Bad Request** | ProblemDetails. Validación FluentValidation (name vacío o >100, description >500, color vacío o >20, id vacío) y errores de dominio de categoría `Validation`: `Project.OperationNotAllowedInCurrentStatus` (solo se puede actualizar con status `Active` o `Maintenance`), `Project.NameRequired`, `Project.NameTooLong`, `Project.DescriptionTooLong`, `Color.ColorRequired`, `Color.ColorTooLong`. |
| **403 Forbidden** | `Project.OnlyAdminCanUpdateProject` — "Only admin members can update the project". El endpoint **no declara `.Produces` para 403**, pero el handler sí lo devuelve: el front debe contemplarlo igual. |
| **404 Not Found** | `Project.NotFound` o `User.NotFound`. |
| **500** | ProblemDetails. |

**Semántica:** es un reemplazo del "header" del proyecto. No permite cambiar `status`, `kind`,
`prefix`/code, miembros ni flow states. `name` y `description` se guardan trimmeados. Cada update escribe
un `ProjectChangeLog` (`ChangeType: Updated`) y emite `ProjectUpdatedDomainEvent`.

---

## 6. Requisitos Funcionales

### RF-1 — Tipo de request

En `types/project.types.ts` (mismo archivo: es el mismo recurso REST `project`, no una entidad nueva):

```ts
export interface UpdateProjectRequest {
  name: string
  description: string | null
  color: string
}
```

### RF-2 — Servicio

En `services/project.service.ts`:

```ts
export async function updateProject(projectId: string, payload: UpdateProjectRequest): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
```

`apiFetch` ya maneja el 202 con cuerpo vacío, y ya extrae `body.detail` del ProblemDetails hacia
`ApiError.message` para todos los códigos de error.

### RF-3 — Schema zod

Nuevo `schemas/project.schema.ts`, mismo patrón que `schemas/milestone.schema.ts`:

```ts
export const PROJECT_NAME_MAX_LENGTH = 100
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(PROJECT_NAME_MAX_LENGTH, …),
  description: z.string().max(PROJECT_DESCRIPTION_MAX_LENGTH, …),
  color: z.string().min(1, 'Color is required'),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
```

La cota de 20 chars del `color` la garantiza el picker (todas las claves de `SWATCH_COLORS` son ≤8
chars), no una regla de zod.

### RF-4 — Hook de mutación

Nuevo `hooks/useUpdateProject.ts`, **optimista con rollback**, mismo esqueleto que `useUpdateMilestone`:

```ts
interface UpdateProjectVars { projectId: string; payload: UpdateProjectRequest }
```

- `onMutate`: cancela y parchea **dos** caches:
  - `['project', projectId]` (`ProjectDetailResponse`) con `{ name, description, color }`.
  - `['projects']` (`Project[]`) mapeando el proyecto por `projectId`.
- `onError`: rollback de ambas + `toast.error('{reason} — changes reverted')`, con
  `reason = err instanceof ApiError ? err.message : 'Failed to update project'`.
- `onSettled`: invalida `['project', projectId]`, `['projects']` y `MY_SUMMARY_QUERY_KEY`.
  La invalidación de `MY_SUMMARY_QUERY_KEY` **no es opcional**: el Sidebar se alimenta de
  `useMySummary`, no de `useProjects`, y muestra tanto el nombre como el color de cada proyecto
  (regla ya documentada en `CLAUDE.md` para `useCreateProject` / `useUpdateProjectStatus`).
- **No** invalida `['project-board', projectId]`: el board no expone nombre, descripción ni color del
  proyecto (verificado en la sección 2).

### RF-5 — `ProjectDetailsModal` se reorganiza en tabs

**No se crea una modal nueva ni se apila un segundo `Dialog`.** `ProjectDetailsModal.tsx` pasa de tres
secciones apiladas a tres tabs, con la estructura header → tabs → panel → footer:

```
┌ DialogHeader (p-6 pb-4, border-b) ──────────────┐
│ ● Payments Platform                        [X]  │  constante en los 3 tabs
│ TST · ⬡ Product · ● violet                      │
├─ tablist (px-6, border-b) ──────────────────────┤
│  General    Members · 4    Change Log · 12      │
├─ panel (flex-1 overflow-y-auto p-6) ────────────┤
│  …contenido del tab activo…                     │
├─ footer (border-t bg-muted/30 px-6 py-3) ───────┤
│ Created by Ana · Sep 5, 2026     Updated Sep 9  │  constante en los 3 tabs
└──────────────────────────────────────────────────┘
```

- **Tab bar:** mismo markup que `WorkItemActivitySections.tsx:227` — `role="tablist"`,
  `flex items-center gap-5 border-b border-border`, cada tab un `<button role="tab">` con
  `text-sm pb-2.5 border-b-2 -mb-px transition-colors`, activo `border-primary text-foreground
  font-medium`, inactivo `border-transparent text-muted-foreground hover:text-foreground`.
- **Header y footer son constantes en los tres tabs** — misma regla que `PageHeader` sobre `RouteTabs`
  en `ProjectBoardPage`: la identidad del proyecto no desaparece al cambiar de tab.
- **Los contadores se mudan al tab bar** (`Members · 4`, `Change Log · 12`, en `<span>` atenuado). Los
  headings internos `h3` de cada sección y el helper local `Section` se eliminan: mostrarían el mismo
  número dos veces.
- **Los tres paneles se mantienen montados**, alternando con el atributo `hidden`, en lugar de
  desmontarse con `{activeTab === … && …}`. Esto **diverge a propósito** de `WorkItemActivitySections`,
  donde el desmontaje es deliberado porque cada tab dispara su propio fetch paginado. Acá los tres
  paneles se alimentan del mismo `ProjectDetailResponse` ya cacheado, así que mantenerlos montados no
  cuesta ninguna request extra y preserva el borrador del formulario si el usuario salta a `Members` y
  vuelve.
- **Tab inicial:** `General`. El estado del tab es local (`useState`), no va a la URL: la modal ya se
  abre desde un botón, no es una ruta.
- **Alto fijo del contenedor de paneles (`min-h-104`, 416px):** `General` mide 367px de contenido más el
  `p-6` del contenedor; `Members` solo 109px. Sin ese `min-h` la modal se encogía y se re-centraba al
  cambiar de tab, corriendo la barra de tabs hacia abajo y haciendo que el siguiente click cayera fuera
  de ella (detectado en la verificación en vivo). Con el `min-h`, el alto del diálogo es idéntico en los
  tres tabs (585px medidos). `Change Log` crece por encima de eso y scrollea, que es lo esperado.

### RF-6 — Panel `General`

Es la superficie de edición. **No hay botón lápiz ni toggle de modo:** para un Admin el formulario está
siempre presente, como en cualquier pestaña "General" de settings.

Vive como sección local de `ProjectDetailsModal.tsx` (`GeneralPanel`) — se usa en un solo lugar, que es
el criterio que ya sigue el repo para no crear archivo propio (cf. `AddMemberForm`, `MemberRow`).

**Variante editable** — react-hook-form + `zodResolver(projectSchema)`, `mode: 'onChange'`, con
`defaultValues` tomados del `ProjectDetailResponse` ya cacheado:

| Campo | Control | Notas |
|---|---|---|
| `Name` | `Input` | Label con asterisco `*`. `maxLength={100}`. |
| `Description` | `Textarea`, `rows={3}` | Label con sufijo atenuado `(optional)`. `maxLength={500}`. |
| `Color` | Grilla inline de swatches | Misma grilla que `Step1Form` de `CreateProjectModal` (`Object.keys(SWATCH_COLORS)`, `w-6 h-6 rounded-full`, anillo `ring-2 ring-primary/30` en el seleccionado). Se registra vía `setValue(…, { shouldDirty: true, shouldValidate: true })`, no es un input nativo. |
| `Prefix` / `Kind` | Filas de solo lectura | Separadas del bloque editable por un `border-t`. Sin nota disculpándose: en un tab General es natural que convivan propiedades editables y fijas. |

`mode: 'onChange'` es deliberado y **diverge de la regla de `system.md`** ("Create Modal — Submit
Gating", que prescribe gating por `useWatch` + `safeParse` sin `onChange`). Esa regla está escrita para
modales de **creación**, donde el form arranca vacío y un error temprano sería un reproche prematuro.
Acá el form arranca precargado y válido: la única forma de romperlo es que el usuario borre activamente
el nombre, y ahí el error inline es justamente lo que explica por qué `Save changes` se apagó. El gating
del submit sí usa `useWatch` + `safeParse`, igual que `MilestoneFormModal`.

**Barra de acciones** al pie del panel, alineada a la derecha: `Discard` (`variant="outline"`) +
`Save changes` (primario). Ambos **deshabilitados salvo que el formulario esté `dirty`** — con el
formulario siempre presente, permitir un PUT no-op sería ruido. `Discard` hace `reset()` a los valores
del servidor.

**Variante de solo lectura** (ver RF-7) — mismos campos como texto: nombre, descripción (o
`No description provided.` atenuado), color (punto + nombre), prefix y kind. Sin barra de acciones.

### RF-7 — Gating de permiso y estado

`canEditProject = isProjectAdmin && (status === 'Active' || status === 'Maintenance')`.

Se calcula **una sola vez en `ModalBody`** y gobierna los dos tabs editables — `General` y `Members` —
porque la restricción del backend es la misma para ambos: `PUT /projects/:id`, `POST /projects/:id/members`
y `DELETE /projects/:id/members/:userId` devuelven las tres el mismo **400
`Project.OperationNotAllowedInCurrentStatus`** una vez que el proyecto sale de `Active`/`Maintenance`
(verificado contra backend real, ver OQ-5). Dejar los controles de miembros vivos en un proyecto
`Archived` sería ofrecer una acción que el servidor garantiza rechazar.

- `isProjectAdmin` es `currentMembership?.role === 'Admin'` — la misma constante `canManageMembers` que
  ya calcula `ModalBody`. El rol **global** `Administrator` (`auth.store`) **no** habilita la edición por
  sí solo, a diferencia del "+ New project" de `ProjectsPage`.
- Si el usuario es Admin pero el status es `Completed` o `Archived`, el panel `General` se renderiza en
  su variante de solo lectura, precedido por una línea `text-xs text-muted-foreground`:
  `{Status} projects can't be edited.` — la razón queda visible sin necesidad de hover.
- Si el usuario no es Admin, el panel se renderiza en solo lectura **sin** esa línea (la restricción no
  es del proyecto, es del rol) y el tab `Members` pierde sus controles de alta/baja, como ya ocurre hoy.
- Todo esto es affordance. El backend sigue siendo la autoridad y su mensaje se muestra tal cual (RF-9).

### RF-8 — Panel `Members`

Mismas mutaciones que hoy (`AddMemberForm`, `MemberRow`, `useAddProjectMember`,
`useRemoveProjectMember`) — esta feature no cambia cómo funcionan. Cambia el envoltorio y el gating:

- El heading `h3 Members · N` desaparece (el contador vive en el tab).
- En su lugar, una fila de encabezado de panel: a la izquierda una línea de orientación
  `text-sm text-muted-foreground` (`People who can access this project, and what they can do in it.`),
  a la derecha el botón `Plus` de alta — mismo patrón "section intro line" que ya usa
  `ProjectComponentsSection`. Evita que el botón de alta quede suelto sin contexto tras perder el
  heading que lo contenía.
- **El alta y la baja se gatean con `canEditProject`, no solo con `isProjectAdmin`** (RF-7): en un
  proyecto `Completed`/`Archived` desaparecen el botón `Plus` y las `X` de cada fila, igual que el
  panel `General` pierde su formulario. La lista de miembros y sus roles siguen visibles.
- Cuando el status es el que bloquea, la misma línea `{Status} projects can't be edited.` se renderiza
  bajo la línea de orientación, en `text-xs text-muted-foreground`. El texto se calcula una sola vez en
  `ModalBody` y se pasa a los dos paneles, para que no puedan divergir.

### RF-9 — Manejo de errores

El banner de error se renderiza **arriba del formulario, dentro del panel `General`**, con el mismo
bloque visual que `MilestoneFormModal`
(`rounded-md border border-destructive/20 bg-destructive/10 … text-destructive`). El mensaje es
`error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'`.

| Código | Tratamiento |
|---|---|
| **400** | Banner con el `detail`. El panel permanece en el tab `General` con los valores tipeados intactos. |
| **403** | Banner con el `detail` (`"Only admin members can update the project"`). |
| **404** | Banner con el `detail`. |
| **5xx / red** | Banner genérico `Something went wrong. Please try again.` |

En todos los casos el `onError` del hook (RF-4) ya hizo rollback del optimistic update y mostró el
`toast.error` de la convención.

**Sobre la resincronización tras un 403/404:** no hace falta lógica extra. El `onSettled` del hook
(RF-4) corre siempre — también después de un error — e invalida `['project', projectId]` y `['projects']`,
que es exactamente lo que haría falta para resincronizar una membresía desactualizada (403) o un
proyecto que ya no existe (404). Agregar invalidaciones condicionales por código sería código muerto.

### RF-10 — Normalización del payload

`name` y `description` se envían trimmeados desde el front (además del trim que aplica el backend). Una
`description` vacía tras el trim se envía como `null`, no como `""` — mismo criterio que `toPayload` en
`MilestoneFormModal`.

---

## 7. UI/UX Behavior

| Escenario | Comportamiento esperado |
|---|---|
| Cualquiera abre la modal | Arranca en el tab `General`. Header (nombre + color + prefix · kind) y footer (created/updated) visibles en los tres tabs. |
| Admin abre la de un proyecto `Active` / `Maintenance` | El tab `General` muestra el formulario precargado, con `Discard` / `Save changes` deshabilitados (nada cambió todavía). |
| Admin abre la de un proyecto `Completed` / `Archived` | Tab `General` en solo lectura, precedido por `Archived projects can't be edited.` |
| Miembro no-Admin abre la modal | Tab `General` en solo lectura, sin línea explicativa; tab `Members` sin controles de alta/baja. |
| Se edita cualquier campo | `Discard` y `Save changes` se habilitan en cuanto el formulario está `dirty` **y** es válido. |
| Se borra el nombre | Error inline `Name is required` bajo el Input; `Save changes` deshabilitado. |
| Se intenta exceder el largo máximo | El `maxLength` nativo corta en 100/500; el error de largo de zod no llega a verse por tecleo. |
| Se cambia de tab con cambios sin guardar | El borrador se preserva (el panel queda montado); al volver a `General` está tal cual se dejó. |
| Guardado en curso | `Save changes` muestra `Loader2` + `Saving…`; ambos botones deshabilitados. |
| Guardado OK | `toast.success('Project updated')`, el header de la modal muestra el nombre/color nuevos, y los botones vuelven a deshabilitarse (`reset()` deja el form limpio). |
| Guardado falla | Sigue en el tab `General`, banner rojo con el motivo, valores del usuario intactos, botones habilitados para reintentar. |
| `Discard` | Vuelve a los valores del servidor, sin diálogo de confirmación. |
| Cerrar la modal con cambios sin guardar | Se cierra descartando los cambios, sin confirmación; al reabrirla arranca en `General` con los valores del servidor. |

---

## 8. Data Requirements

- **Nuevo tipo:** `UpdateProjectRequest` en `types/project.types.ts` (RF-1).
- **Nuevo servicio:** `updateProject` en `services/project.service.ts` (RF-2) — se queda en el archivo
  del recurso `project`, no genera archivo nuevo: es el mismo recurso REST.
- **Nuevo schema:** `schemas/project.schema.ts` (RF-3).
- **Nuevo hook:** `hooks/useUpdateProject.ts` (RF-4).
- **Modificado:** `components/ProjectDetailsModal.tsx` (RF-5 a RF-9).
- **Sin cambios** en `Project`, `ProjectDetailResponse`, `ProjectMember` ni ningún tipo de board.
- `color` viaja como **clave** de `SWATCH_COLORS` (`"emerald"`), nunca como hex — consistente con
  `createProject`.
- Sin dependencias npm nuevas. Sin componentes shadcn nuevos. Sin variables de entorno nuevas.

---

## 9. Non-Functional Requirements

- **Rendimiento:** no se agrega ninguna query nueva. El formulario se precarga del cache
  `['project', projectId]` que la modal ya tiene resuelto.
- **Consistencia:** todas las invalidaciones viven en `useUpdateProject`, nunca en el componente.
- **Accesibilidad:** cada input con su `Label` asociado por `htmlFor`/`id`, `aria-invalid` y
  `aria-describedby` apuntando al párrafo de error — mismo patrón que `MilestoneFormModal`. El botón
  lápiz lleva `aria-label="Edit project"`.
- **Regresión:** el modo lectura de `ProjectDetailsModal`, la gestión de miembros y el Change Log no
  cambian de comportamiento.

---

## 10. Acceptance Criteria

**AC-1 — Edición de nombre**
- **Dado** un Admin en el tab `General` de la modal de detalles de un proyecto `Active`
- **Cuando** cambia el nombre y pulsa `Save changes`
- **Entonces** se dispara `PUT /v1/flowboard/projects/{id}` con `{ name, description, color }`
- **Y** el nombre nuevo aparece de inmediato (optimista) en la modal, en la tarjeta de `ProjectsPage` y
  en el Sidebar, sin esperar la respuesta.

**AC-2 — Nombre obligatorio**
- **Dado** el tab `General` en su variante editable
- **Cuando** el usuario vacía el campo `Name`
- **Entonces** aparece `Name is required` bajo el input **y** `Save changes` queda deshabilitado.

**AC-3 — Descripción vacía**
- **Dado** el tab `General` en su variante editable
- **Cuando** el usuario vacía la descripción y guarda
- **Entonces** el payload lleva `"description": null` (no `""`).

**AC-4 — Cambio de color**
- **Dado** el tab `General` en su variante editable
- **Cuando** el usuario elige otro swatch y guarda
- **Entonces** el payload lleva la **clave** del color (p.ej. `"color": "violet"`)
- **Y** el punto de color del Sidebar y la franja superior de la tarjeta de `ProjectsPage` pasan al hex
  correspondiente.

**AC-5 — 403 del backend**
- **Dado** que el PUT responde 403 con `"Only admin members can update the project"`
- **Entonces** el tab `General` muestra un banner con ese texto exacto
- **Y** se hace rollback del optimistic update
- **Y** el `onSettled` del hook invalida igualmente `['project', projectId]` y `['projects']`.

**AC-6 — Status no editable**
- **Dado** un proyecto en status `Completed`
- **Cuando** un Admin abre la modal de detalles
- **Entonces** el tab `General` se renderiza en solo lectura, precedido por
  `Completed projects can't be edited.`, y no hay ningún input ni botón de guardado en el DOM
- **Y** el tab `Members` muestra la misma línea y pierde el botón de alta y las `X` de baja, aunque la
  lista de miembros y sus roles siguen visibles.

**AC-7 — Permisos**
- **Dado** un miembro con rol `Developer` (o cualquier rol distinto de `Admin`)
- **Cuando** abre la modal de detalles
- **Entonces** el tab `General` se renderiza en solo lectura, sin línea explicativa de status
- **Y** el tab `Members` no muestra el botón de alta ni las acciones de baja.

**AC-8 — Éxito**
- **Dado** un guardado exitoso
- **Entonces** se muestra `toast.success('Project updated')`
- **Y** el formulario queda limpio (`reset()`), con `Discard` y `Save changes` deshabilitados de nuevo
- **Y** se invalidan `['project', id]`, `['projects']` y `MY_SUMMARY_QUERY_KEY`.

**AC-9 — Rollback ante error de red**
- **Dado** que el PUT falla por red o 5xx
- **Entonces** los valores previos vuelven a las tarjetas y al Sidebar (rollback)
- **Y** el formulario conserva lo que el usuario había tipeado.

**AC-10 — Change Log**
- **Dado** cualquier edición exitosa
- **Cuando** el usuario abre el tab `Change Log`
- **Entonces** tras el refetch aparece la entrada `Updated`, sin recarga manual de la página.

**AC-11 — Sin impacto en el board**
- **Dado** cualquier edición de proyecto
- **Entonces** no se dispara invalidación ni cambio visual sobre `['project-board', projectId]`.

**AC-12 — Descarte sin confirmación**
- **Dado** el tab `General` con cambios sin guardar
- **Cuando** el usuario pulsa `Discard` o cierra la modal
- **Entonces** los cambios se descartan sin diálogo de confirmación
- **Y** al reabrir la modal esta arranca en el tab `General` con los valores del servidor.

**AC-13 — Gating por `dirty`**
- **Dado** el tab `General` recién abierto por un Admin, sin ninguna modificación
- **Entonces** `Discard` y `Save changes` están deshabilitados
- **Y** se habilitan en cuanto cambia cualquiera de los tres campos.

**AC-14 — El borrador sobrevive al cambio de tab**
- **Dado** un Admin que modificó el nombre sin guardar
- **Cuando** navega al tab `Members` y vuelve a `General`
- **Entonces** el nombre modificado sigue en el input y los botones siguen habilitados.

**AC-15 — Header y footer constantes**
- **Dado** cualquier tab activo
- **Entonces** el header (punto de color, nombre, `prefix · kind · color`) y el footer
  (`Created by … / Updated …`) se renderizan igual en los tres.

---

## 11. Integration Points

| Punto | Detalle |
|---|---|
| `src/features/projects/types/project.types.ts` | RF-1 (`UpdateProjectRequest`). |
| `src/features/projects/services/project.service.ts` | RF-2 (`updateProject`). |
| `src/features/projects/schemas/project.schema.ts` (nuevo) | RF-3. |
| `src/features/projects/hooks/useUpdateProject.ts` (nuevo) | RF-4. |
| `src/features/projects/components/ProjectDetailsModal.tsx` | RF-5 a RF-9. |
| `src/features/auth/hooks/useMySummary.ts` (`MY_SUMMARY_QUERY_KEY`) | Se invalida, sin cambios en el hook. |
| `src/shared/constants/colors.ts` (`SWATCH_COLORS`) | Se reutiliza sin cambios. |
| `src/shared/lib/api-client.ts` (`ApiError`) | Se reutiliza sin cambios; ya expone `.status` y el `detail` del ProblemDetails. |
| Backend | Sin cambios — endpoint ya desplegado. |

---

## 12. Permissions & Roles

- Requiere `ProjectRole.Admin` **en ese proyecto** (`members[].role`).
- Requiere `status ∈ { Active, Maintenance }`.
- El rol global `Administrator` del `auth.store` no habilita la edición por sí solo.
- Ambas reglas se replican en el front solo para decidir la affordance; el backend las vuelve a validar y
  su error se muestra tal cual (RF-9).

---

## 13. Out of Scope

- Cambiar `status`, `kind`, `prefix`/code o miembros desde este formulario — tienen sus propios
  endpoints y su propia UI.
- Editar flow states: los cinco endpoints `projects/:id/flow/...` fueron removidos del backend el
  2026-09-05 y no hay plan de reponerlos. Un proyecto creado con el flow equivocado solo se corrige por
  SQL directo.
- Editar el proyecto desde la tarjeta de `ProjectsPage` (menú contextual, doble click).
- Abrir `ProjectDetailsModal` a miembros no-Admin: el botón engranaje de `ProjectBoardPage` sigue
  gateado a `isProjectAdmin`. Las variantes de solo lectura de RF-6/RF-7 existen como defensa y para
  cubrir el caso de un Admin sobre un proyecto `Completed`/`Archived`, no para habilitar un nuevo acceso.
- Edición inline (click-to-edit) sobre el título del header de `ProjectBoardPage`.
- Un color hex libre o un color-picker arbitrario fuera de las 20 claves de `SWATCH_COLORS`.
- Diálogo de confirmación al descartar cambios sin guardar.
- Mostrar en el Change Log **qué** campo cambió: el backend solo registra `ChangeType: Updated`, sin
  diff por campo.

---

## 14. Dependencies

- `PUT /v1/flowboard/projects/{id}` — endpoint ya disponible en el backend (contrato de la sección 5).
- `react-hook-form` + `zod` + `@hookform/resolvers/zod` — ya instalados, mismo stack que
  `MilestoneFormModal`.
- `@tanstack/react-query` — ya instalado.
- `sonner` (`toast`) — ya instalado y montado en `AppProviders`.
- Sin dependencias nuevas de npm, sin componentes shadcn nuevos, sin variables de entorno nuevas.

---

## 15. Open Questions

- ~~**OQ-1 — Validación server-side del `color`.**~~ **RESUELTO (verificado contra backend real,
  2026-09-11).** `PUT` con `"color":"violet"` responde **202** y el `GET` posterior devuelve exactamente
  `"violet"` — la clave viaja y vuelve literal, sin normalizar a hex. El front puede seguir mandando
  claves de `SWATCH_COLORS` sin conversión.
- ~~**OQ-2 — Comportamiento con status `Maintenance`.**~~ **RESUELTO (verificado contra backend real,
  2026-09-11).** Se pasó un proyecto a `Maintenance` (`PATCH .../maintenance` → 202), se hizo el `PUT`
  → **202**, y se restauró a `Active`. `Maintenance` acepta el update, así que RF-7 hace bien en
  incluirlo en `isEditableStatus`. Como control, el `PUT` sobre un proyecto `Archived` devuelve **400
  `Project.OperationNotAllowedInCurrentStatus`** con `detail` = "This operation is not allowed in the
  project's current status".
- ~~**OQ-3 — Latencia del Change Log.**~~ **RESUELTO (verificado contra backend real, 2026-09-11).** El
  `GET` inmediatamente posterior al 202 ya trae la entrada `Updated` y el `updatedOnUtc` nuevo — la
  escritura del `ProjectChangeLog` es síncrona respecto de la respuesta. AC-10 se cumple sin delay ni
  reintento.
- ~~**OQ-5 — ¿El status bloquea también la gestión de miembros?**~~ **RESUELTO (verificado contra
  backend real, 2026-09-13).** Sobre un proyecto `Archived`, tanto `POST /projects/:id/members` como
  `DELETE /projects/:id/members/:userId` devuelven **400 `Project.OperationNotAllowedInCurrentStatus`**,
  el mismo error que el `PUT`. En el `DELETE` el guard de status corre **antes** que la búsqueda de
  membresía (se probó con un `userId` que no era miembro y aun así respondió 400, no 404), así que la
  regla vive a nivel del agregado, no de la operación. Por eso RF-7 gatea los dos tabs con un solo
  `canEditProject`.
- ~~**OQ-4 — Forma de `description` vacía en el read-back.**~~ **RESUELTO (verificado contra backend
  real, 2026-09-11).** Un `PUT` con `"description": null` se lee de vuelta como `null` (no `""`). El
  backend no normaliza entre ambos: devuelve lo que se mandó. `GeneralForm` usa `data.description ?? ''`
  para el `defaultValue`, así que tolera las dos formas — relevante porque hay proyectos viejos guardados
  con `""`.

---

## 16. Final Assumptions (locked)

1. El punto de entrada es el tab **`General`** de `ProjectDetailsModal` (la modal del engranaje
   "Configure project"), no un menú en la tarjeta de `ProjectsPage` ni edición inline en el header del
   board.
2. `ProjectDetailsModal` se reorganiza en **tres tabs independientes** (`General` / `Members` /
   `Change Log`), con header y footer constantes. No hay toggle de modo edición ni botón lápiz: para un
   Admin el formulario de `General` está siempre presente. No se apila ninguna modal nueva ni se crea un
   archivo `EditProjectModal.tsx`.
3. Los tres campos se editan juntos en un solo formulario con un solo PUT, no campo por campo con
   guardado individual.
4. El permiso se deriva de `ProjectRole.Admin` en ese proyecto; el rol global `Administrator` no habilita
   la edición.
5. Con status `Completed`/`Archived` **los dos tabs editables** quedan en solo lectura con una línea
   explicativa visible (`{Status} projects can't be edited.`), en vez de un control deshabilitado con
   tooltip o de dejar que el usuario descubra el error al guardar: `General` pierde el formulario y
   `Members` pierde el alta y la baja. Es una sola condición (`canEditProject`) calculada en
   `ModalBody`, porque el backend aplica la misma regla a las tres operaciones (OQ-5).
6. La mutación es **optimista con rollback** (como `useUpdateMilestone` / `useUpdateProjectStatus`), en
   lugar de esperar al 202 y refetchear.
7. `Discard` y `Save changes` se habilitan solo cuando el formulario está **`dirty` y es válido** — con
   el formulario siempre presente, permitir un PUT no-op sería ruido. Tras un guardado exitoso se hace
   `reset()` con los valores nuevos para que ambos vuelvan a apagarse.
8. Se muestra `toast.success('Project updated')` al guardar — igual que `MilestoneFormModal`, a
   diferencia de las ediciones de campo del sidebar de work items.
9. El color se restringe a las 20 claves de `SWATCH_COLORS`, aunque el backend acepte cualquier string
   ≤20 chars.
10. El color es **obligatorio** en el formulario, aunque en la creación sea opcional.
11. El picker de color es la **grilla inline de swatches** (como el paso 1 de `CreateProjectModal`), no
    el popover compacto del `ColorPicker` de flow states.
12. `description` vacía se envía como `null`, no como `""`.
13. Los errores del backend se muestran como **banner dentro del panel `General`**, encima del formulario
    (además del `toast.error` con rollback que ya emite el hook).
14. Descartar cambios sin guardar (`Discard` o cerrar la modal) no pide confirmación. Cambiar de tab
    **no** descarta: los tres paneles se mantienen montados vía `hidden`, así que el borrador sobrevive.
15. `prefix` y `kind` se muestran como filas de solo lectura dentro del panel `General`, separadas del
    bloque editable por un `border-t`, **sin** nota explicativa: en un tab General es natural que
    convivan propiedades editables y fijas.
16. Se aplica `maxLength` nativo (100/500) a los inputs, de modo que el error de largo de zod es una red
    de seguridad que en la práctica no se ve.
17. No se invalida `['project-board', id]` porque el board no expone nombre, descripción ni color del
    proyecto.
18. El servicio y el tipo se quedan en `project.service.ts` / `project.types.ts` — es el mismo recurso
    REST, no un recurso nuevo con su propio archivo.
19. El tab activo es estado local (`useState`), no va a la URL: la modal se abre desde un botón, no es
    una ruta — a diferencia de `RouteTabs` en `ProjectBoardPage`.
20. Los tres paneles se mantienen montados alternando con `hidden`, divergiendo a propósito de
    `WorkItemActivitySections` (que desmonta para no disparar fetches de tabs inactivos): acá los tres
    salen del mismo `ProjectDetailResponse` ya cacheado, así que no hay request que ahorrar y sí un
    borrador que preservar.
