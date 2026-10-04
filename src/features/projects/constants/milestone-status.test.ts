import { describe, expect, it } from 'vitest'
import type { MilestoneStatus } from '../types/milestone.types'
import { getAllowedMilestoneTransitions, getMilestoneStatusBadge, isMilestoneEditable } from './milestone-status'

// Contract with the backend: mirrors the transition map in
// aurora-flowboard-api/src/Aurora.Flowboard.Domain/Milestones/Milestone.cs.
const EXPECTED: Record<MilestoneStatus, MilestoneStatus[]> = {
  Draft: ['Active', 'Archived'],
  Active: ['OnHold', 'Completed', 'Archived'],
  OnHold: ['Active', 'Archived'],
  Completed: ['Archived'],
  Archived: [],
}

describe('getAllowedMilestoneTransitions', () => {
  it.each(Object.entries(EXPECTED))('%s can move to %j', (status, allowed) => {
    expect(getAllowedMilestoneTransitions(status as MilestoneStatus)).toEqual(allowed)
  })

  it('never moves a milestone back to Draft', () => {
    for (const status of Object.keys(EXPECTED) as MilestoneStatus[]) {
      expect(getAllowedMilestoneTransitions(status)).not.toContain('Draft')
    }
  })

  it('offers no transition for a status the frontend does not know yet', () => {
    expect(getAllowedMilestoneTransitions('Cancelled' as MilestoneStatus)).toEqual([])
  })
})

describe('isMilestoneEditable', () => {
  it.each([
    ['Draft', true],
    ['Active', true],
    ['OnHold', true],
    ['Completed', false],
    ['Archived', false],
  ] as const)('%s → %s', (status, editable) => {
    expect(isMilestoneEditable(status)).toBe(editable)
  })

  it('keeps a Completed milestone frozen even though it can still be archived', () => {
    expect(isMilestoneEditable('Completed')).toBe(false)
    expect(getAllowedMilestoneTransitions('Completed')).toEqual(['Archived'])
  })
})

describe('getMilestoneStatusBadge', () => {
  it('returns the configured badge for a known status', () => {
    expect(getMilestoneStatusBadge('OnHold').label).toBe('On hold')
  })

  it('falls back to the raw name in neutral styling for an unknown status', () => {
    expect(getMilestoneStatusBadge('Cancelled' as MilestoneStatus)).toEqual({
      label: 'Cancelled',
      className: 'bg-muted text-muted-foreground',
      dotClass: 'bg-muted-foreground',
    })
  })
})
