import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/shared/components/DatePicker'
import { startOfToday } from '@/shared/lib/date-format'
import { getErrorMessage } from '@/shared/lib/error-message'
import { AssigneeSelect } from './AssigneeSelect'
import { TypeSelect } from './TypeSelect'
import { PrioritySelect } from './PrioritySelect'
import { ComponentSelect } from './ComponentSelect'
import { MilestoneSelect } from './MilestoneSelect'
import { useCreateWorkItem } from '../hooks/useCreateWorkItem'
import { WORK_ITEM_TITLE_MAX_LENGTH } from '../constants/work-item-display'
import { createWorkItemSchema, type CreateWorkItemFormValues } from '../schemas/work-item.schema'
import { useProjectComponents } from '@/features/projects/hooks/useProjectComponents'
import { useProjectMilestones } from '@/features/projects/hooks/useProjectMilestones'
import type { CreateWorkItemRequest } from '../types/work-item.types'
import type { Project } from '@/features/projects/types/project.types'

const DEFAULT_VALUES: CreateWorkItemFormValues = {
  title: '',
  description: '',
  type: 'Story',
  priority: 'Medium',
  estimatedPoints: '',
  estimatedCompletionDate: '',
  assigneeId: '',
  milestoneId: '',
  componentId: '',
}

function toPayload(values: CreateWorkItemFormValues, projectId: string): CreateWorkItemRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    type: values.type,
    priority: values.priority,
    projectId,
    estimatedPoints: values.estimatedPoints.trim() ? Number(values.estimatedPoints) : null,
    estimatedCompletionDate: values.estimatedCompletionDate || null,
    assigneeId: values.assigneeId || null,
    milestoneId: values.milestoneId || null,
    componentId: values.componentId || null,
  }
}

function CreateWorkItemForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const { mutate, isPending, error } = useCreateWorkItem(project.projectId)
  const { data: components = [] } = useProjectComponents(project.projectId)
  const { data: milestones = [] } = useProjectMilestones(project.projectId)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateWorkItemFormValues>({
    resolver: zodResolver(createWorkItemSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  })

  const allValues = useWatch({ control })
  const isFormValid = createWorkItemSchema.safeParse(allValues).success

  function onSubmit(values: CreateWorkItemFormValues) {
    mutate(toPayload(values, project.projectId), { onSuccess: () => onClose() })
  }

  const bannerError = error ? getErrorMessage(error) : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {bannerError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bannerError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wi-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="wi-title"
          autoFocus
          maxLength={WORK_ITEM_TITLE_MAX_LENGTH}
          placeholder="e.g. Fix refund idempotency bug"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'wi-title-error' : undefined}
          {...register('title')}
        />
        {errors.title && (
          <p id="wi-title-error" className="text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wi-description">Description</Label>
        <Textarea
          id="wi-description"
          rows={3}
          placeholder="Add more context…"
          className="resize-none max-h-48"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'wi-description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="wi-description-error" className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="wi-type">Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <TypeSelect triggerId="wi-type" value={field.value} onValueChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="wi-priority">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <PrioritySelect triggerId="wi-priority" value={field.value} onValueChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="wi-milestone">Milestone</Label>
          <Controller
            control={control}
            name="milestoneId"
            render={({ field }) => (
              <MilestoneSelect
                triggerId="wi-milestone"
                milestones={milestones}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="wi-component">Component</Label>
          <Controller
            control={control}
            name="componentId"
            render={({ field }) => (
              <ComponentSelect
                triggerId="wi-component"
                components={components}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="wi-points">Estimated Points</Label>
          <Input
            id="wi-points"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 5"
            aria-invalid={!!errors.estimatedPoints}
            aria-describedby={errors.estimatedPoints ? 'wi-points-error' : undefined}
            {...register('estimatedPoints')}
          />
          {errors.estimatedPoints && (
            <p id="wi-points-error" className="text-xs text-destructive">
              {errors.estimatedPoints.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="wi-date">Estimated completion date</Label>
          <Controller
            control={control}
            name="estimatedCompletionDate"
            render={({ field }) => (
              <DatePicker id="wi-date" value={field.value} onChange={field.onChange} minDate={startOfToday()} />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wi-assignee">Assignee</Label>
        <Controller
          control={control}
          name="assigneeId"
          render={({ field }) => (
            <AssigneeSelect
              triggerId="wi-assignee"
              members={project.members}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid || isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create Work Item'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CreateWorkItemModal({
  open,
  project,
  onClose,
}: {
  open: boolean
  project: Project | undefined
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-155 gap-3">
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
        </DialogHeader>
        {open && project && <CreateWorkItemForm project={project} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
