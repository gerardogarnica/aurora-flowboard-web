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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { WORK_ITEM_TYPE_CONFIG, PRIORITY_BARS } from '../constants/work-item-display'
import { PriorityBars } from './PriorityBars'
import { MemberAvatar, UnassignedAvatar } from './MemberAvatar'
import { useCreateWorkItem } from '../hooks/useCreateWorkItem'
import type { Priority, WorkItemType } from '../types/work-item.types'
import type { Project } from '@/features/projects/types/project.types'

interface FormData {
  title: string
  description: string
  type: WorkItemType
  priority: Priority
  estimatedPoints: string
  estimatedCompletionDate: string
  assigneeId: string
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  type: 'Story',
  priority: 'Medium',
  estimatedPoints: '',
  estimatedCompletionDate: '',
  assigneeId: '',
}

function resolveFlowId(project: Project): string | null {
  const defaultFlow = project.flows.find((f) => f.isDefault)
  if (defaultFlow) return defaultFlow.flowId
  const activeFlow = project.flows.find((f) => f.isActive)
  return activeFlow?.flowId ?? null
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

    const flowId = resolveFlowId(project)
    if (!flowId) return

    mutate(
      {
        title: data.title.trim(),
        description: data.description.trim() || null,
        type: data.type,
        priority: data.priority,
        projectId: project.projectId,
        flowId,
        estimatedPoints: data.estimatedPoints ? Number(data.estimatedPoints) : null,
        estimatedCompletionDate: data.estimatedCompletionDate || null,
        assigneeId: data.assigneeId || null,
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
            <Select value={data.type} onValueChange={(value) => setField('type', value as WorkItemType)}>
              <SelectTrigger id="wi-type" className="w-full">
                <SelectValue>
                  {(value: WorkItemType) => {
                    const cfg = WORK_ITEM_TYPE_CONFIG[value]
                    const Icon = cfg.icon
                    return (
                      <>
                        <Icon className={cn('w-3.5 h-3.5', cfg.className)} />
                        {cfg.label}
                      </>
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORK_ITEM_TYPE_CONFIG).map(([value, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <SelectItem key={value} value={value}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.className)} />
                      {cfg.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="wi-priority">Priority</Label>
            <Select value={data.priority} onValueChange={(value) => setField('priority', value as Priority)}>
              <SelectTrigger id="wi-priority" className="w-full">
                <SelectValue>
                  {(value: Priority) => (
                    <>
                      <PriorityBars priority={value} />
                      {PRIORITY_BARS[value].label}
                    </>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_BARS).map(([value, cfg]) => (
                  <SelectItem key={value} value={value}>
                    <PriorityBars priority={value as Priority} />
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <Select value={data.assigneeId} onValueChange={(value) => setField('assigneeId', value ?? '')}>
            <SelectTrigger id="wi-assignee" className="w-full">
              <SelectValue>
                {(value: string) => {
                  const member = project.members.find((m) => m.userId === value)
                  return member ? (
                    <>
                      <MemberAvatar userId={member.userId} initials={member.initials} />
                      {member.fullName}
                    </>
                  ) : (
                    <>
                      <UnassignedAvatar />
                      Unassigned
                    </>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <UnassignedAvatar />
                Unassigned
              </SelectItem>
              {project.members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <MemberAvatar userId={member.userId} initials={member.initials} />
                  {member.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {submitError && <p className="text-xs text-destructive">{submitError}</p>}
      </div>

      <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!isValid || isPending}>
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
      <DialogContent showCloseButton={false} className="sm:max-w-155 gap-3">
        {open && project && <ModalBody project={project} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
