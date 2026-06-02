import { useAuthStore } from '@/app/store/auth.store'
import { MyWorkSection } from './MyWorkSection'
import { ProjectsOverview } from './ProjectsOverview'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-10 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dateStr} · Here&apos;s what needs your attention.
        </p>
      </div>

      <MyWorkSection />
      <ProjectsOverview />
    </div>
  )
}
