import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { buildLoginPath } from '@/shared/lib/return-to'
import { Sidebar } from '@/app/layout/Sidebar'
import { TopNavbar } from '@/app/layout/TopNavbar'

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { pathname, search, hash } = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAuthenticated) {
    // Keep the address (e.g. a shared ?selected=TST-12 link) so login can bring the user back.
    return <Navigate to={buildLoginPath(`${pathname}${search}${hash}`)} replace />
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
