# Especificación de Funcionalidad: Auto-refresco del Sidebar ante cambios de proyecto

- **Versión:** 1.0
- **Fecha:** 2026-08-25
- **Repositorio:** `aurora-flowboard-web` (React + TypeScript + Vite + Zustand + React Query + Tailwind v4)
- **Estado:** Locked — todas las Open Questions resueltas, listo para `/writing-plans`
- **Área afectada:** `src/app/layout/Sidebar.tsx`, `src/features/auth/hooks/`, `src/features/projects/hooks/`

---

## 1. Overview

El Sidebar muestra la lista de proyectos del usuario (con su `GlowDot` de estado) y varios contadores
(`projects`, `members`, `inboxUnread`, `myOpenIssues`). Hoy esos datos se cargan **una sola vez por
sesión** y quedan congelados: ni la creación de un proyecto ni el alta/baja de miembros ni el cambio
de estado se reflejan sin recargar la página manualmente (F5).

Esta especificación define el comportamiento esperado del Sidebar para que refleje siempre el estado
real del backend después de dos momentos: **(A)** creación de un proyecto y **(B)** actualización de la
información del proyecto, con foco explícito en **alta/baja de miembros**.

---

## 2. Estado actual verificado en el código

> Verificado por lectura directa del código el 2026-08-25. **`CLAUDE.md` está desactualizado en este
> punto** y debe corregirse como parte de esta entrega.

| Afirmación previa (`CLAUDE.md` / contexto) | Realidad en el código |
|---|---|
| "El Sidebar carga proyectos vía `useProjects`, query key `['projects']`" | **Falso.** `src/app/layout/Sidebar.tsx:102` usa `useMySummary()` → query key `['my-summary']` |
| "El Sidebar sólo muestra Active/Draft/OnHold" | **Falso.** Renderiza *todos* los proyectos que devuelve el endpoint, sin filtro en cliente. El mapa `API_STATUS_MAP` sólo cubre `Active`/`Maintenance`/`Completed`/`Archived` |
| "`useCreateProject` invalida `['projects']`, con eso el Sidebar ya se actualiza" | **Falso.** Invalida `['projects']`, que el Sidebar no consume. El momento A **también está roto** |
| "No sabemos si existe mutación de miembros" | **Sí existe:** `useAddProjectMember.ts` y `useRemoveProjectMember.ts`, ambas invalidan `['project', projectId]` y `['projects']` — ninguna toca `['my-summary']` |

### 2.1 Causa raíz

```
useMySummary()  →  queryKey: ['my-summary'],  staleTime: Infinity
```

Dos defectos combinados:

1. **Ninguna mutación del repositorio invalida `['my-summary']`.** Verificado con búsqueda global de
   `invalidateQueries` / `setQueryData`: la única escritura sobre esa key es
   `useLogin.ts:18` → `queryClient.setQueryData(['my-summary'], summary)`.
2. **`staleTime: Infinity`** hace que la query nunca se considere obsoleta, por lo que ni el remount
   del Sidebar, ni la navegación entre rutas, ni un `invalidateQueries` sin `refetchType` adecuado
   provocan un refetch espontáneo. El dato queda fijo desde el login hasta el logout o el F5.

### 2.2 Momentos afectados (resumen)

| Momento | Mutación | Invalida hoy | ¿Sidebar se actualiza? |
|---|---|---|---|
| A — Crear proyecto | `useCreateProject` | `['projects']` | **No** |
| B1 — Agregar miembro | `useAddProjectMember` | `['project', id]`, `['projects']` | **No** |
| B2 — Quitar miembro | `useRemoveProjectMember` | `['project', id]`, `['projects']` | **No** |
| C — Cambiar estado (bonus, mismo defecto) | `useUpdateProjectStatus` | `['projects']` | **No** (el `GlowDot` queda con el color viejo) |

---

## 3. Goal y criterios de éxito

**Goal:** el Sidebar es un espejo confiable del estado del workspace del usuario. Cualquier cambio que
altere la lista de proyectos visibles, su nombre, color, estado o los contadores del header se refleja
sin intervención manual.

