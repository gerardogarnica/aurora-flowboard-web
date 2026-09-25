import { z } from 'zod'

export const COMMENT_MAX_LENGTH = 4000

/** The character counter stays hidden until a comment gets this close to the limit. */
export const COMMENT_COUNTER_THRESHOLD = 3600

export const workItemCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(COMMENT_MAX_LENGTH, `Comment must be at most ${COMMENT_MAX_LENGTH} characters`),
})

export type WorkItemCommentFormValues = z.input<typeof workItemCommentSchema>
