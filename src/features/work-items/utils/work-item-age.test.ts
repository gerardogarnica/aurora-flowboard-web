import { describe, expect, it } from 'vitest'
import { getDaysInState, getWorkItemAgeLevel } from './work-item-age'

const NOW = Date.parse('2026-11-07T12:00:00Z')
const HOUR = 60 * 60 * 1000

describe('getDaysInState', () => {
  it('counts full 24-hour blocks: 6 days and 23 hours is still 6', () => {
    expect(getDaysInState(new Date(NOW - (6 * 24 + 23) * HOUR).toISOString(), NOW)).toBe(6)
    expect(getDaysInState(new Date(NOW - 7 * 24 * HOUR).toISOString(), NOW)).toBe(7)
  })

  it('never goes negative when the server clock is ahead', () => {
    expect(getDaysInState(new Date(NOW + HOUR).toISOString(), NOW)).toBe(0)
  })
})

describe('getWorkItemAgeLevel', () => {
  it.each([
    [0, 'neutral'],
    [3, 'neutral'],
    [4, 'warning'],
    [6, 'warning'],
    [7, 'stalled'],
    [40, 'stalled'],
  ])('an in-flight item with %i days is %s', (days, level) => {
    expect(getWorkItemAgeLevel('InFlight', days)).toBe(level)
  })

  it('a backlog item never alarms', () => {
    expect(getWorkItemAgeLevel('Backlog', 34)).toBe('neutral')
  })

  it('no stage, or one the frontend does not know, stays neutral', () => {
    expect(getWorkItemAgeLevel(undefined, 34)).toBe('neutral')
    expect(getWorkItemAgeLevel(null, 34)).toBe('neutral')
    expect(getWorkItemAgeLevel('Parked' as never, 34)).toBe('neutral')
  })
})
