import { z } from 'zod'
import { PROJECT_KINDS } from '../constants/project-kinds'

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

// ─── Create Project (two steps) ──────────────────────────────────────────────────────────────

/**
 * Step 1 of Create Project: the editable project fields plus the two that are fixed once the
 * project exists. `code` is held to exactly 3 letters. The backend would take 1–3, but a fixed
 * width keeps work-item codes (`TST-12`) aligned. `kind` starts as `''` (nothing picked) and
 * comes out as a ProjectKind.
 */
export const createProjectSchema = projectSchema.extend({
  code: z.string().regex(/^[A-Z]{3}$/, 'Code must be exactly 3 letters'),
  kind: z.string().min(1, 'Kind is required').pipe(z.enum(PROJECT_KINDS)),
})

export type CreateProjectFormValues = z.input<typeof createProjectSchema>
export type CreateProjectDetails = z.output<typeof createProjectSchema>

export const FLOW_STATE_NAME_MAX_LENGTH = 50

/**
 * Step 2: the flow states, as a list the user reorders by hand — so they live in plain state
 * and are checked with this schema on submit rather than registered as form fields. The rules
 * mirror the backend's CreateProjectValidator and CreateProjectHandler, which answer 400 for
 * each of them.
 */
export const flowStatesSchema = z
  .array(
    z.object({
      name: z
        .string()
        .trim()
        .min(1, 'All states must have a name.')
        .max(FLOW_STATE_NAME_MAX_LENGTH, `State names must be at most ${FLOW_STATE_NAME_MAX_LENGTH} characters.`),
      category: z.enum(['Active', 'Completed', 'Cancelled']),
      color: z.string().min(1),
      roles: z.array(z.string()).min(1, 'Every state needs at least one role.'),
    }),
  )
  .superRefine((states, ctx) => {
    const names = states.map((s) => s.name.trim().toLowerCase())
    if (new Set(names).size !== names.length) ctx.addIssue({ code: 'custom', message: 'State names must be unique.' })
    for (const category of ['Active', 'Completed', 'Cancelled'] as const) {
      if (!states.some((s) => s.category === category)) {
        ctx.addIssue({ code: 'custom', message: `The flow needs at least one ${category} state.` })
      }
    }
  })
