import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { isSubmitShortcut } from '@/shared/constants/platform'

interface InlineEditTextProps {
  value: string
  /**
   * Called with the trimmed text when it changed. Return the mutation's promise
   * (`mutation.mutateAsync(next)`): if it rejects, the editor reopens with what the user typed
   * instead of losing it — the mutation hook has already rolled back and toasted.
   */
  onCommit: (next: string) => Promise<unknown> | void
  canEdit: boolean
  /** Screen-reader hint on the read-mode button, e.g. "Edit title". */
  editLabel: string
  /** Textarea, committed with Ctrl/⌘+Enter (plain Enter is a newline) and with a character counter. */
  multiline?: boolean
  /**
   * Single-line: a hard `maxLength` on the input. Multiline: typing is never blocked — over the
   * limit the counter turns red and saving is refused, so the editor stays open with the text.
   */
  maxLength?: number
  /** Whether clearing the text is a valid edit (a description) or a no-op (a title, a name). */
  allowEmpty?: boolean
  /** Read-mode content when the value is empty. */
  placeholder?: ReactNode
  /** Typography for both modes' text. */
  className?: string
  inputClassName?: string
}

export function InlineEditText({
  value,
  onCommit,
  canEdit,
  editLabel,
  multiline = false,
  maxLength,
  allowEmpty = false,
  placeholder,
  className,
  inputClassName,
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const refocusButton = useRef(false)
  const hintId = useId()
  const isOverLimit = multiline && maxLength !== undefined && draft.length > maxLength

  function startEditing() {
    setDraft(value)
    setIsEditing(true)
  }

  // Keyboard exits hand focus back to the button so Tab order isn't lost; a blur doesn't,
  // since the user has just put focus somewhere else on purpose.
  function stopEditing(returnFocus: boolean) {
    refocusButton.current = returnFocus
    setIsEditing(false)
  }

  // Focus the button as it mounts, inside React's commit. Later is too late inside a Dialog:
  // when the focused input unmounts, Base UI's focus manager sees focus on <body> (in a
  // microtask) and moves it to the dialog container, overriding a requestAnimationFrame.
  function attachButton(el: HTMLButtonElement | null) {
    if (el && refocusButton.current) {
      refocusButton.current = false
      el.focus()
    }
  }

  function commit(returnFocus: boolean) {
    if (isOverLimit) return
    const next = draft.trim()
    stopEditing(returnFocus)
    if ((!next && !allowEmpty) || next === value) return
    onCommit(next)?.catch(() => setIsEditing(true))
  }

  function cancel() {
    setDraft(value)
    stopEditing(true)
  }

  if (isEditing) {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        // Otherwise Escape also closes a Dialog this editor lives in.
        e.stopPropagation()
        cancel()
      } else if (multiline ? isSubmitShortcut(e) : e.key === 'Enter') {
        e.preventDefault()
        commit(true)
      }
    }

    if (!multiline) {
      return (
        <Input
          autoFocus
          value={draft}
          maxLength={maxLength}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(false)}
          onKeyDown={handleKeyDown}
          className={cn(className, inputClassName)}
        />
      )
    }

    return (
      <div className="flex flex-col gap-1">
        <Textarea
          autoFocus
          value={draft}
          // Caret to the end: editing a long text is usually a tweak, not a rewrite.
          onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(false)}
          onKeyDown={handleKeyDown}
          aria-invalid={isOverLimit || undefined}
          className={cn(className, inputClassName)}
        />
        {maxLength !== undefined && (
          <span
            aria-live="polite"
            className={cn('self-end text-xs tabular-nums', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}
          >
            {isOverLimit && 'Too long to save · '}
            {draft.length.toLocaleString('en-US')}/{maxLength.toLocaleString('en-US')}
          </span>
        )}
      </div>
    )
  }

  const content = value || placeholder

  if (!canEdit) {
    return <span className={cn(multiline && 'block whitespace-pre-wrap', className)}>{content}</span>
  }

  return (
    <button
      ref={attachButton}
      type="button"
      onClick={startEditing}
      aria-describedby={hintId}
      className={cn(
        // Block and as wide as the line, like the <p>/<h2> it replaces: an inline button would
        // shrink to its text and wrap a short title onto two lines.
        'block w-[calc(100%+0.5rem)] -mx-1 px-1 rounded-md text-left hover:bg-muted/50 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        multiline && 'whitespace-pre-wrap',
        className,
      )}
    >
      {content}
      {/* A description, not part of the name: inside a DialogTitle, visible-to-AT text here
          would also end up in the dialog's accessible name. */}
      <span id={hintId} hidden>
        {editLabel}
      </span>
    </button>
  )
}
