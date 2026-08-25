# Sidebar Auto-Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El Sidebar (`src/app/layout/Sidebar.tsx`) refleja sin recargar la página la creación de un proyecto y los cambios de información de proyecto (alta/baja de miembros, cambio de estado), en vez de quedar congelado desde el login hasta el logout/F5.

**Architecture:** El Sidebar consume `useMySummary()` → React Query key `['my-summary']`. Hoy esa query usa `staleTime: Infinity` y ninguna mutación la invalida. La solución es puramente de configuración de React Query: (1) bajar el `staleTime` a un valor finito para que una invalidación produzca refetch real, (2) centralizar la query key en una constante exportada, y (3) hacer que cada mutación relevante (`useCreateProject`, `useAddProjectMember`, `useRemoveProjectMember`, `useUpdateProjectStatus`) invalide esa key además de las que ya invalida. Sin backend nuevo, sin estado nuevo, sin componentes nuevos.

**Tech Stack:** React 19 + TypeScript + Vite, `@tanstack/react-query` v5, Zustand v5 (con `persist`), `sonner` para toasts. Sin test runner instalado en el repo (no hay `vitest`/`jest` en `package.json`) — la verificación se hace con `pnpm build` (type-check real vía `tsc -b`), `pnpm lint`, y round-trips manuales contra el backend local real (`curl`) y/o navegador, siguiendo el patrón ya validado en este proyecto.

**Spec:** `docs/specs/sidebar-auto-refresh.spec.md` (estado: Locked)

## Global Constraints

- Package manager: **pnpm** exclusivamente (`pnpm add`, nunca `npm`/`yarn`).
- Cero dependencias npm nuevas, cero componentes shadcn nuevos, cero slices nuevos de Zustand (spec §7, §13).
- `useMySummary` deja de usar `staleTime: Infinity`; hereda el default global del `QueryClient` (`1000 * 60 * 5`, ver `src/shared/lib/query-client.ts`). No se introduce un valor especial por-query (spec RF-1, OQ-4 resuelto).
- Toda invalidación de la fuente del Sidebar ocurre en `onSuccess`/`onSettled` de la mutación correspondiente, nunca en el componente que la dispara (spec §8 NFR "Consistencia").
- Máximo **un** refetch de `my-summary` por mutación exitosa. Prohibido `refetchInterval`/polling. `refetchOnWindowFocus` sigue en `false` (default global, spec §8 NFR "Rendimiento").
- Sin actualización optimista del Sidebar: se acepta la latencia de un refetch (spec §12 Out of Scope).
- Sin manejo especial de auto-baja del proyecto abierto en `/projects/:id/board` (spec §12, OQ-3 resuelto — fuera de alcance v1.0).
- `logout()` limpia **toda** la caché de React Query con `queryClient.clear()`, no una remoción selectiva (spec RF-10, OQ-5 resuelto).
- No hay test runner en este repo. Cada tarea se verifica con `pnpm build` + `pnpm lint` (compilación/tipos) y, cuando la tarea cambia comportamiento observable, con una verificación manual real (curl contra el backend local o navegador) — nunca con un test unitario inventado que no correría.

## Backend local para verificación manual

- Backend real en `https://localhost:7066`, montado bajo `/api` (el frontend lo consume vía proxy de Vite con `VITE_API_BASE_URL=/api`). Debe estar corriendo aparte del frontend.
- Login: `POST https://localhost:7066/api/v1/flowboard/auth/login` con body `{"email":"gerardo.garnica@gmail.com","password":"admin123"}` (cuenta seed de desarrollo local, no es un secreto real). Devuelve `accessToken` en la respuesta JSON.
- `GET https://localhost:7066/api/v1/flowboard/users/my-summary` con header `Authorization: Bearer <accessToken>` devuelve `{ me, counts: { projects, members, inboxUnread, myOpenIssues }, projects: [{ projectId, name, color, status }] }`.
- Proyecto de prueba existente al momento de escribir este plan: **"Test Manager"** (`projectId` puede variar; obtenerlo de `my-summary` o de `GET /v1/flowboard/projects`), con miembros `Gerardo Garnica` (Admin), `Marco Blanco` (Developer), `Pepe Tester` (QA). Usuario adicional disponible para pruebas de alta/baja de miembro sin afectar el estado base: **Mario Rico** (`mario@rico.com`), que normalmente NO es miembro de "Test Manager" — usarlo para las pruebas de alta/baja y dejarlo removido al terminar, igual que se encontró.
- Arrancar el frontend con `pnpm dev` (puerto por defecto `5173`; si está ocupado, Vite auto-incrementa).

