import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { login } from '../services/auth.service'
import { getMe } from '@/features/profile/services/profile.service'

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      const profile = await getMe()
      setUser({
        id: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: profile.fullName,
        initials: profile.initials,
        email: profile.email,
        role: profile.roles?.[0] ?? '',
      })
      navigate('/dashboard')
    },
  })
}
