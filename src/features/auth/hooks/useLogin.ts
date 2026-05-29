import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { login } from '../services/auth.service'

function parseJwt(token: string): Record<string, unknown> {
  return JSON.parse(atob(token.split('.')[1]))
}

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('aurora_access_token', data.accessToken)
      const claims = parseJwt(data.accessToken)
      setUser({
        id: claims.sub as string,
        fullName: claims.name as string,
        email: claims.email as string,
        role: claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string,
      })
      navigate('/dashboard')
    },
  })
}
