import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-sidebar p-4 flex flex-col gap-4">
        <h1 className="text-lg font-semibold">Aurora Flowboard</h1>
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/projects" className="hover:underline">Projects</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
