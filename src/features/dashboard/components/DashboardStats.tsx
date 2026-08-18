import { RotateCw, Clock, TriangleAlert, CircleCheckBig } from 'lucide-react'

const STATS = [
  { key: 'in_progress', label: 'In Progress', value: 4, icon: RotateCw, tint: 'bg-primary/10 text-primary' },
  { key: 'due_today', label: 'Due Today', value: 2, icon: Clock, tint: 'bg-amber-50 text-amber-700' },
  { key: 'overdue', label: 'Overdue', value: 1, icon: TriangleAlert, tint: 'bg-red-50 text-red-600' },
  { key: 'done', label: 'Done this week', value: 4, icon: CircleCheckBig, tint: 'bg-emerald-50 text-emerald-600' },
] as const

export function DashboardStats() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {STATS.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.key} className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-card">
            <div className={`w-[30px] h-[30px] rounded-md flex items-center justify-center ${stat.tint}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
