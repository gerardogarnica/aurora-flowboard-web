import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '../services/people.service'
import type { CreateUserRequest } from '../types/people.types'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
