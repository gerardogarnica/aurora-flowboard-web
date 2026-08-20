import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../services/people.service'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
}
