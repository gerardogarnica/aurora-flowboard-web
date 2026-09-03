import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'
import { InboxPage } from '@/features/inbox/components/InboxPage'
import { PeoplePage } from '@/features/people/components/PeoplePage'
import { ProfilePage } from '@/features/profile/components/ProfilePage'
import { ProjectsPage } from '@/features/projects/components/ProjectsPage'
import { ProjectBoardPage } from '@/features/projects/components/ProjectBoardPage'
import { SavedViewsPage } from '@/features/saved-views/components/SavedViewsPage'
import { SettingsPage } from '@/features/settings/components/SettingsPage'
import { MyIssuesPage } from '@/features/work-items/components/MyIssuesPage'
import { ProtectedLayout } from './protected-layout'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'my-issues', element: <MyIssuesPage /> },
      { path: 'people', element: <PeoplePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <Navigate to="board" replace /> },
      { path: 'projects/:id/:tab', element: <ProjectBoardPage /> },
      { path: 'saved-views', element: <SavedViewsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
