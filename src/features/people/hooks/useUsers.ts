import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../services/people.service'
import { queryKeys } from '@/shared/lib/query-keys'

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: getUsers,
  })
}
