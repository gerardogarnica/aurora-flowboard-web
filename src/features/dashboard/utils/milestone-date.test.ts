import { describe, expect, it } from 'vitest'
import { getMilestoneDate } from './milestone-date'

const TODAY = new Date(2026, 10, 7)

describe('getMilestoneDate', () => {
  it('has no tone without a date', () => {
    expect(getMilestoneDate(null, 5, 1, TODAY)).toEqual({ label: 'No target date', tone: 'neutral' })
  })

  it('is red once past', () => {
    expect(getMilestoneDate('2026-11-04', 6, 3, TODAY)).toEqual({ label: '3d past', tone: 'overdue' })
  })

  it('stays red past the date even when nearly done', () => {
    expect(getMilestoneDate('2026-11-06', 10, 9, TODAY).tone).toBe('overdue')
  })

  it('reads the date as a local day, not UTC midnight', () => {
    expect(getMilestoneDate('2026-11-07', 4, 0, TODAY)).toEqual({ label: 'today', tone: 'soon' })
  })

  it('is amber within 7 days below 80%, and gray at 80%', () => {
    expect(getMilestoneDate('2026-11-14', 10, 7, TODAY)).toEqual({ label: 'in 7d', tone: 'soon' })
    expect(getMilestoneDate('2026-11-14', 10, 8, TODAY)).toEqual({ label: 'in 7d', tone: 'neutral' })
  })

  it('is gray beyond 7 days', () => {
    expect(getMilestoneDate('2026-11-15', 10, 0, TODAY)).toEqual({ label: 'in 8d', tone: 'neutral' })
  })

  it('is always gray with no linked items, even overdue', () => {
    expect(getMilestoneDate('2026-11-01', 0, 0, TODAY)).toEqual({ label: '6d past', tone: 'neutral' })
    expect(getMilestoneDate('2026-11-08', 0, 0, TODAY)).toEqual({ label: 'in 1d', tone: 'neutral' })
  })
})
