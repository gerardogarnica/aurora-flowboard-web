import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
            cn(
              'text-sm pb-2.5 border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
