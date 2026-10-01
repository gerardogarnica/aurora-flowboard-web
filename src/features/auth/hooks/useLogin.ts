import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth.store'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { getMySummary, login } from '../services/auth.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      const summary = await getMySummary()
      queryClient.setQueryData(queryKeys.mySummary(), summary)
      setUser({
        id: summary.me.userId,
        fullName: summary.me.fullName,
        initials: summary.me.initials,
        email: summary.me.email,
        role: summary.me.role,
      })
    },
  })
}
