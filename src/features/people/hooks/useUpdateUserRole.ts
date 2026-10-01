import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateUserRole } from '../services/people.service'
import type { SystemUser, UserRole } from '../types/people.types'
import { queryKeys } from '@/shared/lib/query-keys'

interface UpdateRoleVars {
  userId: string
  role: UserRole
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: UpdateRoleVars) => updateUserRole(userId, role),

    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users() })
      const previous = queryClient.getQueryData<SystemUser[]>(queryKeys.users())
      queryClient.setQueryData<SystemUser[]>(queryKeys.users(), (old = []) =>
        old.map((u) => (u.userId === userId ? { ...u, role } : u)),
      )
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users(), context.previous)
      }
      toast.error('Failed to update role — changes reverted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() })
    },
  })
}