**Criterios de éxito:**

- 0 casos en que el usuario deba recargar la página para ver un proyecto recién creado.
- El alta/baja de miembros actualiza los contadores del Sidebar dentro de los 2 s posteriores al toast
  de confirmación de la mutación.
- No se introducen refetches innecesarios: el Sidebar no debe refetchear en cada navegación ni en cada
  focus de ventana.

---

## 4. User Stories

- **US-1** — Como **usuario autenticado**, quiero que un proyecto que acabo de crear aparezca
  inmediatamente en la lista de proyectos del Sidebar, para poder navegar a él desde ahí sin recargar.
- **US-2** — Como **admin/owner de proyecto**, quiero que al agregar o quitar un miembro los contadores
  del Sidebar (`N projects · M members`) reflejen el cambio, para confiar en que la acción se aplicó.
- **US-3** — Como **usuario que se quita a sí mismo de un proyecto**, quiero que ese proyecto desaparezca
  de mi Sidebar, para no ver ni navegar a proyectos a los que ya no pertenezco.
- **US-4** — Como **usuario que cambia el estado de un proyecto**, quiero que el `GlowDot` y el estilo de
  la entrada del Sidebar reflejen el nuevo estado, para tener consistencia visual entre vistas.
- **US-5** — Como **usuario**, quiero que estas actualizaciones ocurran en segundo plano sin que la lista
  del Sidebar parpadee, colapse o se vacíe momentáneamente.

---

## 5. Requisitos Funcionales

### RF-1 — El Sidebar debe poder refrescarse

`useMySummary` debe dejar de usar `staleTime: Infinity`. Se elimina la opción `staleTime` del hook para
que herede el default global del `QueryClient` (`1000 * 60 * 5`, ver `src/shared/lib/query-client.ts`),
de modo que una invalidación produzca un refetch efectivo. **Decisión cerrada — ver OQ-4.**

### RF-2 — La query key del Sidebar debe ser invalidable de forma centralizada

Debe existir un punto único y reutilizable para invalidar la fuente del Sidebar (p. ej. una constante
de query key exportada y/o un hook `useRefreshMySummary()`), de modo que las mutaciones no repitan el
literal `['my-summary']` y no se vuelva a olvidar en futuras mutaciones.

### RF-3 — Momento A: creación de proyecto

`useCreateProject` debe invalidar, además de `['projects']`, la fuente del Sidebar. Tras la creación
exitosa el nuevo proyecto debe aparecer en la lista del Sidebar y `counts.projects` debe incrementarse.

> Nota: el flujo actual navega a `/projects/:guid/board` tras crear
> (`CreateProjectModal.tsx`, `handleSubmit`). El Sidebar persiste entre rutas porque vive en
> `ProtectedLayout`, por lo que **no** se remonta y la navegación por sí sola no arregla nada.

### RF-4 — Momento B1: agregar miembro

`useAddProjectMember` debe invalidar la fuente del Sidebar en `onSuccess`, además de las keys que ya
invalida (`['project', projectId]`, `['projects']`).

### RF-5 — Momento B2: quitar miembro

`useRemoveProjectMember` debe invalidar la fuente del Sidebar en `onSuccess`, además de las keys
actuales.

### RF-6 — Auto-baja del proyecto

Si el usuario autenticado es el miembro removido, tras el refresco el proyecto **debe desaparecer** de
la lista del Sidebar (el backend deja de devolverlo en `/v1/flowboard/users/my-summary`). El frontend no
debe filtrar por su cuenta: se limita a renderizar lo que devuelve el endpoint.

### RF-7 — Momento C: cambio de estado del proyecto

`useUpdateProjectStatus` debe invalidar la fuente del Sidebar en `onSettled`, para que el `GlowDot` y el
estilo atenuado de `maintenance` queden consistentes con la vista de proyectos.

### RF-8 — Refresco silencioso

Durante el refetch en background el Sidebar debe seguir mostrando los datos previos. No debe mostrar
skeleton, spinner ni lista vacía. React Query ya provee esto vía `keepPreviousData` implícito al
invalidar una query con datos en caché; la implementación no debe romperlo leyendo `isLoading` para
ocultar la lista.

