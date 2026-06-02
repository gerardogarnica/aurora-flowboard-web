import { useState } from 'react'
import { cn } from '@/lib/utils'
import { resolveProjectColor } from '@/features/projects/constants/project-colors'

type Priority = 'high' | 'medium' | 'low'
type WorkStatus = 'in_progress' | 'due_today' | 'overdue' | 'done'

interface WorkItem {
  id: string
  title: string
  status: WorkStatus
  project: string
  projectColor: string
  priority: Priority
  dueDate: string
}

const WORK_ITEMS: WorkItem[] = [
  {
    id: '1',
    title: 'Fix authentication token refresh logic',
    status: 'in_progress',
    project: 'Payments Platform',
    projectColor: 'red',
    priority: 'high',
    dueDate: 'Jun 2',
  },
  {
    id: '2',
    title: 'Update API rate limiting middleware',
    status: 'in_progress',
    project: 'Infra & Platform',
    projectColor: 'navy',
    priority: 'medium',
    dueDate: 'Jun 3',
  },
  {
    id: '3',
    title: 'Design onboarding flow wireframes',
    status: 'in_progress',
    project: 'Docs & Onboarding',
    projectColor: 'orange',
    priority: 'low',
    dueDate: 'Jun 5',
  },
  {
    id: '4',
    title: 'Implement push notifications',
    status: 'in_progress',
    project: 'Mobile Companion',
    projectColor: 'blue',
    priority: 'medium',
    dueDate: 'Jun 4',
  },
  {
    id: '5',
    title: 'Review Q2 analytics report',
    status: 'due_today',
    project: 'Admin Console',
    projectColor: 'amber',
    priority: 'high',
    dueDate: 'Today',
  },
  {
    id: '6',
    title: 'Update landing page copy',
    status: 'due_today',
    project: 'Marketing Web',
    projectColor: 'crimson',
    priority: 'medium',
    dueDate: 'Today',
  },
  {
    id: '7',
    title: 'Resolve production memory leak',
    status: 'overdue',
    project: 'Payments Platform',
    projectColor: 'red',
    priority: 'high',
    dueDate: 'May 28',
  },
  {
    id: '8',
    title: 'Complete user research interviews',
    status: 'done',
    project: 'Mobile Companion',
    projectColor: 'blue',
    priority: 'medium',
    dueDate: 'May 30',
  },
  {
    id: '9',
    title: 'Ship dark mode toggle',
    status: 'done',
    project: 'Admin Console',
    projectColor: 'amber',
    priority: 'low',
    dueDate: 'May 29',
  },
  {
    id: '10',
    title: 'Write changelog for v2.4 release',
    status: 'done',
    project: 'Docs & Onboarding',
    projectColor: 'orange',
    priority: 'low',
    dueDate: 'May 28',
  },
  {
    id: '11',
    title: 'Fix broken CI pipeline for staging',
    status: 'done',
    project: 'Infra & Platform',
    projectColor: 'navy',
    priority: 'high',
    dueDate: 'May 27',
  },
]

const TABS: { key: WorkStatus; label: string }[] = [
  { key: 'in_progress', label: 'In Progress' },
  { key: 'due_today', label: 'Due Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done this week' },
]

const PRIORITY_COLOR: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#94A3B8',
}

function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: PRIORITY_COLOR[priority] }}
    />
  )
}

function ProjectTag({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}

function DueDateChip({ date, overdue }: { date: string; overdue: boolean }) {
  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded whitespace-nowrap',
        overdue
          ? 'bg-red-50 text-red-600'
          : date === 'Today'
            ? 'bg-amber-50 text-amber-700'
            : 'text-muted-foreground',
      )}
    >
      {date}
    </span>
  )
}

export function MyWorkSection() {
  const [activeTab, setActiveTab] = useState<WorkStatus>('in_progress')

  const countByStatus = (status: WorkStatus) =>
    WORK_ITEMS.filter((i) => i.status === status).length

  const visible = WORK_ITEMS.filter((i) => i.status === activeTab)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">My Work</h2>
      </div>

      <div className="flex gap-0 border-b border-border">
        {TABS.map((tab) => {
          const count = countByStatus(tab.key)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'text-xs tabular-nums px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col divide-y divide-border/60">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          visible.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-3 px-1 hover:bg-muted/40 rounded-md transition-colors cursor-default"
            >
              <PriorityDot priority={item.priority} />
              <span className="flex-1 text-sm text-foreground truncate">{item.title}</span>
              <ProjectTag name={item.project} color={resolveProjectColor(item.projectColor)} />
              <DueDateChip date={item.dueDate} overdue={item.status === 'overdue'} />
            </div>
          ))
        )}
      </div>
    </section>
  )
}
