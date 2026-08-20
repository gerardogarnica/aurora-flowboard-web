import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ApiError } from '@/shared/lib/api-client'
import { PASSWORD_RULES } from '@/shared/constants/password-rules'
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas/change-password.schema'
import { useChangePassword } from '../hooks/useChangePassword'

type VisibilityField = 'current' | 'next' | 'confirm'

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const { mutate, isPending, error } = useChangePassword()
  const [visible, setVisible] = useState<Record<VisibilityField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPasswordValue = useWatch({ control, name: 'newPassword' })

  function toggleVisible(field: VisibilityField) {
    setVisible((v) => ({ ...v, [field]: !v[field] }))
  }

  function onSubmit(values: ChangePasswordFormValues) {
    mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Password changed successfully')
          onDone()
        },
      },
    )
  }

  const bannerError =
    error instanceof ApiError ? error.message : error ? 'Something went wrong. Please try again.' : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {bannerError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bannerError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={visible.current ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
            className="pr-9"
            {...register('currentPassword')}
          />
          <button
            type="button"
            onClick={() => toggleVisible('current')}
            tabIndex={-1}
            aria-label={visible.current ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {visible.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p id="current-password-error" className="text-xs text-destructive">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={visible.next ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            aria-describedby="new-password-rules"
            className="pr-9"
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => toggleVisible('next')}
            tabIndex={-1}
            aria-label={visible.next ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {visible.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul id="new-password-rules" className="flex flex-col gap-0.5 pt-0.5">
          {PASSWORD_RULES.map((rule) => {
            const evaluated = newPasswordValue.length > 0
            const met = evaluated && rule.test(newPasswordValue)
            return (
              <li
                key={rule.id}
                className={cn(
                  'flex items-center gap-1.5 text-xs',
                  !evaluated ? 'text-muted-foreground' : met ? 'text-emerald-600' : 'text-destructive',
                )}
              >
                {met ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                {rule.label}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={visible.confirm ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            className="pr-9"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => toggleVisible('confirm')}
            tabIndex={-1}
            aria-label={visible.confirm ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {visible.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Changing…
            </>
          ) : (
            'Change password'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Choose a new password for your account. You&apos;ll stay signed in on this device.
          </DialogDescription>
        </DialogHeader>
        {open && <ChangePasswordForm onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
