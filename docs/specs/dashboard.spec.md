# Especificación de Funcionalidad: Dashboard (Home) y My Issues

- **Versión:** 1.3
- **Fecha:** 2026-11-10
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Implementada en el frontend — pendiente de verificar contra la API (sección 9)
- **Branch:** `feature/dashboard`
- **Área afectada:** `src/features/dashboard/`, `src/features/work-items/`, `src/features/projects/`
- **Diseño:** Opción A del artefacto [Flowboard Dashboard](https://claude.ai/artifact/Ak5QJgzKtNXdEcRqHjegFt)

---

## 1. Overview

El Home (`/dashboard`) y My Issues (`/my-issues`) son hoy placeholders. Esta feature construye ambos.

El dashboard responde dos preguntas en una pantalla: **qué tengo que hacer yo** y **dónde está trabado el
trabajo en mis proyectos**. La mayoría de los work items no tiene fecha ni milestone, así que el eje es el
**flujo**: cuánto lleva cada item en su estado actual. Por eso nada dice "overdue"; dice "9d", "stalled".

My Issues usa la misma consulta y la misma lista que la sección **My work** del dashboard, con paginación.

Además, las cards del board muestran la antigüedad en el estado, con la misma regla de color.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El Home existe" | **Parcial.** `DashboardPage` tiene el saludo y `UnderConstructionPlaceholder`. |
| "My Issues existe" | **Parcial.** La ruta y el badge del Sidebar (`counts.myOpenIssues`) existen. `MyIssuesPage` (`features/work-items/components/`) es un placeholder. |
| "Se puede listar work items entre proyectos" | **Falso.** Solo existe el board por proyecto. Se necesita `GET /work-items` (sección 9). |
| "Se sabe cuándo entró un item a su estado" | **Falso.** `ProjectBoardWorkItem` trae `createdOnUtc`, no `enteredCurrentStateOnUtc`. El dato solo vive en el historial, y `Create` no escribe historial. |
| "Se sabe cuál es el backlog de un proyecto" | **Falso en el frontend.** `ProjectBoardColumn` trae `sortOrder` y `category`, pero no indica la etapa. El backend sí tiene `Project.GetInitialFlowState()`. |
| "Existe un conjunto de proyectos reutilizable" | **Cierto, y cambió en la v1.2.** `GetMySummaryHandler` filtraba `Status != Archived`. Ahora filtra `Active` o `Maintenance` y membresía, y ordena por estado y nombre. Es lo que muestra el Sidebar. |
| "Un proyecto no se puede completar con items abiertos" | **Cierto desde la v1.2.** El backend responde 400 `Project.CannotCloseWithOpenWorkItems` al pasar de `Active` o `Maintenance` a `Completed` o `Archived` con items abiertos (PRD §5.1). Antes no lo comprobaba. |
| "Se puede abrir el detalle de un item desde cualquier página" | **Falso.** `WorkItemDetailModal` exige las `columns` del board. Sí existe el deep link `/projects/:id/board?selected=CODE`. |
| "Un `staleTime` global sirve aquí" | **Falso.** El global es 5 min con `refetchOnWindowFocus: false`. Estancado y antigüedad cambian con el tiempo, sin mutaciones. |
| "Mover en el board no cambia contadores" | **Ya no es cierto para el dashboard.** `useMoveBoardWorkItem` no invalida `mySummary` porque un drag no cambia abiertos ni cerrados, pero sí cambia en vuelo, estancados y antigüedad. |

---

## 3. Goal

Que un miembro vea al abrir la app qué trabajo suyo está detenido y en qué proyectos se atasca el trabajo,
sin configurar fechas ni milestones.

**Criterios de éxito**
- Todos los contadores salen de una sola definición de abierto, backlog, en vuelo y estancado.
- El contador `My open items` coincide siempre con el badge de My Issues en el Sidebar.
- El portafolio lista exactamente los proyectos del Sidebar, en el mismo orden.
- Un item en backlog nunca aparece en rojo ni ámbar, sin importar su antigüedad.

---

## 4. Definiciones

Son la fuente de verdad de esta spec. El backend las calcula; el frontend solo las muestra.

| Concepto | Definición |
|---|---|
| **Mis proyectos activos** | Soy miembro y el estado del proyecto es `Active` o `Maintenance`: los que admiten work items. Es el **único conjunto** de estas pantallas: el Sidebar (en su orden, estado y luego nombre), las filas del portafolio y todas las métricas, incluido `team.closedLast7Days`, además de los milestones y la búsqueda de work items. Un proyecto `Completed` o `Archived` solo se ve en Projects. |
| **Abierto** | El flow state del item tiene categoría `Active`. |
| **Backlog** | El estado inicial: el `Active` con menor `SortOrder`. **Excepción:** si el proyecto tiene un solo estado `Active`, ese estado es en vuelo y el proyecto no tiene backlog. |
| **En vuelo** | Abierto y no backlog. |
| **Días en el estado** | Bloques de 24 horas completos desde `enteredCurrentStateOnUtc`. No son días de calendario. |
| **Estancado** | En vuelo y 7 días o más en el estado. Un item en backlog nunca está estancado. |
| **Cerrado (últimos 7 días)** | Categoría `Completed` y `CompletedOnUtc` dentro de los últimos 7 días (ventana móvil). Se excluyen los `Cancelled`. |
| **Unassigned** | Abierto (backlog incluido) y sin asignado. |
| **Critical & high** | Prioridad `High` o `Critical` y abierto (backlog incluido). |
| **Milestone listado** | Estado `Active` y perteneciente a uno de mis proyectos activos. |
| **Items vinculados** | `linkedTotal` = vinculados no cancelados. `linkedClosed` = vinculados en `Completed`. `linkedStalled` = vinculados estancados. |

### Regla de color de la antigüedad

| Etapa | Días | Color |
|---|---|---|
| Backlog | cualquiera | Gris |
| En vuelo | 0 a 3 | Gris |
| En vuelo | 4 a 6 | Ámbar |
| En vuelo | 7 o más | Rojo |

Los umbrales 4 y 7 son constantes del frontend, en un solo helper. El backend tiene su propia constante para
7. No son configurables y la API no los expone. Se decidió así porque el board también los necesita y no
consume `/dashboard`.

---

## 5. User Stories

- **US-1** — Como miembro, quiero ver cuántos items míos están abiertos, estancados o son críticos, para saber si algo requiere atención.
- **US-2** — Como miembro, quiero ver mi trabajo ordenado con lo que está en vuelo primero y lo más antiguo arriba, para saber qué retomar.
- **US-3** — Como miembro, quiero ver estancados, sin asignar y cerrados de mis proyectos, para entender la salud del equipo.
- **US-4** — Como miembro, quiero ver por proyecto cómo se reparte el trabajo entre estados, para detectar dónde se atasca.
- **US-5** — Como miembro, quiero ver el avance de los milestones activos y su fecha, cuando existan.
- **US-6** — Como miembro, quiero una página con todo mi trabajo paginado, para ir más allá de lo que cabe en el Home.
- **US-7** — Como miembro, quiero ver en el board cuánto lleva cada card en su estado.

---

## 6. Requisitos Funcionales

### RF-1 — Encabezado
- Saludo y fecha actuales de `DashboardPage`, sin botón **+ Create issue** (se elimina respecto al diseño).
- Subtítulo: `{fecha} · {me.stalled} of your items has/have stopped moving · {team.stalled} across your projects.`
- Con `me.stalled = 0`: `{fecha} · None of your items has stopped moving · {team.stalled} across your projects.`
- Mientras carga o si `/dashboard` falla, el subtítulo muestra solo la fecha.

### RF-2 — KPIs
Dos grupos con su alcance explícito. **Los números no son enlaces.**

| Grupo | Etiqueta | Campo |
|---|---|---|
| **You** — *assigned to me* | My open items | `me.open` |
| | Stalled 7+ days | `me.stalled` |
| | Critical & high | `me.criticalHigh` |
| **Your projects** — *projects I'm a member of* | Stalled 7+ days | `team.stalled` |
| | Unassigned | `team.unassigned` |
| | Closed last 7 days | `team.closedLast7Days` |

### RF-3 — My work
Título `My work`, subtítulo `In flight first, then backlog · longest in state first`.

| Pestaña | Contador | Filtros de `GET /work-items` |
|---|---|---|
| All | `me.open` | `assignee=me` |
| Stalled | `me.stalled` | `assignee=me&stalled=true` |
| In flight | `me.inFlight` | `assignee=me&stage=InFlight` |
| Critical & high | `me.criticalHigh` | `assignee=me&priority=High,Critical` |
| Reported by me | sin contador | `createdBy=me` |

- Todas usan `sort=stageThenTimeInState`: en vuelo primero, luego backlog; dentro de cada tramo, más días en el estado primero. El backend aplica el alcance (mis proyectos activos, solo abiertos).
- **Reported by me** incluye items de cualquier asignado y sin asignar.
- La pestaña activa vive en la URL (`?tab=`), con `replace`. Un valor desconocido equivale a `All`.
- El dashboard pide los primeros 10 items. El pie muestra `Showing {items} of {totalCount} open items` y el enlace `Open My Issues →`, que abre la misma pestaña.
- Cambiar de pestaña mantiene visible la lista anterior hasta que llega la nueva.

### RF-4 — Fila de work item
Compartida por My work y My Issues:
- Icono de tipo, código, título, prioridad (`PriorityBars`) y el milestone si existe, con el mismo `MilestoneTag` que las cards del board.
- Proyecto (color y nombre), estado actual, antigüedad `{n}d` con la regla de color, avatar del asignado o `UnassignedAvatar`.
- Toda la fila navega a `/projects/:projectId/board?selected={code}`. El teclado la alcanza con un `<Link>` en el título, según la regla de cards clickeables de `CLAUDE.md`.

### RF-5 — Aging work in progress
- Título `Aging work in progress`, subtítulo `{suma de buckets} items in flight, by time in state`.
- Cuatro rangos en el orden de la API: 0–3, 4–6, 7–13 y 14+ días. La etiqueta se arma con `from` y `to`.
- Alcance: todos los items en vuelo de mis proyectos activos, de cualquier asignado.
- `Oldest in flight`: `{code} · {n} days`, enlazado como en RF-4. Se oculta si es `null`.

### RF-6 — Milestones
- Solo se listan los milestones con al menos un item vinculado (`linkedTotal > 0`). La API sigue enviando todos los `Active`, y el filtro es del frontend. El chip del portafolio (RF-7) no se filtra.
- Título `Milestones`, subtítulo `{n} active · progress of linked items`, donde `{n}` cuenta solo los listados.
- Si hay milestones activos pero ninguno tiene items: `No work items linked to active milestones`.
- Cada fila: nombre con su color, proyecto, fecha, `{linkedClosed}/{linkedTotal}` con barra de progreso y `{linkedStalled} stalled` (`—` si es 0).
- Orden, dado por la API: con fecha de la más cercana a la más lejana (las vencidas quedan primero); luego sin fecha, por `linkedStalled` descendente.
- Fecha: `in {n}d`, `today`, `{n}d past` o `No target date`, en días de calendario locales, leyendo la fecha con `date-format`.
- Color de la fecha:
  - Rojo si ya pasó.
  - Ámbar si faltan 7 días o menos y el progreso es menor a 80%.
  - Gris en cualquier otro caso, y siempre si `linkedTotal = 0`.
- La fila navega a `/projects/:projectId/milestones`.

### RF-7 — Portfolio
- Título `Portfolio`, subtítulo `{suma open} open · {suma stalled} stalled across {n} projects`.
- Una fila por proyecto de **mis proyectos activos**, en el orden de la API.
- Cada fila: color y nombre, tipo (`getProjectKindConfig`), chip del milestone activo, barra por estado, `{open} open`, `{stalled} stalled` (`—` si es 0) y avatares (`MemberAvatarStack`).
- **Barra:** solo estados `Active`, en el orden del board y con el color de cada estado. El ancho es proporcional a `count`; un estado con 0 no se dibuja; el tooltip muestra `{estado}: {count}`. Con `open = 0` se muestra una pista vacía en gris.
- **Chip de milestone:** el `activeMilestone` que devuelve la API, con el mismo `MilestoneTag` que My work y el board (solo el nombre). A su lado, fuera de la pastilla, `{closed}/{total} · {fecha}` en gris, con la fecha coloreada según las reglas de RF-6. Sin milestone activo: `No open milestone` en gris.
- La fila navega a `/projects/:projectId/board`.

### RF-8 — My Issues
- Título `My issues`. El subtítulo actual cambia a `Your open work items across all your projects.`, porque la pestaña **Reported by me** no son solo asignados.
- Mismas pestañas, filtros, orden y fila que My work (RF-3 y RF-4), sin contadores en las pestañas: la página no consume `/dashboard`.
- Paginada de a 25 con `page` en la URL. Cambiar de pestaña vuelve a la página 1.
- Un item de un proyecto `Completed` no aparece, aunque esté asignado a mí o lo haya creado yo. Solo se llega a él desde Projects, por el board, o por su código.

### RF-9 — Antigüedad en el board
- `WorkItemCard` muestra `{n}d` con la regla de color. La etapa sale de `column.stage`.
- Mover una card fija `enteredCurrentStateOnUtc` a la hora actual en el patch optimista, tanto en `useMoveBoardWorkItem` como en `useMoveWorkItem`. Si la mutación falla, el rollback existente lo revierte.
- Si el campo no viene (backend anterior a este cambio), la card no muestra antigüedad.
- Los filtros, el agrupamiento y el drag-and-drop no cambian.
- En un proyecto `Completed` antes de la regla de RF-11, las cards abiertas siguen visibles y pueden verse en rojo por antigüedad, aunque no se puedan mover ni cuenten como estancadas en el dashboard.

### RF-10 — Frescura de los datos
- `/dashboard` y `/work-items` usan `staleTime` de 60 segundos y `refetchOnWindowFocus: true`, solo en estas consultas.
- `queryKeys.dashboard()` y `queryKeys.workItems.searches()` se invalidan en las mutaciones de la sección 12. El refresco es silencioso: sin skeleton ni parpadeo.

### RF-11 — Completar o archivar un proyecto con items abiertos
- El backend rechaza pasar de `Active` o `Maintenance` a `Completed` o `Archived` mientras el proyecto tenga items abiertos (400 `Project.CannotCloseWithOpenWorkItems`). `Completed → Archived` sigue permitido.
- En Projects, el menú de estado muestra esas opciones deshabilitadas cuando `openWorkItems > 0` y, debajo, `Close or cancel its {n} open item(s) before {completing or archiving | archiving} it.`, nombrando solo las opciones que ofrece el menú.
- La regla vive en `isBlockedByOpenWorkItems` (`constants/project-status.ts`).
- El contador sale de la lista en caché, que puede estar desactualizada. Si el backend responde 400, el cambio optimista se revierte con el toast de siempre, que muestra el mensaje del backend.

---

## 7. UI/UX

| Estado | Comportamiento |
|---|---|
| Carga inicial | Skeleton por sección; la estructura no salta al llegar los datos. |
| Falla `/dashboard` | `ErrorState` con `onRetry` en KPIs, rail y portafolio. My work sigue funcionando. |
| Falla `/work-items` | `ErrorState` con `onRetry` solo en la lista. |
| Sin proyectos activos | `EmptyState` en lugar de todas las secciones: `No active projects`, con la descripción `Completed and archived projects are on the Projects page.` y el enlace `Go to projects`. Lo ve también quien solo tiene proyectos `Completed` o `Archived`. |
| Pestaña vacía | All: `Nothing assigned to you`. Stalled: `Nothing of yours has stopped moving`. In flight: `Nothing of yours is in flight`. Critical & high: `No critical or high priority items`. Reported by me: `No open items reported by you`. |
| Aging en cero | Los cuatro rangos en 0 y sin `Oldest in flight`. |
| Sin milestones activos | La card se mantiene, con el texto `No active milestones`. |
| Milestones activos, todos sin items | La card se mantiene, con el texto `No work items linked to active milestones`. |

- Todo mensaje de error pasa por `getErrorMessage`. Las fechas, por `date-format`.
- Tipo, prioridad y tipo de proyecto se leen con sus getters con fallback.
- Avatares con `UserAvatar`, usando las iniciales de la API. Hints con `ui/tooltip`.
- Pestañas con `UnderlineTabs`.
- La UI está en inglés, como el resto de la app.

---

## 8. Layout

Según la Opción A, dentro del `PageHeader` y un contenedor con scroll propio (`h-full`, nunca `h-screen`):

```
Saludo · subtítulo
[ You: 3 KPIs ]            [ Your projects: 3 KPIs ]
[ My work (lista)        ] [ Aging        ]
[                        ] [ Milestones   ]
[ Portfolio (ancho completo)              ]
```

---

## 9. Data Requirements

Implementado por la sesión `fb-api-dashboard` en la rama `feature/dashboard` de `aurora-flowboard-api` (diseño en `docs/specs/2026-11-07-dashboard-design.md`). El contrato coincide con esta sección campo por campo. Con el cambio de producto del 2026-11-09, **todos estos datos usan mis proyectos activos; ningún tipo cambia:**

| Dato | Alcance |
|---|---|
| Lista del Sidebar, `counts.projects`, `counts.members` y `counts.myOpenIssues` de `my-summary` | Mis proyectos activos. `me.open` sigue coincidiendo con el badge. |
| `me.*`, `team.*` (incluido `closedLast7Days`), `aging`, `milestones` y filas de `portfolio` | Mis proyectos activos. Quien solo tiene proyectos `Completed` recibe la respuesta vacía. |
| `GET /work-items` | Mis proyectos activos, solo abiertos. |

`GET /projects` y `GET /projects/{id}` no cambian: listan todas mis membresías, archivados incluidos, y `OpenWorkItems` describe al proyecto.

`PATCH /projects/{id}/complete` y `PATCH /projects/{id}/archive` responden 400 `Project.CannotCloseWithOpenWorkItems` desde `Active` o `Maintenance` con items abiertos (RF-11). Es el mismo patrón que los milestones: sin lista de códigos.

### `GET /v1/flowboard/dashboard` (sin parámetros)

```ts
interface DashboardResponse {
  me: { open: number; stalled: number; inFlight: number; criticalHigh: number }
  team: { stalled: number; unassigned: number; closedLast7Days: number }
  aging: {
    buckets: { from: number; to: number | null; count: number }[]
    oldestInFlight: {
      code: string; title: string; projectId: string; projectName: string
      enteredCurrentStateOnUtc: string
    } | null
  }
  milestones: {
    id: string; projectId: string; projectName: string; name: string; color: string
    targetEndDate: string | null; linkedTotal: number; linkedClosed: number; linkedStalled: number
  }[]
  portfolio: {
    projectId: string; name: string; color: string; kind: ProjectKind; status: ProjectApiStatus
    open: number; stalled: number
    distribution: { flowStateId: string; name: string; color: string; count: number }[]
    activeMilestone: {
      id: string; name: string; color: string; targetEndDate: string | null
      linkedTotal: number; linkedClosed: number
    } | null
    members: { userId: string; fullName: string; initials: string }[]
  }[]
}
```

- `distribution` incluye solo estados `Active`, en `SortOrder`, también los que tienen `count = 0`.
- `activeMilestone`: el `Active` con `targetEndDate` más próximo, vencidos incluidos. Si ninguno tiene fecha, el creado más recientemente.

### `GET /v1/flowboard/work-items`

| Parámetro | Valores |
|---|---|
| `assignee` | `me` |
| `createdBy` | `me` |
| `stage` | `InFlight`, `Backlog` |
| `stalled` | `true` |
| `priority` | Lista separada por comas |
| `sort` | `stageThenTimeInState` |
| `page`, `pageSize` | Devuelve `PagedResult<T>` (`shared/types/paged-result.types.ts`) |

Alcance fijo: mis proyectos activos, solo abiertos.

```ts
interface WorkItemListItem {
  workItemId: string; code: string; title: string; type: WorkItemType; priority: Priority
  projectId: string; projectName: string; projectColor: string
  flowStateId: string; flowStateName: string; stage: 'Backlog' | 'InFlight'
  enteredCurrentStateOnUtc: string
  assigneeId: string | null; assigneeInitials: string | null; assigneeFullName: string | null
  milestoneName: string | null; milestoneColor: string | null
}
```

### Cambios en respuestas existentes
- `ProjectBoardWorkItem` y detalle del work item: `enteredCurrentStateOnUtc`.
- `ProjectBoardColumn`: `stage`. Solo `Active` tiene etapa en el board.

---

## 10. Non-Functional

- Las páginas siguen siendo lazy (`lazyPage`). No se agrega librería de gráficos: las barras son elementos con ancho proporcional.
- Toda ruta con variable usa `apiPath`; toda clave, `queryKeys`.
- El helper de antigüedad es la única fuente de días y color en el frontend.

---

## 11. Acceptance Criteria

**Definiciones**
- **AC-1** — Dado un item en el estado inicial con 34 días, cuando se muestra, entonces se ve `34d` en gris y no cuenta como estancado.
- **AC-2** — Dado un item en vuelo con 3, 4, 6 y 7 días, cuando se muestra, entonces se ve gris, ámbar, ámbar y rojo respectivamente.
- **AC-3** — Dado un proyecto con un solo estado `Active` y un item de 7 días, cuando se muestra, entonces aparece en rojo y suma a `stalled`.
- **AC-4** — Dado un item que entró a su estado hace 6 días y 23 horas, cuando se muestra, entonces se ve `6d`.

**Dashboard**
- **AC-5** — Dada cualquier carga, entonces `me.open` es igual al badge de My Issues del Sidebar.
- **AC-6** — Dado el portafolio, entonces lista los mismos proyectos que el Sidebar y en el mismo orden.
- **AC-7** — Dada la barra de un proyecto, entonces sus segmentos siguen el orden de las columnas del board y no incluyen estados `Completed` ni `Cancelled`.
- **AC-8** — Dado un KPI, cuando se hace clic, entonces no ocurre navegación.
- **AC-9** — Dado el encabezado, entonces no existe el botón `+ Create issue`.
- **AC-10** — Dada la pestaña **Reported by me**, entonces aparecen items que creé asignados a otras personas o sin asignar, y la pestaña no muestra contador.
- **AC-11** — Dado un milestone vencido, cuando se muestra, entonces la fecha `{n}d past` está en rojo. Dado uno sin fecha, entonces dice `No target date` en gris.
- **AC-30** — Dados un milestone activo con items y otro con `linkedTotal = 0`, cuando se muestra la card, entonces solo aparece el primero y el subtítulo dice `1 active`.
- **AC-12** — Dada una fila de My work, cuando se hace clic, entonces se abre el board del proyecto con el modal de ese item.
- **AC-13** — Dado que `/dashboard` falla, entonces KPIs, rail y portafolio muestran `ErrorState` y My work sigue visible.
- **AC-14** — Dado un usuario sin proyectos activos (sin ninguno, o solo con `Completed` o `Archived`), entonces se ve el `EmptyState` `No active projects` y no hay secciones en cero.
- **AC-23** — Dado un proyecto `Completed`, entonces no aparece en el Sidebar ni en el portafolio, y sus items no suman a ninguna cifra del dashboard.
- **AC-24** — Dado un item cerrado en los últimos 7 días en un proyecto ya `Completed`, entonces no suma a `Closed last 7 days`.
- **AC-25** — Dado un proyecto sin items abiertos que pasa a `Completed` desde Projects, cuando se vuelve al dashboard, entonces ya no aparece en el Sidebar ni en el portafolio.

**My Issues**
- **AC-15** — Dadas más de 25 filas, cuando se cambia de página, entonces `page` queda en la URL y refrescar conserva la página.
- **AC-16** — Dada la página 3, cuando se cambia de pestaña, entonces se vuelve a la página 1.
- **AC-26** — Dado un item asignado a mí en un proyecto `Completed`, entonces no aparece en ninguna pestaña de My Issues ni en My work.

**Board**
- **AC-17** — Dada una card movida a otra columna, entonces muestra `0d` de inmediato. Si la mutación falla, vuelve a su valor anterior.
- **AC-18** — Dado un backend sin `enteredCurrentStateOnUtc`, entonces la card se ve como antes y sin errores.

**Projects**
- **AC-27** — Dado un proyecto `Active` o `Maintenance` con items abiertos y un usuario `Admin` del proyecto, cuando abre el menú de estado, entonces `Completed` y `Archived` están deshabilitados y el menú explica cuántos items hay que cerrar o cancelar.
- **AC-28** — Dado un proyecto `Completed` con items abiertos, entonces `Archived` sigue habilitado.
- **AC-29** — Dada una lista desactualizada y un 400 `Project.CannotCloseWithOpenWorkItems`, entonces el estado vuelve al anterior y el toast muestra el mensaje del backend.

**Frescura**
- **AC-19** — Dada navegación entre rutas sin mutaciones, entonces no se dispara ninguna petición adicional dentro de los 60 segundos de `staleTime`.
- **AC-20** — Dado un item movido en el board, cuando se vuelve al dashboard, entonces los contadores reflejan el cambio.
- **AC-21** — Dado un refresco en segundo plano, entonces se siguen mostrando los datos previos, sin skeleton ni parpadeo.
- **AC-22** — Dado usuario A que cierra sesión y usuario B que entra, entonces nunca se muestran datos de A, ni por un frame.

---

## 12. Integration Points

| RF | Archivo | Cambio |
|---|---|---|
| RF-1, 2, 5, 6, 7 | `src/features/dashboard/components/` | `DashboardPage` y los componentes de cada sección. |
| RF-2, 5, 6, 7 | `src/features/dashboard/{services,types,hooks}/` | `dashboard.service.ts`, `dashboard.types.ts`, `useDashboard`. |
| RF-3, 4, 8 | `src/features/work-items/components/` | Lista y fila compartidas; `MyIssuesPage`. |
| RF-3, 8 | `src/features/work-items/services/work-item.service.ts` | `searchWorkItems`, con `useWorkItemSearch`. |
| RF-4, 9 | `src/features/work-items/utils/` | Helper de días y nivel de antigüedad, con pruebas. |
| RF-9 | `src/features/projects/types/project.types.ts` | `enteredCurrentStateOnUtc`, `stage`. |
| RF-9 | `src/features/projects/components/WorkItemCard.tsx` | Antigüedad. |
| RF-9 | `useMoveBoardWorkItem.ts`, `useMoveWorkItem.ts` | Patch optimista de la fecha. |
| RF-10 | `src/shared/lib/query-keys.ts` | `dashboard()` y `workItems.searches()` / `search(filters)`, con raíz propia (`['work-item-search']`) para no caer bajo `workItems.all()`. |
| RF-10 | `useOptimisticWorkItemMutation.ts` | `workItemInvalidations` agrega ambas claves: cubre mover, asignar, prioridad, milestone, tipo y título. |
| RF-10 | `useCreateWorkItem.ts` | Invalida ambas claves. |
| RF-10 | `useCreateMilestone.ts`, `useUpdateMilestone.ts`, `useUpdateMilestoneStatus.ts` | Invalidan `dashboard()`. `useUpdateMilestone` también `searches()`, porque las filas muestran el nombre y el color del milestone. |
| RF-10 | `useCreateProject.ts`, `useUpdateProject.ts`, `useUpdateProjectStatus.ts`, `useAddProjectMember.ts`, `useRemoveProjectMember.ts` | Invalidan `dashboard()`; las que cambian alcance o nombre del proyecto, también `searches()`. `useUpdateProjectStatus` cambia el alcance, porque completar o archivar un proyecto saca sus items, y además ya invalida `mySummary()`. |
| RF-11 | `src/features/projects/constants/project-status.ts`, `components/ProjectsPage.tsx` | `isBlockedByOpenWorkItems` y opciones deshabilitadas en el menú de estado. |
| — | `.claude/rules/data-layer.md`, `work-items.md`, `projects.md` | Documentar las claves nuevas, el campo de antigüedad, el Sidebar y la regla de cierre. |

---

## 13. Permissions

- Cualquier miembro de un proyecto, incluido `Viewer`, ve sus datos en ambas páginas.
- El rol de workspace `Administrator` no da visibilidad: un proyecto cuenta solo si el usuario es miembro.
- Las páginas son de solo lectura. Editar sigue en el modal de detalle, con sus permisos actuales.

---

## 14. Out of Scope

- Crear work items desde el dashboard.
- Números enlazados a listas filtradas, y lista de trabajo del equipo.
- Filtros adicionales en My Issues (proyecto, tipo, búsqueda).
- Selector de proyectos en el dashboard.
- Abrir el modal de detalle sin salir de la página.
- Umbrales configurables, analítica avanzada y burndown.

### Dependencias
- Backend: sección 9, lista en la rama `feature/dashboard` de la API (todavía sin push). El frontend se probó contra MSW, falta verificarlo contra la API y no se libera antes que ella.

---

## 15. Final Assumptions

**Decididas por el usuario**: las definiciones de la sección 4; barra solo con estados `Active`; números sin enlace; sin `+ Create issue`; My Issues con la misma consulta; antigüedad en las cards.

**Cambio de la versión 1.1**: los items abiertos de proyectos `Completed` dejan de contar en el dashboard, My Issues y el badge. Decisión del usuario comunicada por la sesión `fb-api-dashboard`, porque esos items no se pueden mover. La regla del PRD §5.1, que impediría completar un proyecto con items abiertos, se agregará en un ticket aparte. *(Sustituido en la v1.2.)*

**Cambio de la versión 1.2** (2026-11-10), aprobado por el Product Manager el 2026-11-09 y comunicado por `fb-api-dashboard`:
- Un solo conjunto de proyectos, mis proyectos activos, también para el Sidebar, el portafolio y `closedLast7Days`. Desaparece la fila en cero de un proyecto `Completed`.
- La regla del PRD §5.1 se implementó en la misma rama de la API. El frontend deshabilita las opciones afectadas (RF-11).

**Cambio de la versión 1.3** (2026-11-10), pedido por el usuario: la card de Milestones omite los milestones sin items vinculados (`0/0`). Es una decisión solo del frontend; la API no cambia.

**Supuestos confirmados por el usuario**
1. Una fila de item navega al board del proyecto con `?selected=CODE`, porque `WorkItemDetailModal` depende de las columnas del board.
2. **Reported by me** no lleva contador, como en el diseño, y `/dashboard` no devuelve ese número.
3. Los umbrales 4 y 7 son constantes del frontend, y la API no los expone.
4. El dashboard muestra los primeros 10 items de My work; My Issues pagina de a 25.
5. My Issues no muestra contadores en las pestañas, para no depender de `/dashboard`.
6. Aging y `Oldest in flight` cubren todo el trabajo en vuelo de mis proyectos activos, no solo el mío.
7. Milestones y portafolio también son enlaces de navegación; la regla de "números sin enlace" aplica a los KPIs y contadores.
8. En un milestone con `linkedTotal = 0`, la fecha siempre es gris, incluso vencida. Desde la v1.3 eso solo aplica al chip del portafolio, porque la card de Milestones ya no los lista.
9. Las pestañas y la página viven en la URL en ambas páginas.
10. El artefacto se ajusta: quitar `+ Create issue`, cambiar `4 open` a `4 active` en Milestones y `items in active states` a `items in flight` en Aging, y actualizar su nota de backend con el contrato de la sección 9.
