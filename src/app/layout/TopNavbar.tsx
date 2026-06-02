import { useLocation } from 'react-router-dom'
import { Search, PanelLeft, Bell } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { getUserInitials } from '@/features/auth/utils/get-user-initials'

const BREADCRUMBS: Record<string, string[]> = {
  '/dashboard':  ['Workspace', 'Home'],
  '/projects':   ['Workspace', 'Projects'],
  '/work-items': ['Workspace', 'Work Items'],
  '/my-issues':  ['Workspace', 'My Issues'],
  '/inbox':      ['Workspace', 'Inbox'],
  '/people':     ['Workspace', 'People & Roles'],
  '/settings':   ['Workspace', 'Settings'],
}

interface TopNavbarProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

export function TopNavbar({ collapsed, onToggleSidebar }: TopNavbarProps) {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

  const crumbs = BREADCRUMBS[pathname] ?? ['Workspace']

  const initials = user ? getUserInitials(user) : 'U'

  return (
    <header className="h-11 shrink-0 border-b border-border flex items-center px-3 gap-3">
      <button
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors shrink-0"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      <nav className="flex items-center gap-1.5 text-sm flex-1">
        {crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <span
              className={
                i < crumbs.length - 1
                  ? 'text-muted-foreground'
                  : 'text-foreground font-medium'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 h-7 px-2.5 rounded-md border border-border bg-muted/40 w-96 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-shadow">
          <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />
        </div>

        <div className="relative shrink-0">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
            8
          </span>
        </div>

        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-secondary-foreground text-[11px] font-semibold select-none">
            {initials}
          </span>
        </div>
      </div>
    </header>
  )
}
