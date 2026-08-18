import { create } from 'zustand'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({ user: null, isAuthenticated: false })
  },
}))