---

### Task 1: Centralizar la query key de `my-summary` y quitar `staleTime: Infinity`

**Files:**
- Modify: `src/features/auth/hooks/useMySummary.ts`
- Modify: `src/features/auth/hooks/useLogin.ts`

**Interfaces:**
- Consumes: nada de tareas previas (primera tarea).
- Produces: `MY_SUMMARY_QUERY_KEY: readonly ["my-summary"]`, exportado desde `src/features/auth/hooks/useMySummary.ts`. Todas las tareas siguientes importan esta constante en vez de repetir el literal `['my-summary']`.

- [ ] **Step 1: Exportar la query key centralizada y quitar el `staleTime` fijo**

Reemplazar el contenido completo de `src/features/auth/hooks/useMySummary.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { getMySummary } from '../services/auth.service'

export const MY_SUMMARY_QUERY_KEY = ['my-summary'] as const

export function useMySummary() {
  return useQuery({
    queryKey: MY_SUMMARY_QUERY_KEY,
    queryFn: getMySummary,
  })
}
```

Nota: se elimina la línea `staleTime: Infinity` por completo (no se reemplaza por un valor explícito) para que la query herede el default global del `QueryClient` (`1000 * 60 * 5`, ya configurado en `src/shared/lib/query-client.ts`).

- [ ] **Step 2: Usar la constante centralizada en `useLogin`**

En `src/features/auth/hooks/useLogin.ts`, agregar el import y reemplazar el literal:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { getMySummary, login } from '../services/auth.service'
import { MY_SUMMARY_QUERY_KEY } from './useMySummary'

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      const summary = await getMySummary()
      queryClient.setQueryData(MY_SUMMARY_QUERY_KEY, summary)
      setUser({
        id: summary.me.userId,
        fullName: summary.me.fullName,
        initials: summary.me.initials,
        email: summary.me.email,
        role: summary.me.role,
      })
      navigate('/dashboard')
    },
  })
}
```

- [ ] **Step 3: Verificar que compila sin errores de tipos**

Run: `pnpm build`
Expected: termina sin errores (el `as const` en `MY_SUMMARY_QUERY_KEY` produce una tupla `readonly ["my-summary"]`, compatible con el tipo `QueryKey` de React Query en ambos usos).

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/hooks/useMySummary.ts src/features/auth/hooks/useLogin.ts
git commit -m "Centralize my-summary query key and drop fixed staleTime on useMySummary"
```

---

### Task 2: Momento A — invalidar `my-summary` al crear un proyecto

**Files:**
- Modify: `src/features/projects/hooks/useCreateProject.ts`

**Interfaces:**
- Consumes: `MY_SUMMARY_QUERY_KEY` de `@/features/auth/hooks/useMySummary` (Task 1).
- Produces: nada nuevo — `useCreateProject()` conserva su firma actual (`useMutation` sin argumentos, `mutationFn: (payload: CreateProjectRequest) => Promise<string>`).

- [ ] **Step 1: Invalidar la fuente del Sidebar además de `['projects']`**

Reemplazar el contenido de `src/features/projects/hooks/useCreateProject.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { createProject } from '../services/project.service'
import type { CreateProjectRequest } from '../types/project.types'

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
    },
  })
}
```

- [ ] **Step 2: Verificar compilación**

Run: `pnpm build`
Expected: sin errores.

- [ ] **Step 3: Verificación manual contra el backend real (AC-1, AC-2 de la spec)**

Con el backend en `https://localhost:7066` corriendo y `pnpm dev` levantado:

1. Login en la app con `gerardo.garnica@gmail.com` / `admin123`.
2. Anotar el contador `N projects` que muestra el Sidebar.
3. Crear un proyecto nuevo desde el botón "+" del Sidebar (`CreateProjectModal`), con datos válidos.
4. **Esperado (AC-1):** sin recargar la página, el proyecto nuevo aparece en la lista del Sidebar y el contador pasa a `N+1`.
5. Abrir las DevTools → pestaña Network, filtrar por `my-summary`, y confirmar que se disparó exactamente **una** petición `GET` adicional justo después del `POST /v1/flowboard/projects` exitoso.
6. (AC-2, opcional) Provocar un fallo de creación (por ejemplo, dejar un campo requerido vacío si la validación lo permite enviar, o cortar la red antes de confirmar) y verificar que no aparece ninguna petición nueva a `my-summary`.

