import { describe, expect, it } from 'vitest'
import type { Priority } from '@/features/work-items/types/work-item.types'
import { makeBoardItem } from '@/test/fixtures/board'
import { insertInBoardOrder } from './board-order'

// Mirrors GetProjectBoardHandler.cs: OrderByDescending(Priority).ThenBy(CreatedOnUtc).
const ids = (items: { workItemId: string }[]) => items.map((wi) => wi.workItemId)

describe('insertInBoardOrder', () => {
  const critical = makeBoardItem({ workItemId: 'critical', priority: 'Critical' })
  const medium = makeBoardItem({ workItemId: 'medium', priority: 'Medium', createdOnUtc: '2026-09-01T12:00:00Z' })
  const low = makeBoardItem({ workItemId: 'low', priority: 'Low' })
  const column = [critical, medium, low]

  it('places a higher priority before lower ones', () => {
    const high = makeBoardItem({ workItemId: 'high', priority: 'High' })
    expect(ids(insertInBoardOrder(column, high))).toEqual(['critical', 'high', 'medium', 'low'])
  })

  it('breaks a priority tie by creation date, oldest first', () => {
    const older = makeBoardItem({ workItemId: 'older', priority: 'Medium', createdOnUtc: '2026-08-01T12:00:00Z' })
    const newer = makeBoardItem({ workItemId: 'newer', priority: 'Medium', createdOnUtc: '2026-10-01T12:00:00Z' })
    expect(ids(insertInBoardOrder(column, older))).toEqual(['critical', 'older', 'medium', 'low'])
    expect(ids(insertInBoardOrder(column, newer))).toEqual(['critical', 'medium', 'newer', 'low'])
  })

  it('compares timestamps as dates when only one has fractional seconds', () => {
    // As strings, '…00.500Z' < '…00Z' ('.' sorts before 'Z'), which would put the newer one first.
    const sameSecondLater = makeBoardItem({ workItemId: 'later', priority: 'Medium', createdOnUtc: '2026-09-01T12:00:00.500Z' })
    expect(ids(insertInBoardOrder(column, sameSecondLater))).toEqual(['critical', 'medium', 'later', 'low'])
  })

  it('puts a full tie after the existing item', () => {
    const twin = makeBoardItem({ workItemId: 'twin', priority: 'Medium', createdOnUtc: '2026-09-01T12:00:00Z' })
    expect(ids(insertInBoardOrder(column, twin))).toEqual(['critical', 'medium', 'twin', 'low'])
  })

  it('puts a priority the frontend does not know yet last', () => {
    const unknown = makeBoardItem({ workItemId: 'unknown', priority: 'Blocker' as Priority })
    expect(ids(insertInBoardOrder(column, unknown))).toEqual(['critical', 'medium', 'low', 'unknown'])
  })

  it('handles an empty column', () => {
    expect(ids(insertInBoardOrder([], low))).toEqual(['low'])
  })
})
