import { Link } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { PageHeader } from '@/shared/components/PageHeader'
import { getErrorMessage } from '@/shared/lib/error-message'
import { useDashboard } from '../hooks/useDashboard'
import { DashboardKpis } from './DashboardKpis'
import { DashboardRail, DashboardRailSkeleton } from './DashboardRail'
import { MyWorkSection } from './MyWorkSection'
import { PortfolioSection, PortfolioSkeleton } from './PortfolioSection'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function stalledSentence(mine: number, team: number) {
  const own =
    mine === 0
      ? 'None of your items has stopped moving'
      : `${mine} of your items ${mine === 1 ? 'has' : 'have'} stopped moving`
  return `${own} · ${team} across your projects.`
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'
  const { data, error, refetch, isFetching } = useDashboard()

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const subtitle = data ? `${dateStr} · ${stalledSentence(data.me.stalled, data.team.stalled)}` : dateStr
  const retry = () => void refetch()
  // A failed background refresh keeps the numbers on screen; only a first load shows the error.
  const sectionError = !data && error ? (
    (title: string) => (
      <ErrorState
        title={title}
        description={getErrorMessage(error)}
        onRetry={retry}
        isRetrying={isFetching}
        className="rounded-lg border border-border bg-card py-8"
      />
    )
  ) : null

  return (
    <>
      <PageHeader title={`${getGreeting()}, ${firstName}`} subtitle={subtitle} />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 pt-6 pb-8">
        {/* The API counts only Active and Maintenance projects, so a member of Completed ones lands here too. */}
        {data?.portfolio.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No active projects"
            description="Completed and archived projects are on the Projects page."
            action={<Link to="/projects" className="text-sm font-medium text-primary hover:underline">Go to projects</Link>}
          />
        ) : (
          <TooltipProvider>
            <DashboardKpis data={data} error={error} onRetry={retry} isRetrying={isFetching} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_344px]">
              <MyWorkSection me={data?.me} />
              <div className="flex min-w-0 flex-col gap-4">
                {data ? (
                  <DashboardRail data={data} />
                ) : sectionError ? (
                  sectionError("Couldn't load aging and milestones")
                ) : (
                  <DashboardRailSkeleton />
                )}
              </div>
            </div>

            {data ? (
              <PortfolioSection portfolio={data.portfolio} />
            ) : sectionError ? (
              sectionError("Couldn't load your portfolio")
            ) : (
              <PortfolioSkeleton />
            )}
          </TooltipProvider>
        )}
      </div>
    </>
  )
}
