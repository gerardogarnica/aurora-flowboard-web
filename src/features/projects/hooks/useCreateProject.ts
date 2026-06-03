import { useMutation } from '@tanstack/react-query'
import { createProject } from '../services/project.service'
import type { CreateProjectPayload } from '../types/project.types'

export function useCreateProject() {
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
  })
}
