import { Link, useLocation, useMatch } from 'react-router-dom'
import { Search, PanelLeft, Bell } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMySummary } from '@/features/auth/hooks/useMySummary'
import { useProjectDetail } from '@/features/projects/hooks/useProjectDetail'

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
  const projectMatch = useMatch('/projects/:id/:tab')
  const { data: boardProject } = useProjectDetail(projectMatch?.params.id ?? '')
  const { data: summary } = useMySummary()
  const unread = summary?.counts.inboxUnread ?? 0

  const crumbs = projectMatch
    ? ['Workspace', 'Projects', boardProject?.name ?? '…']
    : BREADCRUMBS[pathname] ?? ['Workspace']

  return (
    <header className="h-11 shrink-0 border-b border-border flex items-center px-3 gap-3">
      <button
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/4 transition-colors shrink-0"
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

      <TooltipProvider>
        <div className="flex items-center gap-2">
          {/* Search isn't built yet: shown disabled so it doesn't invite typing into nothing.
              The input ignores the pointer, so hovering it reaches the tooltip's span. */}
          <Tooltip>
            <TooltipTrigger render={<span className="shrink-0 cursor-not-allowed" />}>
              <div className="flex items-center gap-2 h-7 px-2.5 rounded-md border border-border bg-muted/40 w-96 opacity-60">
                <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  disabled
                  aria-label="Search (coming soon)"
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none min-w-0 pointer-events-none"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Search is coming soon</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  to="/inbox"
                  aria-label={unread > 0 ? `Inbox, ${unread} unread` : 'Inbox'}
                  className="relative shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/4 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unread > 0 && (
                    <span className="absolute top-0 right-0 min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none tabular-nums">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              }
            />
            <TooltipContent>{unread > 0 ? `Inbox · ${unread} unread` : 'Inbox'}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  )
}
