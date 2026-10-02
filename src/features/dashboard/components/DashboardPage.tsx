import { useAuthStore } from '@/app/store/auth.store'
import { PageHeader } from '@/shared/components/PageHeader'
import { UnderConstructionPlaceholder } from '@/shared/components/UnderConstructionPlaceholder'

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
    <>
      <PageHeader title={`${getGreeting()}, ${firstName}`} subtitle={dateStr} />
      <div className="flex-1 overflow-y-auto p-8">
        <UnderConstructionPlaceholder />
      </div>
    </>
  )
}
