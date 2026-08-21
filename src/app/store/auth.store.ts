import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/features/auth/types/auth.types'
import { ACCESS_TOKEN_KEY, AUTH_STORAGE_KEY, REFRESH_TOKEN_KEY } from '@/shared/lib/api-client'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
      // isAuthenticated is never persisted — deriving it here keeps it from
      // drifting out of sync with the stored user.
      merge: (persisted, current) => {
        const user = (persisted as Partial<AuthState> | undefined)?.user ?? null
        return { ...current, user, isAuthenticated: user !== null }
      },
    },
  ),
)
