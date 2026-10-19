# Especificación de Funcionalidad: Filtros del Board

- **Versión:** 1.0
- **Fecha:** 2026-10-19
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + React Query + Tailwind v4)
- **Estado:** Implementado — criterios de aceptación verificados manualmente por el usuario
- **Branch:** `feature/board-filter`
- **Área afectada:** `src/features/projects/`

---

## 1. Overview

Requerimiento: *"Agregar filtros en la página de board de un proyecto, a la izquierda del selector de
agrupamiento (Group by). Por ahora 3 selectores: Type, Milestone y Component. Cada selector solo presenta
los valores de los work items del board. Selección múltiple en los 3, por defecto ninguno marcado. Sin
ningún filtro seleccionado no se filtra: se muestran todos los work items."*

El board de un proyecto (`/projects/:id/board`) muestra una columna por flow state Active y, opcionalmente,
swimlanes según **Group by**. Se agregan tres selectores multi-valor que reducen las cards visibles. Los
filtros se combinan con el agrupamiento, viven en la URL y no tocan el backend.

---

## 2. Estado actual verificado en el código

| Afirmación | Realidad en el código |
|---|---|
| "El board trae los datos para filtrar" | **Cierto.** `ProjectBoardWorkItem` (`types/project.types.ts`) trae `type`, `milestoneName`, `milestoneColor` y `component`. El filtrado puede ser 100% cliente. |
| "Milestone y componente vienen con id" | **Falso.** El board solo trae el **nombre** (`milestoneName`, `component`). Se filtra por nombre, igual que el agrupamiento (`utils/group-board-items.ts`). |
| "Existe un multi-select reutilizable" | **Falso.** `ui/select` es de selección simple. Existen `ui/popover`, `ui/checkbox` y `ui/dropdown-menu`. |
| "Hay un patrón de filtro previo" | **Parcial.** `ProjectsPage` filtra por estado con toggles en estado local, no en un dropdown ni en la URL. |
| "Los conteos se recalculan solos si cambian las columnas" | **Cierto.** `FlowStateHeading` usa `column.workItems.length`; `BoardSwimlanes` cuenta por celda de cada grupo. |
| "Hay un punto único donde insertar el filtrado" | **Cierto.** `ProjectBoardPage` hace `const columns = rawColumns`; todo lo que se renderiza (columnas, swimlanes, drag-and-drop) consume `columns`. |
| "El drag-and-drop no rompe un filtro" | **Cierto.** `BoardDragProvider` recibe `columns`; una drop cambia solo el estado, nunca tipo, milestone ni componente. |
| "El modal de detalle usa el board completo" | **Cierto.** `WorkItemDetailModal` recibe `rawColumns`. |

---

## 3. Goal

Que cualquier miembro del proyecto pueda reducir el board a los work items de ciertos tipos, milestones o
componentes, combinarlo con **Group by**, y compartir o refrescar el link sin perder los filtros.

**Criterios de éxito**
- Sin filtros, el board se ve exactamente igual que antes de esta feature.
- Con filtros, solo se ven las cards que cumplen todos los filtros activos, y los conteos (columnas,
  swimlanes, subtítulo) reflejan lo que se ve.

---

## 4. User Stories

- **US-1** — Como miembro del proyecto, quiero filtrar el board por uno o varios tipos (p.ej. solo Bugs), para revisar solo ese trabajo.
- **US-2** — Como miembro, quiero filtrar por uno o varios milestones o componentes, para ver el avance de una entrega o un módulo.
- **US-3** — Como miembro, quiero combinar filtros con Group by (p.ej. Bugs del milestone "v2" agrupados por asignado).
- **US-4** — Como miembro, quiero limpiar todos los filtros de una vez y que queden en la URL para compartirlos.

---

## 5. Requisitos Funcionales

### RF-1 — Ubicación
- Tres controles: `Type`, `Milestone`, `Component`, en ese orden.
- En la fila de tabs del proyecto, a la izquierda de `Group by`. Solo visibles en el tab **Board**.

### RF-2 — Opciones de cada selector
- Se derivan de los valores distintos presentes en los work items del board (`rawColumns`; el board solo trae estados Active).
- Las opciones se calculan sobre el **board completo**: no se recortan por los otros filtros activos.
- `Milestone` y `Component` agregan al final `No milestone` / `No component` si hay items sin ese valor.
- Cada opción muestra su conteo de items en el board completo.
- Orden:

| Selector | Orden | Detalle visual |
|---|---|---|
| Type | Orden de tipos de la app (`WORK_ITEM_TYPE_CONFIG`: Story, Bug, Technical Task, Investigation); un tipo desconocido va después, A→Z | Ícono y etiqueta vía `getWorkItemTypeConfig` |
| Milestone | A→Z por nombre; `No milestone` último. No se piden los milestones al backend | Punto con `milestoneColor` |
| Component | A→Z por nombre; `No component` último | — |

