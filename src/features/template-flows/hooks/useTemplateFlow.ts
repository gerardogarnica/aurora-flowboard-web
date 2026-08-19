import { useMutation } from '@tanstack/react-query'
import { getTemplateFlow } from '../services/template-flow.service'
import type { ProjectKind } from '@/features/projects/types/project.types'

export function useTemplateFlow() {
  return useMutation({
    mutationFn: (kind: ProjectKind) => getTemplateFlow(kind),
  })
}
