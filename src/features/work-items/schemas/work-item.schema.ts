import { z } from 'zod'
import {
  ESTIMATED_POINTS_MAX_DIGITS,
  WORK_ITEM_DESCRIPTION_MAX_LENGTH,
  WORK_ITEM_TITLE_MAX_LENGTH,
} from '../constants/work-item-display'
import type { Priority, WorkItemType } from '../types/work-item.types'

/**
 * Create Work Item form. Every field is a string, the shape its control produces: the selects
 * use `''` for "none" and the DatePicker `YYYY-MM-DD`; submitting turns them into
 * the API's nulls and numbers (CreateWorkItemModal's `toPayload`). The rules mirror the backend's CreateWorkItemValidator.
 */
export const createWorkItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(WORK_ITEM_TITLE_MAX_LENGTH, `Title must be at most ${WORK_ITEM_TITLE_MAX_LENGTH} characters`),
  description: z
    .string()
    .trim()
    .max(WORK_ITEM_DESCRIPTION_MAX_LENGTH, `Description must be at most ${WORK_ITEM_DESCRIPTION_MAX_LENGTH} characters`),
  // Both come from a Select that only offers known values, so there is nothing to check — the
  // schema just carries their types through.
  type: z.custom<WorkItemType>(),
  priority: z.custom<Priority>(),
  // The backend rejects 0 ("GreaterThan(0)"), not only negatives. The field's sanitizer already
  // stops a 0 or a sixth digit from being typed; the schema still states both rules.
  estimatedPoints: z
    .string()
    .trim()
    .regex(
      new RegExp(`^([1-9]\\d{0,${ESTIMATED_POINTS_MAX_DIGITS - 1}})?$`),
      `Must be a whole number from 1 to ${'9'.repeat(ESTIMATED_POINTS_MAX_DIGITS)}`,
    ),
  estimatedCompletionDate: z.string(),
  assigneeId: z.string(),
  milestoneId: z.string(),
  componentId: z.string(),
})

export type CreateWorkItemFormValues = z.input<typeof createWorkItemSchema>
