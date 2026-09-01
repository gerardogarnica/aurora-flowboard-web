import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/shared/lib/api-client'
import { milestoneSchema, type MilestoneFormValues } from '../schemas/milestone.schema'
import { useCreateMilestone } from '../hooks/useCreateMilestone'
import { useUpdateMilestone } from '../hooks/useUpdateMilestone'
import type { MilestoneRequest, ProjectMilestone } from '../types/project.types'

function toPayload(values: MilestoneFormValues): MilestoneRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    targetStartDate: values.targetStartDate || null,
    targetEndDate: values.targetEndDate || null,
  }
}

function MilestoneForm({
  projectId,
  milestone,
  onDone,
}: {
  projectId: string
  milestone?: ProjectMilestone
  onDone: () => void
}) {
  const isEditing = !!milestone
  const createMutation = useCreateMilestone(projectId)
  const updateMutation = useUpdateMilestone()
  const { isPending, error } = isEditing ? updateMutation : createMutation

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    // Validate as the user types: the submit button is disabled while invalid, so an
    // onSubmit-only mode would never surface the cross-field date error.
    mode: 'onChange',
    defaultValues: {
      name: milestone?.name ?? '',
      description: milestone?.description ?? '',
      targetStartDate: milestone?.targetStartDate ?? '',
      targetEndDate: milestone?.targetEndDate ?? '',
    },
  })

  const allValues = useWatch({ control })
  const isFormValid = milestoneSchema.safeParse(allValues).success

  function onSubmit(values: MilestoneFormValues) {
    const payload = toPayload(values)

    if (milestone) {
      updateMutation.mutate(
        { milestoneId: milestone.id, projectId, payload },
        { onSuccess: () => { toast.success('Milestone updated'); onDone() } },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Milestone created'); onDone() },
      })
    }
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
        <Label htmlFor="milestone-name">Name</Label>
        <Input
          id="milestone-name"
          autoFocus
          placeholder="e.g. Mobile app v1"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'milestone-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="milestone-name-error" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="milestone-description">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="milestone-description"
          rows={3}
          placeholder="What does this milestone deliver?"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="milestone-start">
            Target start <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input id="milestone-start" type="date" {...register('targetStartDate')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="milestone-end">
            Target end <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="milestone-end"
            type="date"
            aria-invalid={!!errors.targetEndDate}
            aria-describedby={errors.targetEndDate ? 'milestone-end-error' : undefined}
            {...register('targetEndDate')}
          />
          {errors.targetEndDate && (
            <p id="milestone-end-error" className="text-xs text-destructive">
              {errors.targetEndDate.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid || isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              {isEditing ? 'Saving…' : 'Creating…'}
            </>
          ) : (
            isEditing ? 'Save changes' : 'Create milestone'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function MilestoneFormModal({
  projectId,
  milestone,
  open,
  onClose,
}: {
  projectId: string
  milestone?: ProjectMilestone
  open: boolean
  onClose: () => void
}) {
  const isEditing = !!milestone

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit milestone' : 'Add milestone'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the scope and target dates of this milestone.'
              : 'A time-boxed initiative within this project, with a defined scope and end.'}
          </DialogDescription>
        </DialogHeader>
        {open && <MilestoneForm projectId={projectId} milestone={milestone} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