### RF-9 — Tolerancia a fallo del refetch

Si el refetch de la fuente del Sidebar falla (red caída, 5xx), el Sidebar conserva los últimos datos
válidos y **no** muestra un toast de error adicional. La mutación de negocio ya emitió su propio toast
de éxito/error; un segundo toast por el refresco sería ruido.

### RF-10 — Sesión limpia

Al hacer logout, `auth.store.ts` debe ejecutar `queryClient.clear()` (import directo del singleton de
`src/shared/lib/query-client.ts`) para vaciar **toda** la caché de React Query, no sólo `['my-summary']`,
de modo que un login posterior con otro usuario no muestre momentáneamente datos del usuario anterior
en el Sidebar ni en ninguna otra vista. **Decisión cerrada — ver OQ-5.**

### RF-11 — Corrección de documentación

`CLAUDE.md` debe actualizarse: el Sidebar consume `useMySummary` (`['my-summary']`,
`GET /v1/flowboard/users/my-summary`), no `useProjects`; y no aplica filtro cliente por estado.

---

## 6. UI/UX Behavior

| Escenario | Comportamiento esperado |
|---|---|
| Refetch en curso | Lista y contadores previos visibles, sin cambio visual. Sin spinner. |
| Proyecto nuevo aparece | Se inserta en la posición que devuelve el backend, sin animación obligatoria. `counts.projects` se incrementa. |
| Proyecto desaparece (auto-baja) | La entrada se retira de la lista. Si el usuario está parado en `/projects/:id/board` de ese proyecto, ver Open Question OQ-3. |
| Sidebar colapsado (`collapsed`) | Mismo comportamiento; sólo se ven los `GlowDot`. Los contadores del header y de "All projects" están ocultos y no requieren tratamiento especial. |
| Lista vacía tras el refresco | El bloque "Projects" muestra únicamente el enlace "All projects" con contador `0`. No se requiere empty state textual adicional en esta versión. |
| Fallo del refetch | Sin cambio visual, sin toast. |

---

## 7. Data Requirements

Fuente única: `GET /v1/flowboard/users/my-summary` → `MySummaryResponse`
(`src/features/auth/types/auth.types.ts`).

```
MySummaryResponse
├── me: { userId, fullName, initials, email, role }
├── counts: { projects, members, inboxUnread, myOpenIssues }
└── projects: MySummaryProject[]   // { projectId, name, color, status }
```

- `status` es `ProjectApiStatus` = `Active | Maintenance | Completed | Archived`.
- `color` se resuelve con `resolveSwatchColor()` de `src/shared/constants/colors.ts`.
- **No se requieren campos nuevos, endpoints nuevos ni variables de entorno nuevas.**
- **No se requiere ningún componente shadcn nuevo.**
- **No se requiere ningún slice nuevo de Zustand.** El estado sigue siendo server state de React Query.

---

## 8. Non-Functional Requirements

- **Rendimiento:** máximo **un** refetch de `my-summary` por mutación exitosa. Prohibido polling o
  `refetchInterval`. `refetchOnWindowFocus` sigue en `false` (default global).
- **Consistencia:** la invalidación ocurre siempre en `onSuccess`/`onSettled` de la mutación, nunca en
  el componente que la dispara, para que cualquier consumidor futuro de la mutación herede el
  comportamiento.
- **Accesibilidad:** la actualización de la lista no debe robar el foco. Si el usuario tiene el foco en
  un enlace del Sidebar, éste debe conservarse (las `key` de React son `project.id`, lo cual ya lo
  garantiza mientras no se cambien).
- **Seguridad:** ningún cambio en el manejo del JWT ni en `api-client`. El endpoint ya es autenticado.
- **Regresión:** no debe alterarse el comportamiento optimista existente de `useUpdateProjectStatus`
  sobre `['projects']`.

---

## 9. Acceptance Criteria

### Momento A — Creación de proyecto (**comportamiento NO existente, requiere fix**)

