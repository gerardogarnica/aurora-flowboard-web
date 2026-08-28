import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useWorkItem } from '../hooks/useWorkItem'
import { useUpdateWorkItemTitle } from '../hooks/useUpdateWorkItemTitle'
import { useUpdateWorkItemDescription } from '../hooks/useUpdateWorkItemDescription'
import { WORK_ITEM_TYPE_CONFIG } from '../constants/work-item-display'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { WorkItemSidebar } from './WorkItemSidebar'
import { WorkItemActivitySections } from './WorkItemActivitySections'
import { ApiError } from '@/shared/lib/api-client'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

function EditableTitle({
  workItemId,
  code,
  projectId,
  title,
  canEdit,
}: {
  workItemId: string
  code: string
  projectId: string
  title: string
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)
  const mutation = useUpdateWorkItemTitle(workItemId, code, projectId)

  function startEditing() {
    if (!canEdit) return
    setDraft(title)
    setIsEditing(true)
    requestAnimationFrame(() => {
      inputRef.current?.select()
    })
  }

  function commit() {
    const trimmed = draft.trim()
    setIsEditing(false)
    if (!trimmed || trimmed === title) return
    mutation.mutate(trimmed)
  }

  function cancel() {
    setDraft(title)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        autoFocus
        value={draft}
        disabled={mutation.isPending}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        className="text-lg font-semibold h-auto py-0.5"
      />
    )
  }

  return (
    <DialogTitle
      onClick={startEditing}
      className={cn('text-lg', canEdit && '-mx-1 px-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer')}
    >
      {title}
    </DialogTitle>
  )
}

const DESCRIPTION_MAX_LENGTH = 4000

function EditableDescription({
  workItemId,
  code,
  description,
  canEdit,
}: {
  workItemId: string
  code: string
  description: string | null
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(description ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mutation = useUpdateWorkItemDescription(workItemId, code)

  function startEditing() {
    if (!canEdit) return
    setDraft(description ?? '')
    setIsEditing(true)
    requestAnimationFrame(() => {
      textareaRef.current?.select()
    })
  }

  function commit() {
    const trimmed = draft.trim()
    setIsEditing(false)
    if (trimmed === (description ?? '')) return
    mutation.mutate(trimmed)
  }

  function cancel() {
    setDraft(description ?? '')
    setIsEditing(false)
  }

  if (isEditing) {
    const isOverLimit = draft.length > DESCRIPTION_MAX_LENGTH

    return (
      <div className="flex flex-col gap-1">
        <Textarea
          ref={textareaRef}
          autoFocus
          value={draft}
          disabled={mutation.isPending}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
          className="min-h-32 max-h-64 text-sm resize-none"
        />
        <span className={cn('self-end text-xs', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
          {draft.length}/{DESCRIPTION_MAX_LENGTH}
        </span>
      </div>
    )
  }

  return (
    <p
      onClick={startEditing}
      className={cn(
        'text-sm text-foreground whitespace-pre-wrap',
        canEdit && '-mx-1 px-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer',
      )}
    >
      {description || <span className="text-muted-foreground">No description provided.</span>}
    </p>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 p-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Separator orientation="vertical" />
      <div className="w-64 shrink-0 p-6 flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusMessage({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <div className="p-6 flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onClose} className="self-start">
        Close
      </Button>
    </div>
  )
}

function ModalBody({
  code,
  columns,
  canEdit,
  onClose,
}: {
  code: string
  columns: ProjectBoardColumn[]
  canEdit: boolean
  onClose: () => void
}) {
  const { data: item, isLoading, isError, error } = useWorkItem(code)

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <StatusMessage
          title="Work item not found"
          message={`No work item with code "${code}" exists.`}
          onClose={onClose}
        />
      )
    }
    return (
      <StatusMessage
        title="Couldn't load work item"
        message={error instanceof Error ? error.message : 'Something went wrong.'}
        onClose={onClose}
      />
    )
  }

  if (!item) return null

  const typeConfig = WORK_ITEM_TYPE_CONFIG[item.type]
  const TypeIcon = typeConfig.icon
  const currentColumn = columns.find((col) => col.flowStateId === item.flowStateId)
  const isCancelled = currentColumn?.category === 'Cancelled'
  const flowStateColor = currentColumn ? resolveSwatchColor(currentColumn.color) : undefined

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.className)} />
          <span className="font-mono">{item.code}</span>
          <Badge
            variant="secondary"
            className="shrink-0 text-white"
            style={flowStateColor ? { backgroundColor: flowStateColor } : undefined}
          >
            {item.flowStateName}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <EditableTitle
            workItemId={item.workItemId}
            code={item.code}
            projectId={item.projectId}
            title={item.title}
            canEdit={canEdit && !isCancelled}
          />
        </div>
      </DialogHeader>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <EditableDescription
            workItemId={item.workItemId}
            code={item.code}
            description={item.description}
            canEdit={canEdit && !isCancelled}
          />
          <WorkItemActivitySections item={item} />
        </div>
        <Separator orientation="vertical" />
        <div className="w-64 shrink-0 overflow-y-auto p-6">
          <WorkItemSidebar
            key={item.workItemId}
            item={item}
            isCancelled={isCancelled}
            canEdit={canEdit}
            flowStateColor={flowStateColor}
            columns={columns}
          />
        </div>
      </div>
    </div>
  )
}

export function WorkItemDetailModal({
  code,
  columns,
  canEdit,
  onClose,
}: {
  code: string | null
  columns: ProjectBoardColumn[]
  canEdit: boolean
  onClose: () => void
}) {
  const open = !!code

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-4xl w-full p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
        {open && (
          <ModalBody
            code={code}
            columns={columns}
            canEdit={canEdit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
