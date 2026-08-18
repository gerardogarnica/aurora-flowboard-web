import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_RULES } from '../constants/password-rules'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
      .superRefine((value, ctx) => {
        for (const rule of PASSWORD_RULES) {
          if (!rule.test(value)) {
            ctx.addIssue({ code: 'custom', message: rule.label })
          }
        }
      }),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
