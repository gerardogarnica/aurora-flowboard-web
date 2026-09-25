import { cn } from '@/lib/utils'
import { COMMENT_COUNTER_THRESHOLD, COMMENT_MAX_LENGTH } from '../schemas/work-item-comment.schema'

/** Invisible for everyday comments; appears only when the text nears the 4,000 limit. */
export function CommentCharCounter({ length }: { length: number }) {
  if (length < COMMENT_COUNTER_THRESHOLD) return null

  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        length >= COMMENT_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {length.toLocaleString('en-US')} / {COMMENT_MAX_LENGTH.toLocaleString('en-US')}
    </span>
  )
}
