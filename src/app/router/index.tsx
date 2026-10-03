import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { ProtectedLayout } from './protected-layout'
import { RouteFallback } from './route-fallback'

/**
 * Each page is its own chunk, fetched the first time its route matches. The router waits for
 * the chunk before committing a navigation, so the current page stays on screen meanwhile —
 * only the very first load shows `RouteFallback` (the `HydrateFallback` of the layout route).
 */
function lazyPage<M>(load: () => Promise<M>, pick: (module: M) => ComponentType) {
  return async () => ({ Component: pick(await load()) })
}

export const router = createBrowserRouter([
  {
    // Eager: it's the first screen without a session, so it shouldn't wait on a second request.
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    HydrateFallback: RouteFallback,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: 'dashboard',
        lazy: lazyPage(() => import('@/features/dashboard/components/DashboardPage'), (m) => m.DashboardPage),
      },
      { path: 'inbox', lazy: lazyPage(() => import('@/features/inbox/components/InboxPage'), (m) => m.InboxPage) },
      {
        path: 'my-issues',
        lazy: lazyPage(() => import('@/features/work-items/components/MyIssuesPage'), (m) => m.MyIssuesPage),
      },
      { path: 'people', lazy: lazyPage(() => import('@/features/people/components/PeoplePage'), (m) => m.PeoplePage) },
      {
        path: 'profile',
        lazy: lazyPage(() => import('@/features/profile/components/ProfilePage'), (m) => m.ProfilePage),
      },
      {
        path: 'projects',
        lazy: lazyPage(() => import('@/features/projects/components/ProjectsPage'), (m) => m.ProjectsPage),
      },
      { path: 'projects/:id', element: <Navigate to="board" replace /> },
      {
        path: 'projects/:id/:tab',
        lazy: lazyPage(() => import('@/features/projects/components/ProjectBoardPage'), (m) => m.ProjectBoardPage),
      },
      {
        path: 'saved-views',
        lazy: lazyPage(() => import('@/features/saved-views/components/SavedViewsPage'), (m) => m.SavedViewsPage),
      },
      {
        path: 'settings',
        lazy: lazyPage(() => import('@/features/settings/components/SettingsPage'), (m) => m.SettingsPage),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
