import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { removeProjectMember } from '../services/project.service'
import { queryKeys } from '@/shared/lib/query-keys'

interface RemoveMemberVars {
  projectId: string
  userId: string
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId }: RemoveMemberVars) => removeProjectMember(projectId, userId),

    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.mySummary() })
      toast.success('Member removed')
    },

    onError: () => {
      toast.error('Failed to remove member')
    },
  })
}
