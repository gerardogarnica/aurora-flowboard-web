# Especificación de Funcionalidad: Campo Component en Work Items

- **Versión:** 1.0
- **Fecha:** 2026-08-30
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Implemented — assumptions confirmadas, implementado y verificado contra backend real (Test Manager / TST-3)
- **Área afectada:** `src/features/work-items/components/`, `src/features/work-items/hooks/`, `src/features/work-items/services/`

---

## 1. Overview

El panel de Components por proyecto (`GET /v1/flowboard/projects/{id}/components`) ya existe y permite
crear/renombrar/retirar componentes (`Active` | `Retired`). Hoy esos componentes **no se pueden asociar
a ningún work item**: el campo `componentId` viaja en `CreateWorkItemRequest` pero se envía hardcodeado
en `null`, y `WorkItemDetailResponse.componentId`/`componentName` no se muestran en ningún lado.

Esta especificación agrega el campo Component en dos puntos: (1) el modal "Create Work Item", con
prioridad de layout por encima de Estimated Points/Estimated Completion Date, y (2) el sidebar del
detalle de work item, editable inline con persistencia vía `PATCH /v1/flowboard/work-items/{id}/component`.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El backend ya soporta Component en work items" | **Cierto.** `CreateWorkItemRequest.componentId` y `WorkItemDetailResponse.componentId`/`componentName` ya existen en `src/features/work-items/types/work-item.types.ts:69-70,88-89`. |
| "El modal de creación ya envía el componentId elegido" | **Falso.** `CreateWorkItemModal.tsx:82` hardcodea `componentId: null` en el `mutate()`. No hay ningún campo de UI para elegirlo. |
| "El sidebar del detalle ya muestra el componente" | **Falso.** `WorkItemSidebar.tsx` no referencia `componentId`/`componentName` en ningún punto. |
| "Existe un hook para listar los componentes de un proyecto" | **Cierto.** `useProjectComponents(projectId)` (`src/features/projects/hooks/useProjectComponents.ts`) ya existe y se usa en `ProjectComponentsSection.tsx`. |
| "El board (`ProjectBoardWorkItem`) incluye el componente" | **Falso.** `ProjectBoardWorkItem` (`src/features/projects/types/project.types.ts`) no tiene `componentId`/`componentName` — el componente no se refleja en las tarjetas del board. |

No hay causa raíz que corregir: es una funcionalidad nueva sobre una base de datos/tipos ya preparada.

---

## 3. Goal y criterios de éxito

**Goal:** permitir asociar (y reasignar/quitar) un Component a un work item, tanto al crearlo como desde
su detalle, con la misma calidad de interacción (click-to-edit, optimistic update, rollback) que el
resto de campos editables del sidebar.

**Criterios de éxito:**
- Un work item puede crearse con o sin Component, sin fricción adicional para el caso sin componente.
- Cambiar el Component desde el sidebar persiste en el backend y sobrevive a un refresh.
- Un componente `Retired` nunca aparece como opción nueva seleccionable, pero si ya está asignado a un
  work item su nombre sigue siendo visible (no se pierde información histórica).

---

## 4. User Stories

- **US-1** — Como usuario creando un work item, quiero elegir opcionalmente el Component al que
  pertenece, para clasificarlo desde el momento de creación sin un paso adicional después.
- **US-2** — Como usuario viendo el detalle de un work item, quiero ver a qué Component pertenece (o que
  no tiene ninguno), para entender su ubicación dentro del desglose del proyecto.
- **US-3** — Como usuario con permisos de edición, quiero poder cambiar o quitar el Component asignado
  desde el sidebar, de la misma forma en que ya cambio Assignee/Type/Priority.
- **US-4** — Como usuario, quiero que un Component retirado siga siendo visible en los work items que ya
  lo tenían asignado, aunque ya no pueda elegirlo para otros work items.

---

## 5. Requisitos Funcionales

### RF-1 — `ComponentSelect` reutilizable

Nuevo componente `src/features/work-items/components/ComponentSelect.tsx`, mismo patrón que
`AssigneeSelect.tsx` (`Select` + `SelectItem value=""` para "No component" + lista de opciones), usado
por `CreateWorkItemModal.tsx` y `WorkItemSidebar.tsx`. Recibe la lista de `ProjectComponent[]` ya
resuelta (no hace su propio fetch), para no duplicar la llamada a `useProjectComponents` entre ambos
consumidores en el sidebar (que ya usa `useProjectDetail` de forma similar).