**AC-1**
- **Dado** un usuario autenticado con N proyectos en el Sidebar
- **Cuando** crea un proyecto exitosamente desde `CreateProjectModal`
- **Entonces** el nuevo proyecto aparece en la lista del Sidebar sin recargar la página
- **Y** el contador del header pasa de `N projects` a `N+1 projects`
- **Y** el contador junto a "All projects" también pasa a `N+1`.

**AC-2**
- **Dado** que la creación falla (error de API)
- **Cuando** se muestra el error en el modal
- **Entonces** el Sidebar no cambia y no se dispara ningún refetch de `my-summary`.

### Momento B — Actualización de información del proyecto / membresía

**AC-3 — Agregar miembro**
- **Dado** un usuario viendo `ProjectDetailsModal` de un proyecto con `M` miembros totales entre sus
  proyectos
- **Cuando** agrega un miembro que no pertenecía a ninguno de sus proyectos y aparece el toast "Member
  added"
- **Entonces** la fuente del Sidebar se invalida y se refetchea una vez
- **Y** el contador del header pasa de `M members` a `M+1 members` (verificado contra backend real: alta
  de un miembro nuevo en el proyecto pasó `counts.members` de 3 a 4)
- **Y** la lista de proyectos del Sidebar no parpadea ni se vacía durante el refetch.

**AC-4 — Quitar miembro (otro usuario)**
- **Dado** un usuario que remueve a **otro** miembro del proyecto, con `M` miembros totales antes de la
  acción
- **Cuando** aparece el toast "Member removed"
- **Entonces** el contador pasa de `M members` a `M-1 members` (verificado contra backend real: baja de
  un miembro pasó `counts.members` de 4 a 3)
- **Y** el proyecto **permanece** en la lista del Sidebar del actor.

**AC-5 — Quitar miembro (uno mismo)**
- **Dado** un usuario que se remueve a sí mismo de un proyecto en el que es miembro
- **Cuando** la mutación tiene éxito
- **Entonces** tras el refetch ese proyecto **ya no aparece** en la lista del Sidebar
- **Y** el contador `N projects` decrece en 1.

**AC-6 — Un solo refetch**
- **Dado** cualquier mutación de miembros
- **Cuando** se completa con éxito
- **Entonces** se observa exactamente **una** petición `GET /v1/flowboard/users/my-summary` en la
  pestaña Network, no dos ni más.

**AC-7 — Fallo del refetch**
- **Dado** que la mutación de miembro tuvo éxito pero el refetch de `my-summary` devuelve 500
- **Cuando** finaliza el intento
- **Entonces** el Sidebar sigue mostrando los datos previos
- **Y** no se muestra ningún toast de error adicional al de la mutación.

**AC-8 — Mutación fallida no refresca**
- **Dado** que `addProjectMember` falla y aparece el toast "Failed to add member"
- **Entonces** no se dispara ningún refetch de `my-summary`.

### Momento C — Cambio de estado (incluido por compartir la misma causa raíz)

**AC-9**
- **Dado** un proyecto `Active` visible en el Sidebar con su `GlowDot` de color
- **Cuando** el usuario lo pasa a `Maintenance` desde la vista de proyectos
- **Entonces** el `GlowDot` del Sidebar cambia al estilo gris de `maintenance`
- **Y** el texto de la entrada pasa a la opacidad atenuada (`text-sidebar-foreground/50`).

### Transversales

**AC-10 — Sin refetch espurio**
- **Dado** un usuario navegando entre `/dashboard`, `/projects` y `/work-items` sin ejecutar mutaciones
- **Entonces** no se dispara ninguna petición adicional a `my-summary` dentro de la ventana de
  `staleTime` configurada.

**AC-11 — Cambio de usuario**
- **Dado** un usuario A que hace logout y un usuario B que hace login en la misma pestaña
- **Entonces** el Sidebar nunca muestra proyectos de A tras el login de B, ni siquiera por un frame.

---

## 10. Integration Points

