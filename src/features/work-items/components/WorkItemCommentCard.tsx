import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime } from '@/shared/lib/date-format'
import { useUpdateWorkItemComment } from '../hooks/useUpdateWorkItemComment'
import { useDeleteWorkItemComment } from '../hooks/useDeleteWorkItemComment'
import {
  COMMENT_MAX_LENGTH,
  workItemCommentSchema,
  type WorkItemCommentFormValues,
} from '../schemas/work-item-comment.schema'
import { SUBMIT_SHORTCUT_LABEL, isSubmitShortcut } from '@/shared/constants/platform'
import { CommentCharCounter } from './CommentCharCounter'
import { MemberAvatar } from './MemberAvatar'
import type { WorkItemComment } from '../types/work-item.types'

const EXCERPT_LENGTH = 80

function excerptOf(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim()
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH).trimEnd()}…` : flat
}

function CommentEditor({
  initialContent,
  onSave,
  onCancel,
}: {
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { register, handleSubmit, control } = useForm<WorkItemCommentFormValues>({
    resolver: zodResolver(workItemCommentSchema),
    defaultValues: { content: initialContent },
  })
  const { ref: registerRef, ...contentField } = register('content')

  const content = useWatch({ control, name: 'content' })
  const trimmed = content.trim()
  const canSave = trimmed.length > 0 && trimmed !== initialContent.trim()

  const save = handleSubmit(({ content }) => onSave(content))

  // Caret at the end, not select-all: editing a comment is usually a tweak, not a rewrite.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) save()
      }}
      className="flex flex-col gap-2"
    >
      <Textarea
        {...contentField}
        ref={(el) => {
          registerRef(el)
          textareaRef.current = el
        }}
        aria-label="Edit comment"
        maxLength={COMMENT_MAX_LENGTH}
        onKeyDown={(e) => {
          if (isSubmitShortcut(e)) {
            e.preventDefault()
            if (canSave) save()
          } else if (e.key === 'Escape') {
            // Keep Escape from also closing the work item modal around us.
            e.preventDefault()
            e.stopPropagation()
            onCancel()
          }
        }}
        className="min-h-19 max-h-54 text-sm resize-none"
      />
      <div className="flex items-center justify-end gap-3">
        <CommentCharCounter length={content.length} />
        <span className="text-xs text-muted-foreground/70">{SUBMIT_SHORTCUT_LABEL} to save · Esc to cancel</span>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!canSave}>
          Save
        </Button>
      </div>
    </form>
  )
}

export function WorkItemCommentCard({
  comment,
  workItemId,
  projectId,
  canManage,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  comment: WorkItemComment
  workItemId: string
  projectId: string
  /** The viewer wrote this comment and the project accepts writes. */
  canManage: boolean
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const updateMutation = useUpdateWorkItemComment(workItemId)
  const deleteMutation = useDeleteWorkItemComment(workItemId, projectId)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const refocusTrigger = useRef(false)
  const content = comment.content ?? ''

  // The ⋯ trigger is hidden while editing; once it comes back after a cancel, hand focus
  // back to it so keyboard users land where they started.
  useEffect(() => {
    if (!isEditing && refocusTrigger.current) {
      refocusTrigger.current = false
      triggerRef.current?.focus()
    }
  }, [isEditing])

  function handleSave(next: string) {
    // Optimistic: the card leaves edit mode now; a failure rolls the text back with a toast.
    onStopEdit()
    updateMutation.mutate({ commentId: comment.commentId, content: next })
  }

  function handleCancel() {
    refocusTrigger.current = true
    onStopEdit()
  }

  function handleConfirmDelete() {
    setConfirmDeleteOpen(false)
    deleteMutation.mutate(comment.commentId)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MemberAvatar userId={comment.authorId} initials={comment.authorInitials} />
        <span className="ml-1 text-sm font-medium text-foreground truncate">{comment.authorFullName}</span>
        <span className="shrink-0">{formatDateTime(comment.createdOnUtc)}</span>
        {comment.updatedOnUtc && (
          <Tooltip>
            <TooltipTrigger render={<span className="shrink-0 cursor-default">(edited)</span>} />
            <TooltipContent>Edited {formatDateTime(comment.updatedOnUtc)}</TooltipContent>
          </Tooltip>
        )}

        {canManage && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger
              ref={triggerRef}
              render={
                // Ghost is fine here: the trigger sits inside the comment's own header row,
                // and ⋯ is a conventional overflow affordance — a filled chip on every one
                // of your own comments would be noisier than it is helpful.
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Comment actions"
                  className="ml-auto text-muted-foreground"
                />
              }
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuItem className="cursor-pointer" onClick={onStartEdit}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Indented to start under the author's name, clear of the avatar (w-6 + gap-2 + ml-1). */}
      <div className="pl-9">
        {isEditing ? (
          <CommentEditor initialContent={content} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{content}</p>
        )}
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this comment?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">“{excerptOf(content)}”</span> will be removed from this
              work item. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
