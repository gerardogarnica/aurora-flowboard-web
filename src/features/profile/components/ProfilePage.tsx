import { useAuthStore } from '@/app/store/auth.store'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const initials = user?.initials ?? 'U'

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details" />
      <div className="flex-1 overflow-y-auto p-8">
        <Card className="max-w-md">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-secondary-foreground text-sm font-semibold select-none">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.fullName ?? 'You'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
