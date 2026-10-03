import { cachePatch, useOptimisticMutation } from '@/shared/hooks/useOptimisticMutation'
import { queryKeys } from '@/shared/lib/query-keys'
import { updateUserRole } from '../services/people.service'
import type { SystemUser } from '../types/people.types'
import type { UserRole } from '@/shared/types/user-role.types'

interface UpdateRoleVars {
  userId: string
  role: UserRole
}

export function useUpdateUserRole() {
  return useOptimisticMutation({
    mutationFn: ({ userId, role }: UpdateRoleVars) => updateUserRole(userId, role),
    patches: ({ userId, role }) => [
      cachePatch<SystemUser[]>(queryKeys.users(), (old) =>
        old.map((u) => (u.userId === userId ? { ...u, role } : u)),
      ),
    ],
    invalidate: () => [{ queryKey: queryKeys.users() }],
    errorMessage: 'Failed to update role',
  })
}
