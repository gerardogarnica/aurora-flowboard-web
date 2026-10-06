import { describe, expect, it } from 'vitest'
import { isBoardDropTargetData, isWorkItemDragData, makeWorkItemDragData } from './board-drag-data'

describe('isWorkItemDragData', () => {
  it('recognizes the data a board card attaches to its drag', () => {
    const data = makeWorkItemDragData({ workItemId: 'wi-1', code: 'TST-1', fromStateId: 'todo', laneKey: 'all' })
    expect(isWorkItemDragData(data)).toBe(true)
  })

  it('ignores a drag that does not come from a board card', () => {
    expect(isWorkItemDragData({ type: 'column', id: 'todo' })).toBe(false)
    expect(isWorkItemDragData({})).toBe(false)
  })

  it('ignores card-typed data with a missing field', () => {
    expect(isWorkItemDragData({ type: 'work-item', workItemId: 'wi-1', code: 'TST-1', laneKey: 'all' })).toBe(false)
  })
})

describe('isBoardDropTargetData', () => {
  it('recognizes a column or cell drop target', () => {
    expect(isBoardDropTargetData({ stateId: 'todo', laneKey: 'all' })).toBe(true)
  })

  it('ignores anything else', () => {
    expect(isBoardDropTargetData({ stateId: 'todo' })).toBe(false)
  })
})