| Punto | Detalle |
|---|---|
| `src/app/layout/Sidebar.tsx` | Consumidor. No debería requerir cambios funcionales salvo lo relativo a RF-8. |
| `src/features/auth/hooks/useMySummary.ts` | `staleTime` (RF-1) y exposición de la query key (RF-2). |
| `src/features/auth/hooks/useLogin.ts` | Ya hace `setQueryData(['my-summary'], …)`; debe seguir usando la key centralizada. |
| `src/app/store/auth.store.ts` (`logout()`) | RF-10: `queryClient.clear()`. Requiere importar el `queryClient` singleton desde `src/shared/lib/query-client.ts`. |
| `src/features/projects/hooks/useCreateProject.ts` | RF-3. |
| `src/features/projects/hooks/useAddProjectMember.ts` | RF-4. |
| `src/features/projects/hooks/useRemoveProjectMember.ts` | RF-5. |
| `src/features/projects/hooks/useUpdateProjectStatus.ts` | RF-7. |
| `ProtectedLayout` (`src/app/router/protected-layout.tsx`) | El Sidebar vive aquí y persiste entre rutas: la navegación no lo remonta. |
| Backend | Sin cambios. Se asume que `my-summary` ya devuelve datos frescos y coherentes tras las mutaciones. Ver OQ-1. |

---

## 11. Permissions & Roles

- Toda la funcionalidad vive dentro de rutas protegidas por `ProtectedLayout`; requiere sesión activa.
- No se introducen reglas de autorización nuevas. La visibilidad de proyectos en el Sidebar la define
  el backend en `my-summary`; el frontend no toma decisiones de permisos.
- Las capacidades de agregar/quitar miembros ya están gobernadas por la UI existente
  (`ProjectDetailsModal`, prop `canRemove`) y por el backend. Fuera del alcance de esta spec.

---

## 12. Out of Scope

- Actualizaciones en tiempo real por WebSocket / SSE / polling.
- Actualización optimista del Sidebar (insertar el proyecto en caché antes de la respuesta del backend).
- Refresco de los contadores `inboxUnread` y `myOpenIssues` ante eventos propios de Inbox / My Issues.
- Reordenamiento, favoritos, agrupación o filtrado configurable de proyectos en el Sidebar.
- Cambios en el layout, estilos o interacción del Sidebar más allá de lo estrictamente necesario.
- Sincronización entre pestañas del navegador.
- Cambios en el endpoint `my-summary` o creación de endpoints nuevos.
- Refresco del Sidebar ante edición de nombre/color/descripción de proyecto: no existe hoy una mutación
  de edición de esos campos en el repositorio. Si se agrega, deberá adherir a RF-2.
- Manejo especial de `/projects/:id/board` cuando el usuario se auto-remueve del proyecto que está
  viendo (sin redirección ni estado de "sin acceso" en v1.0 — ver OQ-3, resuelto).

---

## 13. Dependencies

- `@tanstack/react-query` (ya instalado) — `invalidateQueries`, configuración de `staleTime`.
- `GET /v1/flowboard/users/my-summary` — endpoint existente, sin cambios.
- `sonner` — sólo para los toasts ya existentes de las mutaciones; esta spec no agrega toasts.
- Sin dependencias nuevas de npm. Sin componentes shadcn nuevos. Sin variables de entorno nuevas.

---

## 14. Open Questions

- ~~**OQ-1 — Consistencia del backend**~~ **RESUELTO (verificado contra backend real, 2026-08-25).** Se
  hizo login contra `https://localhost:7066`, se agregó un miembro (`POST
  /projects/:id/members`, respuesta `202 Accepted`) y se consultó `GET /my-summary` inmediatamente
  después: `counts.members` ya reflejaba el nuevo valor (3→4), sin lag observable. Se repitió la prueba
  con la baja del mismo miembro (`DELETE /projects/:id/members/:userId`, también `202`) y `my-summary`
  volvió a 3 de inmediato. Aunque los endpoints de membresía responden `202` (indicio de procesamiento
  interno asíncrono), la proyección que alimenta `my-summary` ya está actualizada para cuando la
  respuesta HTTP vuelve. **No se requiere delay ni reintento antes del refetch.** No se repitió la
  prueba para `POST /projects` (no existe endpoint de borrado de proyectos para revertir el dato de
  prueba), pero al compartir el mismo mecanismo de proyección se asume el mismo comportamiento con alta
  confianza.
