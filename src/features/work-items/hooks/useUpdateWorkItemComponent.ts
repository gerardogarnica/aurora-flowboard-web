import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-client'
import { updateWorkItemComponent } from '../services/work-item.service'
import type { WorkItemDetailResponse } from '../types/work-item.types'

interface UpdateComponentVars {
  componentId: string | null
  componentName: string | null
}

export function useUpdateWorkItemComponent(workItemId: string, code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId }: UpdateComponentVars) => updateWorkItemComponent(workItemId, componentId),

    onMutate: async ({ componentId, componentName }) => {
      await queryClient.cancelQueries({ queryKey: ['work-item', code] })

      const previousItem = queryClient.getQueryData<WorkItemDetailResponse>(['work-item', code])

      queryClient.setQueryData<WorkItemDetailResponse>(['work-item', code], (old) =>
        old ? { ...old, componentId, componentName } : old,
      )

      return { previousItem }
    },

    onError: (err, _vars, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(['work-item', code], context.previousItem)
      }
      const reason = err instanceof ApiError ? err.message : 'Something went wrong'
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-item', code] })
    },
  })
}
