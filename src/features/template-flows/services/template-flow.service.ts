import { apiFetch } from '@/shared/lib/api-client'
import type { ProjectKind } from '@/features/projects/types/project.types'
import type { TemplateFlow } from '../types/template-flow.types'

export async function getTemplateFlow(kind: ProjectKind): Promise<TemplateFlow> {
  return apiFetch<TemplateFlow>(`/v1/flowboard/template-flows/${kind}`)
}
