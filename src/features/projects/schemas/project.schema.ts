import { z } from 'zod'

export const PROJECT_NAME_MAX_LENGTH = 100
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(PROJECT_NAME_MAX_LENGTH, `Name must be at most ${PROJECT_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH, `Description must be at most ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`),
  // The backend caps this at 20 chars; every SWATCH_COLORS key is well under that, and the
  // swatch grid is the only way to set it, so length isn't worth re-checking here.
  color: z.string().min(1, 'Color is required'),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
