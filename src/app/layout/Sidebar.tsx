import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Inbox,
  CircleUser,
  Star,
  FolderOpen,
  Users,
  Settings,
  Plus,
  User,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/app/store/auth.store'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { FlowboardLogoMark } from '@/shared/components/FlowboardLogoMark'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProjectApiStatus } from '@/features/projects/types/project.types'

type ProjectStatus = 'active' | 'maintenance' | 'completed' | 'archived'

const API_STATUS_MAP: Record<ProjectApiStatus, ProjectStatus> = {
  Active: 'active',
  Maintenance: 'maintenance',
  Completed: 'completed',
  Archived: 'archived',
}

const SIDEBAR_STATUS_ORDER: ProjectStatus[] = ['active', 'maintenance']

function GlowDot({ color, status }: { color: string; status: ProjectStatus }) {
  if (status === 'maintenance') {
    return (
      <span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
        <span className="absolute inset-0 rounded-full opacity-20 bg-slate-400" />
        <span className="w-2 h-2 rounded-full bg-slate-400" />
      </span>
    )
  }

  return (
    <span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
      <span
        className="absolute inset-0 rounded-full opacity-25"
        style={{ backgroundColor: color }}
      />
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}

function NavItem({
  icon: Icon,
  label,
  badge,
  to,
  collapsed,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
  to: string
  collapsed: boolean
}) {
  const { pathname } = useLocation()
  const active = pathname === to

  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center rounded-md text-sm transition-colors',
        collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5',
        active
          ? 'bg-black/[0.07] text-sidebar-foreground font-medium'
          : 'text-sidebar-foreground/80 hover:bg-black/4 hover:text-sidebar-foreground',
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">{badge}</span>
      )}
    </Link>
  )
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const { data: projects = [] } = useProjects()

  const initials = user?.initials ?? 'U'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const visibleProjects = projects
    .map((p) => ({ id: p.projectId, name: p.name, color: p.color, status: API_STATUS_MAP[p.status] }))
    .filter((p) => SIDEBAR_STATUS_ORDER.includes(p.status))
    .sort((a, b) => SIDEBAR_STATUS_ORDER.indexOf(a.status) - SIDEBAR_STATUS_ORDER.indexOf(b.status))

  return (
    <>
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Org header */}
      <div className={cn('pt-4 pb-3', collapsed ? 'flex justify-center px-0' : 'px-3')}>
        <div className={cn('flex items-center', collapsed ? '' : 'gap-2.5')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <FlowboardLogoMark className="h-6 w-auto text-sidebar-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">Flowboard</p>
              <p className="text-xs text-muted-foreground">6 projects · 14 members</p>
            </div>
          )}
        </div>
      </div>

      {/* Primary nav */}
      <nav className={cn('flex flex-col gap-0.5', collapsed ? 'px-2' : 'px-2')}>
        <NavItem icon={Home} label="Home" to="/dashboard" collapsed={collapsed} />
        <NavItem icon={Inbox} label="Inbox" badge={3} to="/inbox" collapsed={collapsed} />
        <NavItem icon={CircleUser} label="My Issues" badge={12} to="/my-issues" collapsed={collapsed} />
        <NavItem icon={Star} label="Saved views" to="/saved-views" collapsed={collapsed} />
      </nav>

      <div className="my-3 h-px bg-sidebar-border mx-3" />

      {/* Projects */}
      <div className="flex flex-col gap-1">
        {!collapsed && (
          <div className="flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Projects
            </p>
            <button
              className="text-muted-foreground hover:text-sidebar-foreground transition-colors rounded p-0.5 hover:bg-black/4"
              aria-label="New project"
              onClick={() => setCreateProjectOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className={cn('flex flex-col gap-0.5', collapsed ? 'px-2' : 'px-2')}>
          <Link
            to="/projects"
            title={collapsed ? 'All projects' : undefined}
            className={cn(
              'flex items-center rounded-md text-sm text-sidebar-foreground/80 hover:bg-black/4 hover:text-sidebar-foreground transition-colors',
              collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5',
            )}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="flex-1 truncate">All projects</span>}
            {!collapsed && <span className="text-xs text-muted-foreground tabular-nums">{projects.length}</span>}
          </Link>
          {visibleProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}/board`}
              title={collapsed ? project.name : undefined}
              className={cn(
                'flex items-center rounded-md text-sm hover:bg-black/4 hover:text-sidebar-foreground transition-colors w-full',
                collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5',
                project.status === 'maintenance'
                  ? 'text-sidebar-foreground/50'
                  : 'text-sidebar-foreground/80',
              )}
            >
              <GlowDot color={resolveSwatchColor(project.color)} status={project.status} />
              {!collapsed && <span className="flex-1 truncate">{project.name}</span>}
            </Link>
          ))}
        </div>
      </div>

      <div className="my-3 h-px bg-sidebar-border mx-3" />

      {/* Workspace */}
      <div className="flex flex-col gap-1">
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Workspace
          </p>
        )}
        <div className="px-2 flex flex-col gap-0.5">
          <NavItem icon={Users} label="People & roles" to="/people" collapsed={collapsed} />
          <NavItem icon={Settings} label="Settings" to="/settings" collapsed={collapsed} />
        </div>
      </div>

      {/* User footer */}
      <div className={cn('mt-auto border-t border-sidebar-border py-3', collapsed ? 'px-2 flex justify-center' : 'px-2')}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                title={collapsed ? (user?.fullName ?? 'Account') : undefined}
                className={cn(
                  'flex items-center rounded-md text-left transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5 w-full',
                )}
              />
            }
          >
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-secondary-foreground text-[11px] font-semibold select-none">
                {initials}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
                  {user?.fullName ?? 'You'}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {user?.email ?? ''}
                </p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-64">
            <div className="px-1.5 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.fullName ?? 'You'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
            </div>
            <DropdownMenuItem render={<Link to="/profile" />}>
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <CreateProjectModal
      open={createProjectOpen}
      onClose={() => setCreateProjectOpen(false)}
    />
    </>
  )
}
