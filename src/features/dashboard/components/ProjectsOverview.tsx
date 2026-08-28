import { resolveSwatchColor } from '@/shared/constants/colors'
import { PROJECTS } from '@/features/dashboard/constants/projects-overview'
import type { Project } from '@/features/dashboard/types/project-overview.types'

const MEMBER_BG = [
  'bg-violet-500 text-white',
  'bg-sky-500 text-white',
  'bg-emerald-500 text-white',
  'bg-rose-500 text-white',
  'bg-amber-500 text-white',
]

function GlowDot({ color }: { color: string }) {
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

function ProjectCard({ project }: { project: Project }) {
  const total = project.open + project.closed
  const progress = total > 0 ? (project.closed / total) * 100 : 0
  const hex = resolveSwatchColor(project.color)

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GlowDot color={hex} />
          <span className="text-sm font-medium text-foreground truncate">{project.name}</span>
        </div>
        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
          Active
        </span>
      </div>

      <div className="flex gap-4 text-xs">
        <span className="text-muted-foreground">
          Open <span className="text-foreground font-medium tabular-nums">{project.open}</span>
        </span>
        <span className="text-muted-foreground">
          Closed{' '}
          <span className="text-foreground font-medium tabular-nums">{project.closed}</span>
        </span>
      </div>

      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: hex }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {project.members.map((m, i) => (
            <span
              key={m}
              className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center border-2 border-background select-none ${MEMBER_BG[i % MEMBER_BG.length]}`}
            >
              {m}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {Math.round(progress)}% done
        </span>
      </div>
    </div>
  )
}

export function ProjectsOverview() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Projects Overview
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}
