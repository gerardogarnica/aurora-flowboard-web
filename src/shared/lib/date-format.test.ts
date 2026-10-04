import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatDateTime, parseDateOnly, startOfToday, toDateOnly } from './date-format'

// vitest.config.ts pins TZ to America/Bogota (UTC−5, no DST): the zone where parsing a bare
// `YYYY-MM-DD` as UTC midnight shows the previous day.

describe('test timezone', () => {
  it('runs west of UTC, or every assertion below would pass for the wrong reason', () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(300)
  })
})

describe('formatDate', () => {
  it('shows a date-only value on its own day, not the previous one', () => {
    expect(formatDate('2026-08-31')).toBe('Aug 31, 2026')
  })

  it('converts a UTC timestamp to the local day', () => {
    expect(formatDate('2026-09-05T03:00:00Z')).toBe('Sep 4, 2026')
  })
})

describe('formatDateTime', () => {
  it('formats a UTC timestamp in local time', () => {
    // ICU puts a narrow no-break space (U+202F) before PM; `\s` matches it.
    expect(formatDateTime('2026-09-05T20:07:00Z')).toMatch(/^Sep 5, 2026, 3:07\sPM$/)
  })
})

describe('parseDateOnly', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const date = parseDateOnly('2026-08-31')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(7)
    expect(date?.getDate()).toBe(31)
    expect(date?.getHours()).toBe(0)
  })

  it('returns undefined for an empty value', () => {
    expect(parseDateOnly('')).toBeUndefined()
  })
})

describe('toDateOnly', () => {
  it('serializes the local day, where toISOString would roll over to the next one', () => {
    const lateEvening = new Date(2026, 7, 31, 23, 30)
    expect(lateEvening.toISOString().startsWith('2026-09-01')).toBe(true)
    expect(toDateOnly(lateEvening)).toBe('2026-08-31')
  })

  it.each(['2026-01-01', '2026-08-31', '2026-12-31'])('round-trips %s through parseDateOnly', (value) => {
    expect(toDateOnly(parseDateOnly(value)!)).toBe(value)
  })
})

describe('startOfToday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns local midnight of the current day', () => {
    vi.useFakeTimers()
    // 02:30 UTC on Sep 1 is still the evening of Aug 31 in Bogota.
    vi.setSystemTime(new Date('2026-09-01T02:30:00Z'))
    expect(toDateOnly(startOfToday())).toBe('2026-08-31')
    expect(startOfToday().getHours()).toBe(0)
  })
})
