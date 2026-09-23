import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDate, parseDateOnly, toDateOnly } from '@/shared/lib/date-format'

/**
 * Popover + Calendar date picker for date-only fields. Controlled and string-based: `value`
 * and `onChange` carry `YYYY-MM-DD` (or `''` when empty), the same shape the API and the
 * forms already use, so callers never handle `Date` objects. The trigger shows `formatDate`,
 * keeping one date format app-wide. `id` lands on the trigger button so a `<Label htmlFor>`
 * still targets it.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  disabled,
  clearable = true,
  defaultOpen = false,
  onOpenChange,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minDate?: Date
  disabled?: boolean
  clearable?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const selected = parseDateOnly(value)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  function commit(nextValue: string) {
    handleOpenChange(false)
    if (nextValue !== value) onChange(nextValue)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        render={
          <Button
            variant="outline"
            data-empty={!value}
            className={cn(
              'w-full justify-start gap-2 font-normal data-[empty=true]:text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" />
        <span className="truncate">{value ? formatDate(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-0 p-0" align="start">
        <Calendar
          mode="single"
          required
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected ?? minDate}
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => commit(toDateOnly(date))}
        />
        {clearable && value && (
          <div className="border-t p-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => commit('')}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