- [ ] **Step 4: Commit**

```bash
git add src/features/projects/hooks/useCreateProject.ts
git commit -m "Refresh Sidebar summary after creating a project"
```

---

### Task 3: Momento B — invalidar `my-summary` al agregar/quitar un miembro de proyecto

**Files:**
- Modify: `src/features/projects/hooks/useAddProjectMember.ts`
- Modify: `src/features/projects/hooks/useRemoveProjectMember.ts`

**Interfaces:**
- Consumes: `MY_SUMMARY_QUERY_KEY` de `@/features/auth/hooks/useMySummary` (Task 1).
- Produces: nada nuevo — ambos hooks conservan su firma actual (`useAddProjectMember()` → `mutate({ projectId, userId, role })`; `useRemoveProjectMember()` → `mutate({ projectId, userId })`).

- [ ] **Step 1: `useAddProjectMember` invalida la fuente del Sidebar en `onSuccess`**

Reemplazar el contenido de `src/features/projects/hooks/useAddProjectMember.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { addProjectMember } from '../services/project.service'
import type { ProjectRole } from '../types/project.types'

interface AddMemberVars {
  projectId: string
  userId: string
  role: ProjectRole
}

export function useAddProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId, role }: AddMemberVars) =>
      addProjectMember(projectId, { userId, role }),

    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
      toast.success('Member added')
    },

    onError: () => {
      toast.error('Failed to add member')
    },
  })
}
```

- [ ] **Step 2: `useRemoveProjectMember` invalida la fuente del Sidebar en `onSuccess`**

Reemplazar el contenido de `src/features/projects/hooks/useRemoveProjectMember.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { removeProjectMember } from '../services/project.service'

interface RemoveMemberVars {
  projectId: string
  userId: string
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId }: RemoveMemberVars) => removeProjectMember(projectId, userId),

    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
      toast.success('Member removed')
    },

    onError: () => {
      toast.error('Failed to remove member')
    },
  })
}
```

- [ ] **Step 3: Verificar compilación**

Run: `pnpm build`
Expected: sin errores.

- [ ] **Step 4: Verificación manual contra el backend real (AC-3 a AC-8 de la spec)**

Con el backend y `pnpm dev` corriendo, logueado como `gerardo.garnica@gmail.com`:

1. Anotar el contador `M members` del Sidebar (header).
2. Abrir el proyecto "Test Manager" → `ProjectDetailsModal` → agregar a **Mario Rico** como miembro.
3. **Esperado (AC-3):** al aparecer el toast "Member added", sin recargar, el contador del Sidebar pasa de `M` a `M+1`; la lista de proyectos no parpadea ni se vacía durante el refetch.
4. En DevTools → Network, confirmar exactamente **una** petición `GET my-summary` tras el `POST members` (AC-6).
5. Quitar a un miembro **distinto de uno mismo** (por ejemplo, remover a Mario Rico de nuevo).
6. **Esperado (AC-4):** el contador pasa de `M+1` a `M`; el proyecto sigue apareciendo en el Sidebar del actor (Gerardo no se quitó a sí mismo).
7. (AC-5, requiere una cuenta secundaria) Si se dispone de una segunda cuenta que sea miembro de un proyecto, loguearse con ella, quitarse a sí misma del proyecto, y verificar que ese proyecto desaparece del Sidebar y `N projects` decrece en 1. Si no hay cuenta secundaria disponible, documentar esta verificación como pendiente en el resumen final en vez de omitirla silenciosamente.
8. (AC-7) Verificar en Network que si la petición `GET my-summary` posterior a la mutación fallara (simulable cortando la red justo después del toast de éxito), el Sidebar conserva los datos previos y no aparece un segundo toast de error.
9. (AC-8) Provocar que `addProjectMember` falle (por ejemplo, reintentar agregar a un usuario que ya es miembro, si el backend lo rechaza) y confirmar que aparece el toast de error y que **no** se dispara ninguna petición nueva a `my-summary`.
10. Dejar el estado de "Test Manager" igual a como estaba antes de la prueba (Mario Rico removido).

- [ ] **Step 5: Commit**

```bash
git add src/features/projects/hooks/useAddProjectMember.ts src/features/projects/hooks/useRemoveProjectMember.ts
git commit -m "Refresh Sidebar summary after adding or removing a project member"
```