### RF-2 — Campo Component en `CreateWorkItemModal`

Se agrega un campo "Component" (`Label` sin asterisco, opcional) que usa `ComponentSelect` filtrado a
`status === 'Active'`, alimentado por `useProjectComponents(project.projectId)`. El `FormData` interno
gana `componentId: string` (vacío = sin componente). El `mutate()` deja de hardcodear `componentId:
null` y pasa `data.componentId || null`.

### RF-3 — Orden de campos en `CreateWorkItemModal`

El nuevo orden del formulario es:

```
Title → Description → [Type, Priority] → Component → [Estimated Points, Estimated Completion Date] → Assignee
```

`Component` es una fila de ancho completo (mismo tratamiento visual que `Assignee`), ubicada entre el
grupo `[Type, Priority]` y el grupo `[Estimated Points, Estimated Completion Date]`.

### RF-4 — Endpoint de actualización

Nuevo `updateWorkItemComponent(workItemId: string, componentId: string | null): Promise<void>` en
`work-item.service.ts`:

```ts
export async function updateWorkItemComponent(workItemId: string, componentId: string | null): Promise<void> {
  return apiFetch<void>(`/v1/flowboard/work-items/${workItemId}/component`, {
    method: 'PATCH',
    body: JSON.stringify({ componentId }),
  })
}
```

Un solo endpoint que acepta `null` en el body (mismo patrón que `updateWorkItemType`/
`updateWorkItemPriority`), no el patrón de dos endpoints `assign`/`unassign` que usa Assignee.

### RF-5 — Hook de mutación con optimistic update

Nuevo `useUpdateWorkItemComponent(workItemId, code, projectId)` en
`src/features/work-items/hooks/useUpdateWorkItemComponent.ts`, mismo esqueleto que
`useUpdateWorkItemType`/`useUpdateWorkItemPriority`:
- `onMutate`: cancela y parchea **solo** `['work-item', code]` con `{ componentId, componentName }` (el
  `componentName` se resuelve buscando en la lista de componentes ya cargada por el llamador).
- **No** toca `['project-board', projectId]` — `ProjectBoardWorkItem` no incluye estos campos (RF
  confirmado por Finding en la sección 2).
- `onError`: rollback vía `previousItem` + `toast.error('... — changes reverted')`, mismo mensaje que
  el resto de mutaciones de campo.
- `onSettled`: invalida `['work-item', code]`.
- Sin `toast.success` — igual convención que Type/Priority/Assignee/Estimated Points.

### RF-6 — Campo Component en el sidebar del detalle

En `WorkItemSidebar.tsx`:
- `EditingField` gana el valor `'component'`.
- Nueva `SidebarRow label="Component"`, ubicada inmediatamente después de "Type" y antes de "Estimate
  points".
- Modo lectura: `item.componentName ?? 'No component'` (texto `text-muted-foreground` cuando es
  `null`, igual tratamiento que "Unassigned"). Si el componente asignado está `Retired` (ver RF-7), se
  agrega el sufijo ` (Retired)`.
- Modo edición (click, gateado por `canEditField`): `ComponentSelect` con `defaultOpen`, mismo patrón
  de apertura/cierre que Type/Priority/Assignee (`onValueChange` dispara la mutación y cierra;
  `onOpenChange(false)` sin selección también cierra sin mutar).
- Estado pendiente: `Loader2` + valor anterior, igual que el resto de campos.

### RF-7 — Manejo de componente retirado

`ComponentSelect`, cuando se usa en modo edición (sidebar), debe:
1. Listar como opciones seleccionables solo los componentes `Active`.
2. Si el `value` actual (`item.componentId`) no está en esa lista `Active` porque su componente fue
   retirado, se agrega igualmente como una opción **extra, no seleccionable de nuevo pero visible como
   seleccionada actualmente**, con el label `"{name} (Retired)"` — para que el `Select` no quede vacío o
   muestre un valor inconsistente.

En `CreateWorkItemModal` (creación, RF-2) no aplica este caso: solo se listan componentes `Active`, sin
excepción, porque no hay ningún valor previamente asignado que preservar.

---

## 6. UI/UX Behavior

