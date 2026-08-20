import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addProjectMember } from '../services/project.service'
import type { ProjectRole } from '../types/project.types'

interface AddMemberVars {
  projectId: string
  userId: string
  role: ProjectRole
}

export function useAddProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId, role }: AddMemberVars) =>
      addProjectMember(projectId, { userId, role }),

    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Member added')
    },

    onError: () => {
      toast.error('Failed to add member')
    },
  })
}
