import type { ProjectKind, StateCategory } from '@/features/projects/types/project.types'

export interface TemplateFlow {
  id: string
  kind: ProjectKind
  states: TemplateFlowState[]
}

export interface TemplateFlowState {
  id: string
  name: string
  sortOrder: number
  category: StateCategory
  color: string
}
