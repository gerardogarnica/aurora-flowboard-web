import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/app/store/auth.store'
import { useAddWorkItemComment } from '../hooks/useAddWorkItemComment'
import {
  COMMENT_MAX_LENGTH,
  workItemCommentSchema,
  type WorkItemCommentFormValues,
} from '../schemas/work-item-comment.schema'
import { SUBMIT_SHORTCUT_LABEL, isSubmitShortcut } from '@/shared/constants/platform'
import { CommentCharCounter } from './CommentCharCounter'
import { MemberAvatar } from './MemberAvatar'

/**
 * Sits at the top of the Comments tab, in the same avatar gutter as the thread below it,
 * so it reads as the next (newest) entry rather than a detached form.
 */
export function WorkItemCommentComposer({
  workItemId,
  projectId,
  onAdded,
}: {
  workItemId: string
  projectId: string
  /** Called after the backend accepted the comment — the tab jumps back to page 1. */
  onAdded: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const mutation = useAddWorkItemComment(workItemId, projectId)
  const { register, handleSubmit, control, reset } = useForm<WorkItemCommentFormValues>({
    resolver: zodResolver(workItemCommentSchema),
    defaultValues: { content: '' },
  })

  const content = useWatch({ control, name: 'content' })
  const canSubmit = content.trim().length > 0 && !mutation.isPending

  const submit = handleSubmit(({ content }) => {
    // The resolver hands back the trimmed value.
    mutation.mutate(content, {
      onSuccess: () => {
        reset({ content: '' })
        onAdded()
      },
    })
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) submit()
      }}
      className="flex gap-3"
    >
      {/* Same fallback the backend uses when it can't resolve initials. */}
      {user && <MemberAvatar userId={user.id} initials={user.initials ?? 'U'} />}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Textarea
          {...register('content')}
          aria-label="Add a comment"
          placeholder="Add a comment…"
          maxLength={COMMENT_MAX_LENGTH}
          disabled={mutation.isPending}
          onKeyDown={(e) => {
            if (isSubmitShortcut(e)) {
              e.preventDefault()
              if (canSubmit) submit()
            }
          }}
          className="min-h-19 max-h-54 text-sm resize-none"
        />
        <div className="flex items-center justify-end gap-3">
          <CommentCharCounter length={content.length} />
          <span className="text-xs text-muted-foreground/70">{SUBMIT_SHORTCUT_LABEL} to send</span>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Commenting…
              </>
            ) : (
              'Comment'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
