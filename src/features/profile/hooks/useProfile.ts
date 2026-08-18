import { useQuery } from '@tanstack/react-query'
import { getMe } from '../services/profile.service'

export function useProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: getMe,
  })
}
