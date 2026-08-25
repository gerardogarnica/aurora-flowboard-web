import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MY_SUMMARY_QUERY_KEY } from '@/features/auth/hooks/useMySummary'
import { removeProjectMember } from '../services/project.service'

interface RemoveMemberVars {
  projectId: string
  userId: string
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId }: RemoveMemberVars) => removeProjectMember(projectId, userId),

    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: MY_SUMMARY_QUERY_KEY })
      toast.success('Member removed')
    },

    onError: () => {
      toast.error('Failed to remove member')
    },
  })
}