| Escenario | Comportamiento esperado |
|---|---|
| Crear work item sin elegir Component | Se envía `componentId: null`. Sin fricción, sin validación bloqueante. |
| Crear work item con Component elegido | Se envía el `componentId` seleccionado. |
| Proyecto sin componentes activos | El `Select` solo muestra la opción "No component" — sin mensaje de error ni estado vacío especial. |
| Ver detalle de work item sin componente | Sidebar muestra "No component" en `text-muted-foreground`. |
| Ver detalle de work item con componente activo | Sidebar muestra el nombre en texto normal (mismo peso que Type/Priority). |
| Ver detalle de work item con componente retirado | Sidebar muestra `"{name} (Retired)"`. |
| Cambiar Component (usuario con permiso) | Click → `Select` abierto → elegir → cierre inmediato, valor actualizado de forma optimista. |
| Cambiar Component falla (error de red/servidor) | Rollback al valor anterior + `toast.error`. |
| Usuario sin permiso de edición | Texto plano, sin affordance de hover/click (igual que el resto de campos read-only del sidebar). |
| Work item cancelado (`isCancelled`) | Campo no editable, igual que el resto de campos bajo `canEditField`. |

---

## 7. Data Requirements

- **Sin cambios de tipos** en `CreateWorkItemRequest` ni `WorkItemDetailResponse` — ambos ya tienen
  `componentId`/`componentName`.
- `ProjectComponent` (`src/features/projects/types/project.types.ts`) ya expone `id`, `name`, `status`.
- Nuevo servicio: `updateWorkItemComponent` (ver RF-4).
- Nuevo hook: `useUpdateWorkItemComponent` (ver RF-5).
- Nuevo componente: `ComponentSelect` (ver RF-1), recibe `components: ProjectComponent[]` ya filtrados/
  resueltos por el llamador (no decide internamente el filtro Active/Retired del RF-7 salvo por la regla
  de "agregar la opción retirada actual si corresponde", que si vive en el propio `ComponentSelect` para
  no duplicar esa lógica en los dos consumidores).
- Sin endpoints nuevos de lectura — se reutiliza `useProjectComponents` ya existente.
- Sin componentes shadcn nuevos (reutiliza `Select`/`SelectItem`/`SelectTrigger`/`SelectValue`).
- Sin variables de entorno nuevas.

---

## 8. Non-Functional Requirements

- **Rendimiento:** `useProjectComponents(projectId)` se apoya en el cache de React Query (`['project-components', projectId]`); si el usuario ya visitó el tab Components del proyecto, no dispara una petición nueva. No se agrega polling.
- **Consistencia:** la invalidación de `['work-item', code]` ocurre en el hook de mutación, nunca en el componente que lo llama.
- **Accesibilidad:** el `Select` de Component usa los mismos primitivos accesibles (`@/components/ui/select`) que Type/Priority/Assignee — sin necesidad de atributos ARIA adicionales.
- **Regresión:** no debe alterar el comportamiento actual de Type/Priority/Assignee/Estimated Points en el sidebar, ni el flujo de creación de work items sin Component.

---

## 9. Acceptance Criteria

### Creación

**AC-1**
- **Dado** el modal "Create Work Item" abierto para un proyecto con componentes `Active`
- **Cuando** el usuario no toca el campo Component y crea el work item
- **Entonces** la request `POST /v1/flowboard/work-items` incluye `"componentId": null`.

**AC-2**
- **Dado** el modal "Create Work Item" abierto
- **Cuando** el usuario elige un Component del `Select` y crea el work item
- **Entonces** la request incluye `"componentId": "<guid del componente elegido>"`.

**AC-3**
- **Dado** un proyecto con componentes `Active` y `Retired`
- **Cuando** se abre el `Select` de Component en el modal de creación
- **Entonces** solo aparecen los componentes `Active` en la lista de opciones.

**AC-4 — Orden del formulario**
- **Dado** el modal "Create Work Item" abierto
- **Entonces** el campo Component se renderiza después del grupo `[Type, Priority]` y antes del grupo
  `[Estimated Points, Estimated Completion Date]`.

### Detalle / Sidebar

**AC-5**
- **Dado** un work item sin componente asignado (`componentId: null`)
- **Cuando** se abre su detalle
- **Entonces** el sidebar muestra "No component" en texto atenuado.

