---
paths:
  - "src/shared/components/**"
  - "src/components/ui/**"
---

# Shared and `ui/` components: how they work

`CLAUDE.md` says *which* primitive to use; this file covers their internals and the quirks to preserve.

## `InlineEditText`

- **Read mode:** a real `<button>` (Tab + Enter/Space), or plain text when `!canEdit`.
- **Commit and cancel:** Enter (single-line) or Ctrl/⌘+Enter (`multiline`) and blur commit. Escape cancels and calls `stopPropagation`, so it doesn't close a surrounding Dialog.
- **`onCommit`:** pass `(v) => mutation.mutateAsync(v)`. A rejected promise reopens the editor with what the user typed.
- **`maxLength`:** a hard input limit when single-line. When multiline it never blocks typing: over the limit the counter turns red and saving is refused.
- **Focus:** returns to the button from its **ref callback**, during React's commit. A later `requestAnimationFrame` loses to Base UI's Dialog focus manager, which grabs focus in a microtask.
- **Edit hint:** the "Edit …" hint is a `hidden` element wired through `aria-describedby`. Visible text inside a `DialogTitle` would leak into the dialog's accessible name.

## `DatePicker`

- **Value:** controlled and string-based. `value` / `onChange` carry `YYYY-MM-DD` (`''` when empty), the API's shape, so callers never touch `Date`.
- **`minDate`:** disables earlier days (`startOfToday()` for fields that can't be in the past).
- **Clearing:** `clearable` (default `true`) adds a Clear button. The calendar is `required`, so re-clicking the selected day doesn't clear it.
- **`id`:** lands on the trigger, so `<Label htmlFor>` works.
- **Conversions:** `parseDateOnly`, `toDateOnly` (never `toISOString()`, which shifts to UTC) and `startOfToday()` in `shared/lib/date-format.ts`. `formatDate` splits date-only strings by hand, because `new Date('2026-08-31')` is UTC midnight and shows the previous day in negative-offset timezones.

## `ConfirmDialog`, `UnderlineTabs`, `PageHeader`

- **`ConfirmDialog`:** forced Cancel/Confirm with no close X; `variant="destructive"` for removals. `isPending` + `pendingLabel` only for confirms that wait for the server: they disable both buttons and block dismissal.
- **`UnderlineTabs`:** uses Base UI Tabs' *manual* activation (arrows move focus, Enter/Space selects), so lazily-fetched tabs load only when chosen.
  - Inactive panels unmount unless `keepMounted`; `ProjectDetailsModal` keeps them to preserve an unsaved draft.
  - Its class recipe lives in `underline-tab-classes.ts`, shared with `RouteTabs`. It's a separate `.ts` because react-refresh forbids non-component exports from a `.tsx`. The same reason puts `buttonVariants` in `ui/button-variants.ts`.
- **`PageHeader`:** renders `subtitle` in a `<div>`, because the board passes it a `<div>`-based avatar stack.

## `ui/` quirks

- **Select:** `SelectContent` defaults `alignItemWithTrigger` to **`false`**, deliberately unlike shadcn. With `true` the popup jumps so the selected item sits on the trigger. Don't set it back.
  - When an item's `value` differs from its label (an id), `SelectValue` needs a render function mapping value → label (see `AssigneeSelect`). That function also overrides `placeholder`, so it must return the placeholder itself.
- **Tooltip:** a disabled trigger needs a wrapping `<span>` as the trigger, since `disabled` sets `pointer-events-none`. `Sidebar`'s `CollapsedLabel` adds the tooltip only while the rail is collapsed.
- **Popover:** floating panels use the `ui/popover.tsx` Popover. A hand-rolled `createPortal` + `getBoundingClientRect` + `mousedown` panel froze while its container scrolled and never closed on Escape.
- **Calendar:** `ui/calendar.tsx` wraps `react-day-picker` v10. `date-fns` is only its transitive dependency, so never import it for display.
