import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_RULES } from '@/shared/constants/password-rules'

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .superRefine((value, ctx) => {
      for (const rule of PASSWORD_RULES) {
        if (!rule.test(value)) {
          ctx.addIssue({ code: 'custom', message: rule.label })
        }
      }
    }),
  role: z.enum(['Administrator', 'Member']),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
