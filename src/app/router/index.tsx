import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'
import { ProjectsPage } from '@/features/projects/components/ProjectsPage'
import { ProjectBoardPage } from '@/features/projects/components/ProjectBoardPage'
import { ProfilePage } from '@/features/profile/components/ProfilePage'
import { PeoplePage } from '@/features/people/components/PeoplePage'
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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectBoardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'people', element: <PeoplePage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
