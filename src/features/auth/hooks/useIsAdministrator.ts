import { useAuthStore } from '@/app/store/auth.store'

/** Whether the signed-in user holds the workspace `Administrator` role (create projects, manage people). */
export function useIsAdministrator() {
  return useAuthStore((s) => s.user?.role === 'Administrator')
}
