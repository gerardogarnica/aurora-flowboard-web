import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AssigneeSelect } from './AssigneeSelect'
import { TypeSelect } from './TypeSelect'
import { PrioritySelect } from './PrioritySelect'
import { ComponentSelect } from './ComponentSelect'
import { useCreateWorkItem } from '../hooks/useCreateWorkItem'
import { useProjectComponents } from '@/features/projects/hooks/useProjectComponents'
import type { Priority, WorkItemType } from '../types/work-item.types'
import type { Project } from '@/features/projects/types/project.types'

interface FormData {
  title: string
  description: string
  type: WorkItemType
  priority: Priority
  componentId: string
  estimatedPoints: string
  estimatedCompletionDate: string
  assigneeId: string
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  type: 'Story',
  priority: 'Medium',
  componentId: '',
  estimatedPoints: '',
  estimatedCompletionDate: '',
  assigneeId: '',
}

function ModalBody({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const [data, setData] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<{ title?: string; estimatedPoints?: string }>({})

  const { mutate, isPending, error } = useCreateWorkItem(project.projectId)
  const { data: components = [] } = useProjectComponents(project.projectId)

  const today = new Date().toISOString().split('T')[0]

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }))
    if (errors[key as keyof typeof errors]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!data.title.trim()) e.title = 'Title is required.'
    if (data.estimatedPoints && (!/^\d+$/.test(data.estimatedPoints) || Number(data.estimatedPoints) < 0)) {
      e.estimatedPoints = 'Must be a non-negative integer.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    mutate(
      {
        title: data.title.trim(),
        description: data.description.trim() || null,
        type: data.type,
        priority: data.priority,
        projectId: project.projectId,
        estimatedPoints: data.estimatedPoints ? Number(data.estimatedPoints) : null,
        estimatedCompletionDate: data.estimatedCompletionDate || null,
        assigneeId: data.assigneeId || null,
        milestoneId: null,
        componentId: data.componentId || null,
      },
      { onSuccess: () => onClose() },
    )
  }

  const submitError = error instanceof Error ? error.message : error ? String(error) : null
  const isValid = data.title.trim().length > 0

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Work Item</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wi-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="wi-title"
            value={data.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Fix refund idempotency bug"
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wi-description">Description</Label>
          <textarea
            id="wi-description"
            value={data.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Add more context…"
            rows={3}
            className={cn(
              'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'resize-none',
            )}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="wi-type">Type</Label>
            <TypeSelect
              triggerId="wi-type"
              value={data.type}
              onValueChange={(value) => setField('type', value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="wi-priority">Priority</Label>
            <PrioritySelect
              triggerId="wi-priority"
              value={data.priority}
              onValueChange={(value) => setField('priority', value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wi-component">Component</Label>
          <ComponentSelect
            triggerId="wi-component"
            components={components}
            value={data.componentId}
            onValueChange={(value) => setField('componentId', value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="wi-points">Estimated Points</Label>
            <Input
              id="wi-points"
              type="number"
              min={0}
              value={data.estimatedPoints}
              onChange={(e) => setField('estimatedPoints', e.target.value)}
              placeholder="e.g. 5"
              aria-invalid={!!errors.estimatedPoints}
            />
            {errors.estimatedPoints && <p className="text-xs text-destructive">{errors.estimatedPoints}</p>}
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="wi-date">Estimated completion date</Label>
            <Input
              id="wi-date"
              type="date"
              value={data.estimatedCompletionDate}
              onChange={(e) => setField('estimatedCompletionDate', e.target.value)}
              min={today}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wi-assignee">Assignee</Label>
          <AssigneeSelect
            triggerId="wi-assignee"
            members={project.members}
            value={data.assigneeId}
            onValueChange={(value) => setField('assigneeId', value)}
          />
        </div>

        {submitError && <p className="text-xs text-destructive">{submitError}</p>}
      </div>

      <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isValid || isPending}>
          {isPending ? 'Creating…' : 'Create Work Item'}
        </Button>
      </div>
    </>
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
        {open && project && <ModalBody project={project} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
