import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { getMySummary, login } from '../services/auth.service'
import { MY_SUMMARY_QUERY_KEY } from './useMySummary'

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      const summary = await getMySummary()
      queryClient.setQueryData(MY_SUMMARY_QUERY_KEY, summary)
      setUser({
        id: summary.me.userId,
        fullName: summary.me.fullName,
        initials: summary.me.initials,
        email: summary.me.email,
        role: summary.me.role,
      })
      navigate('/dashboard')
    },
  })
}
