import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { Sidebar } from '@/app/layout/Sidebar'
import { TopNavbar } from '@/app/layout/TopNavbar'

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
