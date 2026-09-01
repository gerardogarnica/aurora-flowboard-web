import { z } from 'zod'

export const MILESTONE_NAME_MAX_LENGTH = 100

export const milestoneSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(MILESTONE_NAME_MAX_LENGTH, `Name must be at most ${MILESTONE_NAME_MAX_LENGTH} characters`),
    description: z.string(),
    targetStartDate: z.string(),
    targetEndDate: z.string(),
  })
  .refine(
    // Both are 'YYYY-MM-DD', so a lexicographic compare is a chronological compare.
    (values) => !values.targetStartDate || !values.targetEndDate || values.targetEndDate >= values.targetStartDate,
    { message: 'End date must be on or after the start date', path: ['targetEndDate'] },
  )

export type MilestoneFormValues = z.infer<typeof milestoneSchema>