---

### Task 4: Momento C — invalidar `my-summary` al cambiar el estado de un proyecto

**Files:**
- Modify: `src/features/projects/hooks/useUpdateProjectStatus.ts`

**Interfaces:**
- Consumes: `MY_SUMMARY_QUERY_KEY` de `@/features/auth/hooks/useMySummary` (Task 1).
- Produces: nada nuevo — `useUpdateProjectStatus()` conserva su firma actual (`mutate({ projectId, status })`), incluyendo el update optimista existente sobre `['projects']` (no se toca).

- [ ] **Step 1: Invalidar la fuente del Sidebar en `onSettled`**

Reemplazar el contenido de `src/features/projects/hooks/useUpdateProjectStatus.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { updateProjectStatus } from '../services/project.service'
import type { Project, ProjectApiStatus } from '../types/project.types'

interface UpdateStatusVars {
  projectId: string
  status: ProjectApiStatus
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, status }: UpdateStatusVars) =>
      updateProjectStatus(projectId, status),

    onMutate: async ({ projectId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previous = queryClient.getQueryData<Project[]>(['projects'])
      queryClient.setQueryData<Project[]>(['projects'], (old = []) =>
        old.map((p) => (p.projectId === projectId ? { ...p, status } : p)),
      )
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects'], context.previous)
      }
      toast.error('Failed to update status — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
    },
  })
}
```

Nota: se mantiene sin cambios el `onMutate`/`onError` optimista sobre `['projects']` — la spec (NFR "Regresión") prohíbe alterar ese comportamiento. Solo se agrega la invalidación de `MY_SUMMARY_QUERY_KEY` en `onSettled`.

- [ ] **Step 2: Verificar compilación**

Run: `pnpm build`
Expected: sin errores.

- [ ] **Step 3: Verificación manual contra el backend real (AC-9 de la spec)**

1. Con "Test Manager" en estado `Active`, observar su `GlowDot` en el Sidebar (color cian, texto con opacidad normal).
2. Desde `/projects`, cambiar su estado a `Maintenance`.
3. **Esperado:** sin recargar, el `GlowDot` del Sidebar cambia al estilo gris de `maintenance` y el texto de la entrada pasa a opacidad atenuada (`text-sidebar-foreground/50`).
4. Revertir el estado a `Active` para dejar el proyecto de prueba como estaba.

- [ ] **Step 4: Commit**

```bash
git add src/features/projects/hooks/useUpdateProjectStatus.ts
git commit -m "Refresh Sidebar summary after a project status change"
```

---

### Task 5: Sesión limpia — vaciar la caché de React Query en logout

**Files:**
- Modify: `src/app/store/auth.store.ts`

**Interfaces:**
- Consumes: `queryClient` (singleton) exportado desde `src/shared/lib/query-client.ts`.
- Produces: nada nuevo — `logout()` conserva su firma (`() => void`) y su contrato externo (limpia localStorage y `isAuthenticated`); solo agrega el efecto secundario de vaciar la caché de queries.

- [ ] **Step 1: Importar el `queryClient` singleton y llamar `queryClient.clear()` en `logout()`**

Reemplazar el contenido de `src/app/store/auth.store.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { ACCESS_TOKEN_KEY, AUTH_STORAGE_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { queryClient } from '@/shared/lib/query-client'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        queryClient.clear()
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
      // isAuthenticated is never persisted — deriving it here keeps it from
      // drifting out of sync with the stored user.
      merge: (persisted, current) => {
        const user = (persisted as Partial<AuthState> | undefined)?.user ?? null
        return { ...current, user, isAuthenticated: user !== null }
      },
    },
  ),
)
```

- [ ] **Step 2: Verificar compilación**

Run: `pnpm build`
Expected: sin errores. (Confirmar que no hay import circular: `query-client.ts` no importa nada de `auth.store.ts`, así que el import en un solo sentido es seguro.)

- [ ] **Step 3: Verificación manual (AC-11 de la spec)**

1. Login como `gerardo.garnica@gmail.com`, confirmar que el Sidebar muestra sus proyectos.
2. Hacer logout.
3. En DevTools → React Query Devtools (ya está instalado `@tanstack/react-query-devtools`), confirmar que la caché quedó vacía (0 queries) inmediatamente después del logout.
4. Loguearse de nuevo con la misma cuenta (no hay una segunda cuenta de prueba disponible en este entorno) y confirmar que el Sidebar carga los datos frescos vía una nueva petición `GET my-summary`, no desde caché stale.

