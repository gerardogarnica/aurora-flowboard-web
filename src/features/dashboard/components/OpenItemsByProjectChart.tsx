import { ChartBarIncreasing } from 'lucide-react'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { PROJECTS } from '@/features/dashboard/constants/projects-overview'

export function OpenItemsByProjectChart() {
  const ranked = [...PROJECTS].sort((a, b) => b.open - a.open)
  const maxOpen = Math.max(...ranked.map((p) => p.open))
  const totalOpen = ranked.reduce((sum, p) => sum + p.open, 0)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wide">
          <ChartBarIncreasing className="w-[15px] h-[15px] text-muted-foreground" />
          Open Items by Project
        </h2>
        <span className="text-xs text-muted-foreground font-medium">{totalOpen} open</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {ranked.map((project) => {
          const hex = resolveSwatchColor(project.color)
          const width = (project.open / maxOpen) * 100
          return (
            <div key={project.id} className="flex items-center gap-3.5">
              <span className="w-36 shrink-0 text-sm text-foreground truncate">{project.name}</span>
              <span className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <span
                  className="block h-full rounded-r-sm"
                  style={{ width: `${width}%`, backgroundColor: hex }}
                />
              </span>
              <span className="w-6 shrink-0 text-right text-sm font-semibold text-foreground tabular-nums">
                {project.open}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
