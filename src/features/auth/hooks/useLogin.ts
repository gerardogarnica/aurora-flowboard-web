import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth.store'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { getMySummary, login } from '../services/auth.service'
import { queryKeys } from '@/shared/lib/query-keys'
import { toAuthUser } from '../utils/auth-user'

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
      setUser(toAuthUser(summary.me))
    },
  })
}
