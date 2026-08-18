import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { data: profile, isPending, isError } = useProfile()

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details" />
      <div className="flex-1 overflow-y-auto p-8">
        <Card className="mx-auto max-w-md">
          {isPending ? (
            <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading profile…
            </CardContent>
          ) : isError ? (
            <CardContent>
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                Something went wrong. Please try again.
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-secondary-foreground text-sm font-semibold select-none">
                      {profile.initials ?? '?'}
                    </span>
                  </div>
                  <CardTitle>{profile.fullName}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-first-name" className="text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <Input id="profile-first-name" value={profile.firstName} disabled />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-last-name" className="text-sm font-medium text-foreground">
                    Last Name
                  </label>
                  <Input id="profile-last-name" value={profile.lastName} disabled />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">Roles</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.roles && profile.roles.length > 0 ? profile.roles.join(', ') : '—'}
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