**AC-6**
- **Dado** un work item con un componente `Active` asignado
- **Cuando** se abre su detalle
- **Entonces** el sidebar muestra el nombre del componente en texto normal.

**AC-7 — Cambiar componente**
- **Dado** un usuario con permiso de edición viendo el detalle de un work item
- **Cuando** hace click en la fila Component, elige otro componente del `Select`
- **Entonces** se dispara `PATCH /v1/flowboard/work-items/{id}/component` con
  `{ "componentId": "<guid>" }`
- **Y** el valor se actualiza de inmediato en la UI (optimistic), sin esperar la respuesta.

**AC-8 — Quitar componente**
- **Dado** un work item con un componente asignado
- **Cuando** el usuario elige "No component" en el `Select`
- **Entonces** se dispara el PATCH con `{ "componentId": null }`
- **Y** el sidebar pasa a mostrar "No component".

**AC-9 — Rollback ante error**
- **Dado** que el PATCH de componente falla (red caída o 5xx)
- **Cuando** finaliza el intento
- **Entonces** el sidebar vuelve a mostrar el valor anterior
- **Y** se muestra un `toast.error` con el mensaje de la convención existente (`"{reason} — changes
  reverted"`).

**AC-10 — Sin toast de éxito**
- **Dado** que el PATCH de componente tiene éxito
- **Entonces** no se muestra ningún toast (igual que Type/Priority/Assignee/Estimated Points).

**AC-11 — Componente retirado se preserva visualmente**
- **Dado** un work item cuyo componente asignado tiene `status: "Retired"`
- **Cuando** se abre su detalle
- **Entonces** el sidebar muestra `"{name} (Retired)"` en modo lectura
- **Y** al entrar en modo edición, esa opción aparece seleccionada en el `Select` mostrando el mismo
  label, pero el resto de opciones del `Select` solo incluye componentes `Active`.

**AC-12 — Sin impacto en el board**
- **Dado** cualquier cambio de Component (creación o edición)
- **Entonces** no se dispara ninguna invalidación ni cambio visual sobre `['project-board', projectId]`
  ni sobre las tarjetas del board.

**AC-13 — Permisos**
- **Dado** un usuario sin `canAddOrUpdateWorkItems` en el proyecto (o un work item cancelado)
- **Cuando** ve el detalle del work item
- **Entonces** el campo Component se muestra como texto plano sin affordance de click, igual que el
  resto de campos bajo `canEditField`.

---

## 10. Integration Points

| Punto | Detalle |
|---|---|
| `src/features/work-items/components/ComponentSelect.tsx` (nuevo) | Selector reutilizable, RF-1/RF-7. |
| `src/features/work-items/components/CreateWorkItemModal.tsx` | RF-2, RF-3. |
| `src/features/work-items/components/WorkItemSidebar.tsx` | RF-6, RF-7. |
| `src/features/work-items/services/work-item.service.ts` | RF-4. |
| `src/features/work-items/hooks/useUpdateWorkItemComponent.ts` (nuevo) | RF-5. |
| `src/features/projects/hooks/useProjectComponents.ts` | Ya existe, se reutiliza sin cambios. |
| `src/features/projects/types/project.types.ts` (`ProjectComponent`) | Ya existe, se reutiliza sin cambios. |
| Backend | Sin cambios — el endpoint `PATCH .../component` y los campos de request/response ya están definidos por el usuario en el enunciado de esta spec. Ver OQ-1. |

---

## 11. Permissions & Roles

- El campo Component en el sidebar se gatea con el mismo flag `canEditField` (`canEdit && !isCancelled`)
  que ya usan Type/Priority/Assignee/Estimated Points — sin rol ni permiso adicional.
- En el modal de creación, el campo está disponible siempre que el modal esté abierto (ya gateado a
  nivel de página por `canAddOrUpdateWorkItems`, sin cambios sobre esa lógica).

---

## 12. Out of Scope

- Campo Milestone — la funcionalidad de Milestones no existe todavía (tab "Coming soon" en
  `ProjectBoardPage.tsx`). Se menciona en el enunciado solo como referencia de importancia relativa entre
  campos, no se implementa aquí.
- Mostrar el Component en las tarjetas del board (`WorkItemCard`) — `ProjectBoardWorkItem` no lo trae y
  no fue solicitado.
