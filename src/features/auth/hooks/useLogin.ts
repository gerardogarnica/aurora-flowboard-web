import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { login, getMe } from '../services/auth.service'

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem('aurora_access_token', data.accessToken)
      const profile = await getMe()
      setUser({
        id: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.roles[0] ?? '',
      })
      navigate('/dashboard')
    },
  })
}
