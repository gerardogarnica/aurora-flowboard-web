import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { login } from '../services/auth.service'

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('aurora_access_token', data.token)
      setUser(data.user)
      navigate('/dashboard')
    },
  })
}
