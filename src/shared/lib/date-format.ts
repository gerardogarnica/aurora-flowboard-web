const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parses a bare `YYYY-MM-DD` as local midnight and anything else as a normal timestamp.
 * `new Date('2026-08-31')` parses as *UTC* midnight, which renders as the previous day in
 * negative-offset timezones — so date-only values (milestone target dates, work-item
 * `estimatedCompletionDate`, any `<input type="date">` value) must be split by hand.
 */
function parse(value: string): Date {
  if (!DATE_ONLY.test(value)) return new Date(value)
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Formats a UTC timestamp or a date-only string as `Sep 5, 2026`. */
export function formatDate(value: string): string {
  return parse(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Formats a UTC timestamp as `Sep 5, 2026, 3:07 PM`. */
export function formatDateTime(value: string): string {
  return parse(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