- Si ningún item tiene valor para un campo, el selector muestra solo la opción vacía (`No milestone` / `No component`).
- Con el board vacío (o cargando), los tres selectores quedan deshabilitados.

### RF-3 — Selección múltiple
- Cada selector es un trigger que abre un **popover con lista de checkboxes** (`ui/popover` + `ui/checkbox`).
- Marcar / desmarcar aplica el filtro al instante; el popover se mantiene abierto.
- Por defecto nada marcado.
- Al pie del popover, un enlace `Clear` que desmarca solo ese selector (visible si hay algo marcado).
- Accesible con teclado: Tab/flechas para recorrer, Espacio para marcar, Escape para cerrar.

### RF-4 — Lógica de filtrado
- Un selector sin selección **no filtra**.
- Dentro de un selector: **OR** (Bug o Story).
- Entre selectores: **AND** (tipo ∈ {Bug} **y** milestone ∈ {v2}).
- La opción vacía coincide con items cuyo campo es `null`.

### RF-5 — Estado del trigger
| Selección | Trigger |
|---|---|
| Ninguna | `Type` |
| Una | `Type: Bug` |
| Varias | `Type` + contador (`2`) |

- Con filtro activo el trigger se resalta (mismo lenguaje visual que `Group by`).

### RF-6 — Limpiar todo
- Con al menos un filtro activo aparece `Clear filters` a la derecha de los tres selectores; limpia los tres.

### RF-7 — Persistencia en la URL
- Parámetros `?type=`, `?milestone=`, `?component=`, **repetidos** por valor (`?type=Bug&type=Story`), para que un nombre con comas no rompa el parseo.
- La opción vacía se representa con un token reservado (`__none`).
- Cambiar un filtro escribe con `replace: true` y preserva `groupBy` y `selected`.
- Un valor de milestone o componente en la URL que no existe en el board se muestra en la lista **marcado con conteo 0** y sigue filtrando (para que el usuario pueda desmarcarlo).
- Un valor de `type` desconocido se ignora.
- No hay persistencia fuera de la URL: entrar al board sin parámetros = sin filtros.

### RF-8 — Integración con Group by
- Primero se filtra y luego se agrupa (`groupBoardItems` recibe las columnas filtradas).
- Las franjas que quedan sin items no se muestran (ya es el comportamiento de `groupBoardItems`).
- Cambiar filtros **no** resetea las franjas colapsadas.

### RF-9 — Conteos
- Los conteos de columna y de swimlane reflejan los items filtrados.
- El subtítulo del header muestra `X of Y items` con algún filtro activo, y `Y items` sin filtros.

### RF-10 — Sin resultados
- Si los filtros no dejan ningún item: se muestran las columnas vacías ("No items") y, encima, un aviso
  *"No work items match the current filters"* con el botón `Clear filters`.

### RF-11 — Drag-and-drop y modal
- El drag-and-drop sigue habilitado con filtros activos, con las mismas reglas actuales.
- `WorkItemDetailModal` sigue recibiendo `rawColumns`.

### RF-12 — Items que dejan de coincidir
- Un item editado desde el modal (tipo, milestone o componente) que deja de cumplir el filtro desaparece del board tras el refetch, sin mensaje especial.
- Un item recién creado que no cumple el filtro no se muestra, sin mensaje especial.

---

## 6. Acceptance Criteria

- **AC-1** — Dado el board sin parámetros de filtro, entonces se ve idéntico al previo a esta feature y los tres selectores muestran solo su etiqueta.
- **AC-2** — Dado el board, cuando marco `Bug` en Type, entonces solo quedan Bugs, la URL incluye `type=Bug` y los conteos de columna se actualizan.
- **AC-3** — Dado `Type = Bug` y `Milestone = v2`, entonces solo se ven Bugs del milestone v2.
- **AC-4** — Dado `Type = Bug, Story`, entonces se ven Bugs y Stories.
- **AC-5** — Dado un board con items sin componente, cuando abro Component, entonces aparece `No component` al final con su conteo, y al marcarlo quedan solo esos items.
- **AC-6** — Dado un filtro activo, cuando refresco la página, entonces el filtro se conserva.
- **AC-7** — Dado un filtro activo y `?groupBy=assignee`, entonces las franjas contienen solo items filtrados y las franjas vacías no se muestran.
- **AC-8** — Dados filtros activos, cuando hago click en `Clear filters`, entonces se quitan los tres parámetros, el board vuelve a mostrar todo y se conservan `groupBy` y `selected`.
- **AC-9** — Dados filtros sin coincidencias, entonces se ve el aviso de sin resultados con `Clear filters`.
- **AC-10** — Dado `?milestone=Inexistente`, entonces Milestone lista "Inexistente" marcado con conteo 0 y se ve el aviso de sin resultados.
- **AC-11** — Dado un filtro activo, cuando arrastro una card a otra columna permitida, entonces el movimiento funciona y la card sigue visible.
- **AC-12** — Dado un filtro activo, entonces el subtítulo muestra `X of Y items`.
- **AC-13** — Dado `?type=Foo`, entonces el valor se ignora y Type no muestra selección.
- **AC-14** — Dado un filtro activo, cuando abro una card y cierro el modal, entonces la URL conserva los filtros.
- **AC-15** — Dado el selector Milestone abierto, cuando marco dos opciones, entonces el popover sigue abierto y el trigger muestra `Milestone` con contador `2`.