- ~~**OQ-2 — Semántica de `counts.members`**~~ **RESUELTO (verificado contra backend real,
  2026-08-25).** `counts.members` es la **suma de miembros de los proyectos del usuario**, no el total
  de usuarios del workspace: con 1 proyecto (3 miembros) y 4 usuarios activos en `/users` del workspace,
  `counts.members` valía 3, no 4. Al agregar un 4º usuario (no miembro de ningún proyecto del actor) al
  proyecto, pasó a 4. **AC-3/AC-4 quedan confirmados tal como están redactados** ("el contador cambia",
  no sólo "se revalida").
- ~~**OQ-3 — Auto-baja estando en el board**~~ **RESUELTO (decisión de producto, 2026-08-25).** Queda
  **fuera de alcance de v1.0**. Si el usuario se remueve a sí mismo del proyecto que está viendo en
  `/projects/:id/board`, la vista no cambia de forma proactiva; se deja tal cual hasta que el backend
  responda 403/404 en la próxima acción del usuario en esa página. Se documentará como spec aparte si se
  decide abordarlo.
- ~~**OQ-4 — Alcance de `staleTime`**~~ **RESUELTO (decisión de producto, 2026-08-25).** `useMySummary`
  usará **5 minutos**, igual al default global del `QueryClient` (`src/shared/lib/query-client.ts`).
  Basta con eliminar la opción `staleTime: Infinity` del hook para que herede el default; no se
  mantiene un valor especial ni una estrategia de invalidación agresiva con `refetchType: 'all'`.
- ~~**OQ-5 — Limpieza en logout**~~ **RESUELTO (decisión de producto, 2026-08-25).** `logout()` en
  `auth.store.ts` ejecutará **`queryClient.clear()` completo** (import directo del singleton exportado
  por `src/shared/lib/query-client.ts` — confirmado viable, no requiere contexto de React), en vez de
  una remoción selectiva de `['my-summary']`.

---

## 15. Final Assumptions (locked)

1. La fuente de verdad del Sidebar es `['my-summary']`, no `['projects']`. **Confirmado por código.**
2. El mecanismo de actualización es invalidación de React Query, no tiempo real ni polling.
3. `staleTime: Infinity` en `useMySummary` se reemplaza por un valor finito (recomendado: 5 min).
4. El cambio de estado del proyecto se incluye en el alcance por compartir la misma causa raíz.
5. Agregar/quitar un miembro ajeno afecta el summary del actor principalmente vía contadores; sujeto a
   OQ-2.
6. Auto-removerse de un proyecto hace desaparecer la entrada del Sidebar, según lo que devuelva el
   backend.
7. El refresco es silencioso: sin skeleton, spinner ni parpadeo.
8. No hay actualización optimista del Sidebar; se acepta la latencia de un refetch.
9. Un fallo de refetch conserva los datos previos y no emite toast adicional.
10. El filtrado de qué proyectos son visibles es responsabilidad exclusiva del backend.
11. `CLAUDE.md` se corrige como parte de la entrega (RF-11).
12. `my-summary` es consistente de inmediato tras alta/baja de miembros (OQ-1 resuelto contra backend
    real); un refetch inmediato tras la mutación es seguro, sin delay ni reintento.
13. `counts.members` es la suma de miembros de los proyectos del usuario, no el total del workspace
    (OQ-2 resuelto contra backend real); AC-3/AC-4 esperan que el número cambie, no sólo que se
    revalide.
14. La auto-baja del board activo (`/projects/:id/board`) no se maneja en v1.0 (OQ-3 resuelto).
15. `useMySummary` usa el `staleTime` default global (5 min), sin valor especial (OQ-4 resuelto).
16. `logout()` limpia toda la caché de React Query con `queryClient.clear()`, no sólo `['my-summary']`
    (OQ-5 resuelto).
