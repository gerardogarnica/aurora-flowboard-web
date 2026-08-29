import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'
import { logout } from '../services/auth.service'

export function useLogout() {
  const navigate = useNavigate()
  const storeLogout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (refreshToken) {
        await logout(refreshToken)
      }
    },
    onSettled: () => {
      storeLogout()
      navigate('/login', { replace: true })
    },
  })
}
