import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'
import { ProjectsPage } from '@/features/projects/components/ProjectsPage'
import { WorkItemsPage } from '@/features/work-items/components/WorkItemsPage'
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
      { path: 'work-items', element: <WorkItemsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
