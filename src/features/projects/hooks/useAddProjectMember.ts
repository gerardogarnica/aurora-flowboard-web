import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addProjectMember } from '../services/project.service'
import type { ProjectRole } from '../types/project.types'
import { queryKeys } from '@/shared/lib/query-keys'
import { getErrorMessage } from '@/shared/lib/error-message'

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
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.mySummary() })
      toast.success('Member added')
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to add member'))
    },
  })
}