---

## 7. Integration Points

| Pieza | Cambio propuesto |
|---|---|
| `constants/board-filters.ts` (nuevo) | Nombres de los parámetros, token de vacío (`__none`), tipo `BoardFilters`, `parseBoardFilters(searchParams)`, helper para escribirlos. |
| `utils/filter-board-items.ts` (nuevo) | Función pura `(columns, filters) => columns`. Sin filtros devuelve **el mismo array** para no romper `useMemo` ni la memoización de `WorkItemCard`. |
| `utils/board-filter-options.ts` (nuevo) | Deriva opciones, orden y conteos desde `rawColumns`, incluyendo valores de la URL ausentes (conteo 0). |
| `components/BoardFilterControl.tsx` (nuevo) | Un selector multi-valor genérico (popover + checkboxes), reutilizado por los tres. |
| `components/BoardFilterBar.tsx` (nuevo) | Los tres selectores + `Clear filters`. |
| `ProjectBoardPage.tsx` | `columns = useMemo(() => filterBoardItems(rawColumns, filters))`; render de la barra a la izquierda de `BoardGroupByControl`; subtítulo `X of Y items`; aviso de sin resultados. |
| `.claude/rules/projects.md` | Agregar sección "Board filters" con referencia a esta spec. |
| Tests (Vitest) | Filtrado (OR/AND, opción vacía, sin filtros = mismo array), opciones (orden, conteos, valores ausentes), parseo de URL (repetidos, desconocidos). |

- **Backend:** sin cambios. No hay llamadas nuevas.
- **Reglas transversales:** etiquetas de tipo vía `getWorkItemTypeConfig` (nunca `MAP[value]`); popovers con `ui/popover`, nunca un portal propio ni `<select>` nativo; hints con `ui/tooltip`.

---

## 8. Permisos

- Todos los miembros del proyecto, incluidos Viewers. Es una vista de solo lectura sin escrituras al backend.

---

## 9. Out of Scope

- Filtros por asignado, prioridad, texto o fechas.
- Filtrado del lado del servidor.
- Guardar filtros como *saved view*.
- Persistencia por proyecto fuera de la URL (localStorage).
- Buscador dentro de los popovers.
- Opciones facetadas (recortadas por los otros filtros activos).
- Filtros en los tabs Components y Milestones.
- Mensajes especiales cuando un item creado/editado queda oculto por los filtros.

---

## 10. Final Assumptions

1. Los filtros solo se ven en el tab **Board**, en el orden `Type`, `Milestone`, `Component`, a la izquierda de `Group by`.
2. Las opciones se calculan sobre el board completo. No se recortan según los otros filtros activos.
3. `Milestone` y `Component` incluyen la opción `No milestone` / `No component` para items sin valor.
4. Cada opción muestra su conteo de items.
5. Dentro de un selector las opciones se combinan con OR, y entre selectores con AND.
6. El control es un popover con checkboxes que aplica cada cambio al instante y se queda abierto, con un `Clear` propio.
7. El trigger muestra `Type`, `Type: Bug` o `Type` más un contador, y se resalta con un filtro activo.
8. Con algún filtro activo aparece un botón global `Clear filters`.
9. Los filtros se guardan en la URL con parámetros repetidos (`?type=Bug&type=Story`), con `replace: true` y preservando `groupBy` y `selected`.
10. No se guardan en localStorage: al entrar al board sin parámetros, no hay filtros.
11. Un valor de la URL que no existe en el board se muestra marcado con conteo 0 y sigue filtrando.
12. Orden de las opciones: Type según el orden de tipos de la app, Milestone A→Z con su punto de color (sin pedir los milestones al backend), Component A→Z.
13. Primero se filtra y después se agrupa. Las franjas vacías se ocultan y cambiar filtros no resetea las franjas colapsadas.
14. Los conteos de columna y swimlane muestran los items filtrados, y el subtítulo dice `X of Y items` con un filtro activo.
15. Si no queda ningún item, se ven las columnas vacías más un aviso "No work items match the current filters" con `Clear filters`.
16. El drag-and-drop sigue habilitado con filtros activos.
17. Un item creado o editado que deja de cumplir el filtro desaparece sin ningún mensaje.
18. Todos los miembros pueden usar los filtros, incluidos los Viewers.
19. El filtrado es 100% del lado del cliente, sin endpoint nuevo.
20. Los popovers no tienen buscador interno.
21. Las etiquetas de la UI van en inglés (`Type`, `Milestone`, `Component`, `Clear filters`, `No milestone`), como el resto de la app.
