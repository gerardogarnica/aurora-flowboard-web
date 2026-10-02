import { useEffect } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { isSameAuthUser, toAuthUser } from '../utils/auth-user'
import { useMySummary } from './useMySummary'

/**
 * Keeps the persisted auth user in step with `my-summary`. The store is written once at login
 * and survives reloads, so without this a role change (or a rename) made by an administrator
 * would only reach this browser on the next sign-in — and the UI would keep offering, or hiding,
 * actions by the old role. Mount it once, inside the authenticated shell.
 */
export function useSyncAuthUser() {
  const { data: summary } = useMySummary()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    // Only refresh an existing session, never start one: after logout `user` is null while a
    // stale summary may still be on hand for a render.
    if (!summary || !user) return
    const next = toAuthUser(summary.me)
    if (!isSameAuthUser(user, next)) setUser(next)
  }, [summary, user, setUser])
}
