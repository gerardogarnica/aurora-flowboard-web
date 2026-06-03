import { useAuthStore } from '@/app/store/auth.store'
import { PageHeader } from '@/shared/components/PageHeader'
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
    <div>
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        subtitle={`${dateStr} · Here's what needs your attention.`}
        action={{ label: '+ Create issue', onClick: () => {} }}
      />
      <div className="flex flex-col gap-10 max-w-5xl">
        <MyWorkSection />
        <ProjectsOverview />
      </div>
    </div>
  )
}
