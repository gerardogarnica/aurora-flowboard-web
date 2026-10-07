import { describe, expect, it } from 'vitest'
import { makeColumn } from '@/test/fixtures/board'
import { canMoveTo } from './board-drop-targets'

// Mirrors the backend contract: GetProjectBoardHandler.cs returns each column's
// availableTransitions already filtered by the user's role, Completed / Cancelled included.
const columns = [
  makeColumn('todo', [], {
    availableTransitions: [
      { toStateId: 'doing', toStateName: 'Doing' },
      { toStateId: 'done', toStateName: 'Done' }, // a Completed state: not a board column
    ],
  }),
  makeColumn('doing', [], { availableTransitions: [] }),
  makeColumn('review'),
]

describe('canMoveTo', () => {
  it('allows a transition that lands on a board column', () => {
    expect(canMoveTo(columns, 'todo', 'doing')).toBe(true)
  })

  it('rejects a column the flow does not reach from the origin', () => {
    expect(canMoveTo(columns, 'todo', 'review')).toBe(false)
  })

  it('rejects the origin column itself', () => {
    expect(canMoveTo(columns, 'todo', 'todo')).toBe(false)
  })

  it('rejects a permitted destination that is not a board column (Completed / Cancelled)', () => {
    expect(canMoveTo(columns, 'todo', 'done')).toBe(false)
  })

  it('rejects everything from a column without permitted transitions', () => {
    expect(canMoveTo(columns, 'doing', 'todo')).toBe(false)
  })

  it('rejects everything when the backend sent no availableTransitions', () => {
    expect(canMoveTo(columns, 'review', 'todo')).toBe(false)
  })

  it('rejects an origin that is not on the board', () => {
    expect(canMoveTo(columns, 'gone', 'doing')).toBe(false)
  })
})
