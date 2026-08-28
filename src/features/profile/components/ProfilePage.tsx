import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProfile } from '../hooks/useProfile'
import { ChangePasswordDialog } from './ChangePasswordDialog'

export function ProfilePage() {
  const { data: profile, isPending, isError } = useProfile()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto flex max-w-md flex-col gap-6 lg:max-w-xl">
          <Card>
            {isPending ? (
              <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading profile…
              </CardContent>
            ) : isError ? (
              <CardContent>
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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

          {!isPending && !isError && (
            <Card className="gap-0">
              <CardHeader className="border-b border-border">
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="text-sm font-medium text-foreground">Change password</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm tracking-wider">••••••••••</span>
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </>
  )
}
