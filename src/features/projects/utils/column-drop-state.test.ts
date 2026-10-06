import { describe, expect, it } from 'vitest'
import { getColumnDropState, type ActiveDrag } from './column-drop-state'

// todo → doing is the only permitted move.
const canMoveTo = (from: string, to: string) => from === 'todo' && to === 'doing'
const dragFromTodo: ActiveDrag = { fromStateId: 'todo', laneKey: 'lane-a' }

function stateOf(stateId: string, overrides: { activeDrag?: ActiveDrag | null; laneKey?: string; isOver?: boolean } = {}) {
  return getColumnDropState({
    activeDrag: overrides.activeDrag === undefined ? dragFromTodo : overrides.activeDrag,
    stateId,
    laneKey: overrides.laneKey ?? 'lane-a',
    isOver: overrides.isOver ?? false,
    canMoveTo,
  })
}

describe('getColumnDropState', () => {
  it('is idle while nothing is being dragged', () => {
    expect(stateOf('doing', { activeDrag: null })).toBe('idle')
  })

  it('marks the origin column as the source', () => {
    expect(stateOf('todo')).toBe('source')
  })

  it('marks a permitted column as allowed', () => {
    expect(stateOf('doing')).toBe('allowed')
  })

  it('marks a permitted column under the pointer as over', () => {
    expect(stateOf('doing', { isOver: true })).toBe('over')
  })

  it('marks a column the flow does not reach as blocked', () => {
    expect(stateOf('review')).toBe('blocked')
  })

  it('blocks every cell of another lane, even the permitted state and the origin state', () => {
    expect(stateOf('doing', { laneKey: 'lane-b' })).toBe('blocked')
    expect(stateOf('todo', { laneKey: 'lane-b' })).toBe('blocked')
  })
})
