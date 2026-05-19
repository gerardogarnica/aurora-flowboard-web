import { create } from 'zustand'
import type { AuthUser } from '@/features/auth/types/auth.types'

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
    localStorage.removeItem('aurora_access_token')
    set({ user: null, isAuthenticated: false })
  },
}))
