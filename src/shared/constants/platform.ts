import type { KeyboardEvent } from 'react'

/** True on macOS and iOS — for picking ⌘ vs Ctrl in shortcut labels. */
export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

/** Label for the Ctrl+Enter / ⌘+Enter submit shortcut, shown next to submit buttons. */
export const SUBMIT_SHORTCUT_LABEL = IS_MAC ? '⌘ ↵' : 'Ctrl ↵'

/** Ctrl+Enter / ⌘+Enter — plain Enter stays a newline. Keep in sync with `SUBMIT_SHORTCUT_LABEL`. */
export function isSubmitShortcut(e: KeyboardEvent): boolean {
  return e.key === 'Enter' && (e.metaKey || e.ctrlKey)
}