- Reactivar un componente retirado, o cualquier cambio al panel Components (`ProjectComponentsSection`) —
  ya existe y no se toca.
- Filtrar o agrupar work items por Component en ninguna vista existente.
- Cambios en el endpoint `GET /v1/flowboard/projects/{id}/components` o en `ProjectComponent`.

---

## 13. Dependencies

- `@tanstack/react-query` (ya instalado) — mutación + cache de `['work-item', code]`.
- `PATCH /v1/flowboard/work-items/{workItemId}/component` — endpoint provisto por el usuario en el
  enunciado, no verificado en vivo contra el backend real como parte de esta spec (ver OQ-1).
- `useProjectComponents` — hook ya existente, sin cambios.
- Sin dependencias nuevas de npm. Sin componentes shadcn nuevos. Sin variables de entorno nuevas.

---

## 14. Open Questions

- ~~**OQ-1 — Validación server-side del `componentId`.**~~ **RESUELTO (verificado contra backend real,
  2026-08-30).** Se probó retirar (`PATCH .../retire`) un componente **asignado** a un work item
  (`Internal API v2`, asignado a `TST-3`): el backend lo **rechaza** y la UI muestra `"Failed to retire
  component — changes reverted"`. Como control, se retiró `Auth Module` (sin work items asignados) y
  tuvo éxito de inmediato. **Conclusión: el backend ya impide retirar un componente mientras esté
  asignado a algún work item.** Esto implica que el escenario de RF-7/AC-11 ("componente retirado pero
  todavía asignado a un work item") es, en la práctica actual, **inalcanzable a través del flujo normal
  del producto** — solo podría darse si el backend cambia esa regla en el futuro, o por una vía fuera de
  esta UI. La lógica defensiva de RF-7/`ComponentSelect` se mantiene tal cual (no genera ningún daño y
  cubre el caso si la regla del backend cambia), pero queda documentado que hoy es código
  defensivo sin caso de uso real alcanzable.
- ~~**OQ-2 — Código de estado del PATCH.**~~ **RESUELTO (verificado contra backend real, 2026-08-30).**
  `PATCH /v1/flowboard/work-items/{id}/component` responde con éxito silencioso (sin body, código `2xx`)
  y el backend registra el cambio en el Change Log del work item como `ComponentChanged`, visible de
  inmediato tras el refetch — confirmado con tres cambios consecutivos (asignar `Customer Portal`,
  reasignar a `Internal API v2`, luego `No component`) sobre `TST-3` del proyecto "Test Manager".

---

## 15. Final Assumptions (locked)

1. El campo Component es opcional en la creación (no bloquea el submit), igual que Assignee.
2. En `CreateWorkItemModal`, el `Select` de Component solo lista componentes `Active`.
3. Orden final de campos en el modal de creación: `Component` es una fila propia de ancho completo,
   entre `[Type, Priority]` y `[Estimated Points, Estimated Completion Date]`.
4. En el sidebar, la fila "Component" se ubica inmediatamente después de "Type" y antes de "Estimate
   points".
5. Un componente `Retired` asignado a un work item existente se sigue mostrando (con sufijo
   "(Retired)"), pero no aparece como opción nueva seleccionable para otros work items.
6. El endpoint sigue el patrón de un solo PATCH que acepta `null` en el body (como `type`/`priority`),
   no el patrón de dos endpoints (`assign`/`unassign`) que usa Assignee.
7. `useUpdateWorkItemComponent` actualiza de forma optimista solo `['work-item', code]` — no toca
   `['project-board', projectId]`.
8. No se muestra toast de éxito al cambiar el Component desde el sidebar; sí `toast.error` con rollback
   ante fallo, igual que el resto de campos.
9. El estado "sin componente" se muestra como texto `"No component"` en `text-muted-foreground`, no como
   un guion `"—"`.
10. `ComponentSelect.tsx` se crea como archivo propio porque se reutiliza en 2 lugares (`CreateWorkItemModal`
    y `WorkItemSidebar`), consistente con el criterio ya usado en el proyecto para `AssigneeSelect`/
    `TypeSelect`/`PrioritySelect`.
11. Los componentes se listan en el orden que ya retorna el backend (`GET .../components`), sin sort
    adicional en el frontend.
12. El `Label` del campo en el modal de creación es `"Component"`, sin asterisco de obligatorio.
