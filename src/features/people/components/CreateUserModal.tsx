import { useState } from 'react'
import { useController, useForm, useWatch } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ApiError } from '@/shared/lib/api-client'
import { PASSWORD_RULES } from '@/shared/constants/password-rules'
import { createUserSchema, type CreateUserFormValues } from '@/features/people/schemas/create-user.schema'
import { useCreateUser } from '@/features/people/hooks/useCreateUser'
import type { UserRole } from '@/features/people/types/people.types'

const ROLE_OPTIONS: UserRole[] = ['Administrator', 'Member']

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const { mutate, isPending, error } = useCreateUser()
  const [passwordVisible, setPasswordVisible] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', role: 'Member' },
  })

  const passwordValue = useWatch({ control, name: 'password' })
  const { field: roleField } = useController({ control, name: 'role' })

  function onSubmit(values: CreateUserFormValues) {
    mutate(values, {
      onSuccess: () => {
        toast.success('User created')
        onDone()
      },
    })
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-first-name">First name</Label>
          <Input
            id="user-first-name"
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'user-first-name-error' : undefined}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p id="user-first-name-error" className="text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-last-name">Last name</Label>
          <Input
            id="user-last-name"
            autoComplete="family-name"
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'user-last-name-error' : undefined}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p id="user-last-name-error" className="text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'user-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="user-email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-password">Password</Label>
        <div className="relative">
          <Input
            id="user-password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="user-password-rules"
            className="pr-9"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            tabIndex={-1}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul id="user-password-rules" className="flex flex-col gap-0.5 pt-0.5">
          {PASSWORD_RULES.map((rule) => {
            const evaluated = passwordValue.length > 0
            const met = evaluated && rule.test(passwordValue)
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
        <Label htmlFor="user-role">Role</Label>
        <Select value={roleField.value} onValueChange={roleField.onChange}>
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create user'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Add a new member to this workspace. They can sign in immediately with the password you set.
          </DialogDescription>
        </DialogHeader>
        {open && <CreateUserForm onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
