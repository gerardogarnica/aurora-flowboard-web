import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { UNDERLINE_TAB_ACTIVE, UNDERLINE_TAB_BASE, UNDERLINE_TAB_IDLE } from './underline-tab-classes'

interface RouteTab {
  label: string
  path: string
}

export function RouteTabs({ tabs }: { tabs: RouteTab[] }) {
  return (
    <nav className="flex items-center gap-5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            cn(UNDERLINE_TAB_BASE, isActive ? UNDERLINE_TAB_ACTIVE : UNDERLINE_TAB_IDLE)
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