- [ ] **Step 4: Commit**

```bash
git add src/app/store/auth.store.ts
git commit -m "Clear React Query cache on logout to prevent stale data across sessions"
```

---

### Task 6: Corregir la documentación del Sidebar en CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nada (cambio de documentación).
- Produces: nada.

- [ ] **Step 1: Corregir la descripción del Sidebar**

En `CLAUDE.md`, en la sección **Projects feature**, reemplazar el párrafo:

```
**Sidebar** dynamically loads real projects via `useProjects` and shows only Active/Draft/OnHold entries. Each entry renders a `GlowDot` styled by status. The "+" button opens `CreateProjectModal`.
```

por:

```
**Sidebar** dynamically loads the user's summary via `useMySummary` (`src/features/auth/hooks/useMySummary.ts`, query key `MY_SUMMARY_QUERY_KEY`, `GET /v1/flowboard/users/my-summary`) — not `useProjects`. It renders every project the endpoint returns, with no client-side status filter. Each entry renders a `GlowDot` styled by status. The "+" button opens `CreateProjectModal`. Mutations that change what the Sidebar displays (`useCreateProject`, `useAddProjectMember`, `useRemoveProjectMember`, `useUpdateProjectStatus`) must invalidate `MY_SUMMARY_QUERY_KEY` in addition to their feature-local keys.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Correct CLAUDE.md: Sidebar reads useMySummary, not useProjects"
```

---

### Task 7: Regresión final — sin refetch espurio y verificación end-to-end

**Files:** ninguno (solo verificación; no se esperan cambios de código en esta tarea salvo que la regresión encuentre un defecto).

**Interfaces:**
- Consumes: el resultado combinado de las Tasks 1–6.
- Produces: nada — tarea de cierre.

- [ ] **Step 1: Build y lint completos**

Run: `pnpm build`
Expected: sin errores de TypeScript en todo el proyecto.

Run: `pnpm lint`
Expected: sin errores nuevos (puede haber warnings preexistentes no relacionados; no introducir ninguno nuevo).

- [ ] **Step 2: Verificar RF-8/RF-9 (refresco silencioso y tolerancia a fallo) por lectura de código**

Confirmar en `src/app/layout/Sidebar.tsx` que la línea `const { data: summary } = useMySummary()` sigue sin desestructurar ni usar `isLoading`/`isPending`/`isFetching` para condicionar el render de la lista o los contadores (si alguna tarea anterior lo introdujo por error, quitarlo). El comportamiento default de React Query — mantener `data` con el valor previo mientras hay un refetch o un error en background — ya cumple RF-8 y RF-9 sin código adicional.

- [ ] **Step 3: Verificación manual de AC-10 (sin refetch espurio)**

Con `pnpm dev` corriendo y sesión iniciada:

1. Abrir DevTools → Network, filtrar por `my-summary`, limpiar el log.
2. Navegar entre `/dashboard`, `/projects` y `/work-items` varias veces, sin ejecutar ninguna mutación.
3. **Esperado:** no aparece ninguna petición nueva a `my-summary` (la query sigue "fresh" dentro de la ventana de 5 minutos de `staleTime`).

- [ ] **Step 4: Recorrido completo de los tres "momentos" en una sola sesión**

Repetir en secuencia, en la misma sesión de navegador, sin recargar la página entre pasos:
1. Crear un proyecto de prueba nuevo → confirmar que aparece en el Sidebar (Task 2).
2. Agregar y luego quitar un miembro de "Test Manager" → confirmar que el contador de miembros sube y baja (Task 3).
3. Cambiar el estado de "Test Manager" a `Maintenance` y de vuelta a `Active` → confirmar el cambio de `GlowDot` (Task 4).
4. Hacer logout y volver a loguearse → confirmar que el Sidebar carga limpio (Task 5).

Si algún paso falla, volver a la tarea correspondiente antes de dar el plan por terminado — no continuar a un commit de cierre con un paso fallido.

- [ ] **Step 5: Commit final (solo si Step 2 requirió un ajuste)**

```bash
git add -A
git commit -m "Fix regression found during Sidebar auto-refresh end-to-end verification"
```

Si no hubo ajustes, esta tarea no genera commit propio — el cierre queda registrado en el resumen entregado al usuario.
