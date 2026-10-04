import { describe, expect, it } from 'vitest'
import { makeBoardItem, makeColumn } from '@/test/fixtures/board'
import type { WorkItemType } from '@/features/work-items/types/work-item.types'
import type { ProjectMilestone } from '../types/milestone.types'
import { groupBoardItems } from './group-board-items'

const labels = (groups: { label: string }[]) => groups.map((g) => g.label)

function milestone(name: string, targetStartDate: string | null): ProjectMilestone {
  return {
    id: `ms-${name}`,
    name,
    description: null,
    color: '#0ea5e9',
    status: 'Active',
    targetStartDate,
    targetEndDate: null,
    createdBy: 'user-1',
    createdOnUtc: '2026-09-01T12:00:00Z',
    updatedOnUtc: null,
  }
}

describe('groupBoardItems', () => {
  it('splits items into cells per flow state, keeping the API order, and counts them', () => {
    const a = makeBoardItem({ component: 'API' })
    const b = makeBoardItem({ component: 'API' })
    const c = makeBoardItem({ component: 'API' })
    const columns = [makeColumn('todo', [a, b]), makeColumn('doing', [c]), makeColumn('done')]

    const [group] = groupBoardItems(columns, 'component')

    expect(group.total).toBe(3)
    expect(group.cells.todo.map((wi) => wi.workItemId)).toEqual([a.workItemId, b.workItemId])
    expect(group.cells.doing.map((wi) => wi.workItemId)).toEqual([c.workItemId])
    expect(group.cells.done).toBeUndefined()
  })

  it('returns only groups that have items', () => {
    expect(groupBoardItems([makeColumn('todo'), makeColumn('done')], 'assignee')).toEqual([])
  })

  describe('by assignee', () => {
    const columns = [
      makeColumn('todo', [
        makeBoardItem({ assigneeId: 'u-zoe', assigneeFullName: 'zoe Park', assigneeInitials: 'ZP' }),
        makeBoardItem({ assigneeId: null }),
        makeBoardItem({ assigneeId: 'u-me', assigneeFullName: 'Yara Me', assigneeInitials: 'YM' }),
        makeBoardItem({ assigneeId: 'u-ana', assigneeFullName: 'Ana Ruiz', assigneeInitials: 'AR' }),
      ]),
    ]

    it('puts the current user first, then A→Z ignoring case, and Unassigned last', () => {
      const groups = groupBoardItems(columns, 'assignee', { currentUserId: 'u-me' })

      expect(labels(groups)).toEqual(['Yara Me', 'Ana Ruiz', 'zoe Park', 'Unassigned'])
      expect(groups[0].isCurrentUser).toBe(true)
      expect(groups[3]).toMatchObject({ isEmptyValue: true, identity: { kind: 'unassigned' } })
    })

    it('sorts purely A→Z when there is no current user', () => {
      expect(labels(groupBoardItems(columns, 'assignee'))).toEqual(['Ana Ruiz', 'Yara Me', 'zoe Park', 'Unassigned'])
    })

    it('falls back to "Unknown" and "?" when the name and initials are missing', () => {
      const [group] = groupBoardItems(
        [makeColumn('todo', [makeBoardItem({ assigneeId: 'u-x', assigneeFullName: null, assigneeInitials: null })])],
        'assignee',
      )

      expect(group.label).toBe('Unknown')
      expect(group.identity).toEqual({ kind: 'assignee', userId: 'u-x', initials: '?' })
    })
  })

  describe('by type', () => {
    it('follows the WORK_ITEM_TYPE_CONFIG order', () => {
      const columns = [
        makeColumn('todo', [
          makeBoardItem({ type: 'Investigation' }),
          makeBoardItem({ type: 'Bug' }),
          makeBoardItem({ type: 'Story' }),
          makeBoardItem({ type: 'TechnicalTask' }),
        ]),
      ]

      expect(labels(groupBoardItems(columns, 'type'))).toEqual(['Story', 'Bug', 'Technical Task', 'Investigation'])
    })

    it('puts a type the frontend does not know yet after the known ones, labelled with its raw name', () => {
      const columns = [
        makeColumn('todo', [makeBoardItem({ type: 'Epic' as WorkItemType }), makeBoardItem({ type: 'Bug' })]),
      ]

      expect(labels(groupBoardItems(columns, 'type'))).toEqual(['Bug', 'Epic'])
    })

    it('sorts several unknown types A→Z among themselves', () => {
      const columns = [
        makeColumn('todo', [
          makeBoardItem({ type: 'spike' as WorkItemType }),
          makeBoardItem({ type: 'Story' }),
          makeBoardItem({ type: 'Epic' as WorkItemType }),
        ]),
      ]

      expect(labels(groupBoardItems(columns, 'type'))).toEqual(['Story', 'Epic', 'spike'])
    })
  })

  describe('by milestone', () => {
    const columns = [
      makeColumn('todo', [
        makeBoardItem({ milestoneName: 'Undated B' }),
        makeBoardItem({ milestoneName: null }),
        makeBoardItem({ milestoneName: 'Late' }),
        makeBoardItem({ milestoneName: 'undated a' }),
        makeBoardItem({ milestoneName: 'Early', milestoneColor: '#22c55e' }),
      ]),
    ]
    const milestones = [
      milestone('Late', '2026-11-01'),
      milestone('Early', '2026-09-15'),
      milestone('Undated B', null),
      milestone('undated a', null),
    ]

    it('orders by start date, then undated lanes A→Z, and No milestone last', () => {
      const groups = groupBoardItems(columns, 'milestone', { milestones })

      expect(labels(groups)).toEqual(['Early', 'Late', 'undated a', 'Undated B', 'No milestone'])
      expect(groups[0].identity).toEqual({ kind: 'milestone', color: '#22c55e' })
      expect(groups[4]).toMatchObject({ isEmptyValue: true, identity: { kind: 'no-milestone' } })
    })

    it('falls back to A→Z while the milestones are still loading', () => {
      expect(labels(groupBoardItems(columns, 'milestone'))).toEqual([
        'Early',
        'Late',
        'undated a',
        'Undated B',
        'No milestone',
      ])
    })

    it('merges two milestones that share a name (documented limitation)', () => {
      const groups = groupBoardItems(
        [makeColumn('todo', [makeBoardItem({ milestoneName: 'v1' }), makeBoardItem({ milestoneName: 'v1' })])],
        'milestone',
      )

      expect(groups).toHaveLength(1)
      expect(groups[0].total).toBe(2)
    })
  })

  describe('by component', () => {
    it('sorts A→Z with No component last', () => {
      const columns = [
        makeColumn('todo', [
          makeBoardItem({ component: 'Web' }),
          makeBoardItem({ component: null }),
          makeBoardItem({ component: 'api' }),
        ]),
      ]

      const groups = groupBoardItems(columns, 'component')

      expect(labels(groups)).toEqual(['api', 'Web', 'No component'])
      expect(groups[2].isEmptyValue).toBe(true)
    })
  })
})
