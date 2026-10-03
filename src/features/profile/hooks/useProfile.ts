import { useQuery } from '@tanstack/react-query'
import { getMe } from '../services/profile.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: getMe,
  })
}
