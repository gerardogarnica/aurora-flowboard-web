import { describe, expect, it } from 'vitest'
import type { ProjectApiStatus, ProjectKind } from '../types/project.types'
import { getAllowedTransitions } from './project-status'

// Contract with the backend: these tables mirror ContinuousTransitions / TimeboxedTransitions in
// aurora-flowboard-api/src/Aurora.Flowboard.Domain/Projects/Project.cs. If this test changes, the
// backend rule changed too — or the menu now offers a move the API will reject.
const CONTINUOUS: Record<ProjectApiStatus, ProjectApiStatus[]> = {
  Active: ['Maintenance', 'Archived'],
  Maintenance: ['Active', 'Archived'],
  Completed: [],
  Archived: [],
}

const TIMEBOXED: Record<ProjectApiStatus, ProjectApiStatus[]> = {
  Active: ['Completed', 'Archived'],
  Maintenance: [],
  Completed: ['Archived'],
  Archived: [],
}

const EXPECTED: Record<ProjectKind, Record<ProjectApiStatus, ProjectApiStatus[]>> = {
  Product: CONTINUOUS,
  Internal: CONTINUOUS,
  Client: TIMEBOXED,
  Research: TIMEBOXED,
}

const cases = Object.entries(EXPECTED).flatMap(([kind, byStatus]) =>
  Object.entries(byStatus).map(([status, allowed]) => [kind, status, allowed] as const),
)

describe('getAllowedTransitions', () => {
  it.each(cases)('%s project in %s can move to %j', (kind, status, allowed) => {
    expect(getAllowedTransitions(kind as ProjectKind, status as ProjectApiStatus)).toEqual(allowed)
  })

  it('offers no transition for a kind the frontend does not know yet', () => {
    expect(getAllowedTransitions('Experimental' as ProjectKind, 'Active')).toEqual([])
  })

  it('offers no transition for a status the frontend does not know yet', () => {
    expect(getAllowedTransitions('Product', 'Paused' as ProjectApiStatus)).toEqual([])
  })
})
