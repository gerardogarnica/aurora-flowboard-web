import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '../services/people.service'
import type { CreateUserRequest } from '../types/people.types'
import { queryKeys } from '@/shared/lib/query-keys'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() })
    },
  })
}
