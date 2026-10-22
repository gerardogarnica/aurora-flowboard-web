import { describe, expect, it } from 'vitest'
import { makeBoardItem, makeColumn } from '@/test/fixtures/board'
import type { WorkItemType } from '@/features/work-items/types/work-item.types'
import {
  BOARD_FILTER_NO_VALUE,
  NO_BOARD_FILTERS,
  clearBoardFilters,
  parseBoardFilters,
  writeBoardFilter,
  type BoardFilters,
} from '../constants/board-filters'
import { filterBoardItems, getBoardFilterOptions, resolveBoardFilters } from './board-filters'

const filters = (overrides: Partial<BoardFilters>): BoardFilters => ({ ...NO_BOARD_FILTERS, ...overrides })
const codes = (columns: ReturnType<typeof filterBoardItems>) =>
  columns.flatMap((column) => column.workItems.map((item) => item.code))

describe('filterBoardItems', () => {
  const bugV2 = makeBoardItem({ code: 'BUG-V2', type: 'Bug', milestoneName: 'v2', component: 'API' })
  const bugNone = makeBoardItem({ code: 'BUG-NONE', type: 'Bug' })
  const storyV2 = makeBoardItem({ code: 'STORY-V2', type: 'Story', milestoneName: 'v2', component: 'Web' })
  const task = makeBoardItem({ code: 'TASK', type: 'TechnicalTask', milestoneName: 'v1', component: 'API' })
  const columns = [makeColumn('todo', [bugV2, bugNone]), makeColumn('doing', [storyV2, task])]

  it('returns the same array when nothing is selected', () => {
    expect(filterBoardItems(columns, NO_BOARD_FILTERS)).toBe(columns)
  })

  it('ORs the values within one field', () => {
    expect(codes(filterBoardItems(columns, filters({ type: ['Bug', 'Story'] })))).toEqual([
      'BUG-V2',
      'BUG-NONE',
      'STORY-V2',
    ])
  })

  it('ANDs the fields', () => {
    expect(codes(filterBoardItems(columns, filters({ type: ['Bug'], milestone: ['v2'] })))).toEqual(['BUG-V2'])
  })

  it('matches items without a value through the empty option', () => {
    expect(codes(filterBoardItems(columns, filters({ milestone: [BOARD_FILTER_NO_VALUE] })))).toEqual(['BUG-NONE'])
    expect(codes(filterBoardItems(columns, filters({ component: [BOARD_FILTER_NO_VALUE, 'Web'] })))).toEqual([
      'BUG-NONE',
      'STORY-V2',
    ])
  })

  it('keeps every column, the item objects and the column fields', () => {
    const result = filterBoardItems(columns, filters({ type: ['Story'] }))

    expect(result.map((column) => column.flowStateId)).toEqual(['todo', 'doing'])
    expect(result[0].workItems).toEqual([])
    expect(result[1].workItems[0]).toBe(columns[1].workItems[0])
    expect(result[1].availableTransitions).toBe(columns[1].availableTransitions)
  })
})

describe('getBoardFilterOptions', () => {
  const columns = [
    makeColumn('todo', [
      makeBoardItem({ type: 'Investigation', milestoneName: 'beta', milestoneColor: '#f00', component: 'web' }),
      makeBoardItem({ type: 'Bug', milestoneName: 'Alpha', component: 'API' }),
      makeBoardItem({ type: 'Story' }),
    ]),
    makeColumn('doing', [makeBoardItem({ type: 'Bug', milestoneName: 'Alpha', component: 'API' })]),
  ]

  it('lists types in the app order with their board counts', () => {
    const { type } = getBoardFilterOptions(columns, NO_BOARD_FILTERS)

    expect(type.map((o) => [o.label, o.count])).toEqual([
      ['Story', 1],
      ['Bug', 2],
      ['Investigation', 1],
    ])
  })

  it('lists milestones and components A→Z ignoring case, with the empty option last', () => {
    const { milestone, component } = getBoardFilterOptions(columns, NO_BOARD_FILTERS)

    expect(milestone.map((o) => [o.label, o.count])).toEqual([
      ['Alpha', 2],
      ['beta', 1],
      ['No milestone', 1],
    ])
    expect(milestone[1].identity).toEqual({ kind: 'milestone', color: '#f00' })
    expect(milestone[2]).toMatchObject({ value: BOARD_FILTER_NO_VALUE, isEmptyValue: true, identity: { kind: 'no-milestone' } })
    expect(component.map((o) => o.label)).toEqual(['API', 'web', 'No component'])
  })

  it('reads the whole board, not the other filters', () => {
    const { type } = getBoardFilterOptions(columns, filters({ milestone: ['Alpha'] }))

    expect(type.map((o) => o.label)).toEqual(['Story', 'Bug', 'Investigation'])
  })

  it('keeps a selected value missing from the board, with a count of 0', () => {
    const { milestone } = getBoardFilterOptions(columns, filters({ milestone: ['Gone'] }))

    expect(milestone.find((o) => o.value === 'Gone')).toMatchObject({ label: 'Gone', count: 0 })
  })

  it('offers nothing for an empty board', () => {
    expect(getBoardFilterOptions([makeColumn('todo')], NO_BOARD_FILTERS)).toEqual({
      type: [],
      milestone: [],
      component: [],
    })
  })
})

describe('resolveBoardFilters', () => {
  it('drops a type the frontend does not know and the board does not carry', () => {
    const columns = [makeColumn('todo', [makeBoardItem({ type: 'Epic' as WorkItemType })])]

    expect(resolveBoardFilters(filters({ type: ['Bug', 'Foo', 'Epic'] }), columns).type).toEqual(['Bug', 'Epic'])
  })

  it('returns the same object when nothing changes', () => {
    const value = filters({ type: ['Bug'], milestone: ['Gone'] })
    expect(resolveBoardFilters(value, [])).toBe(value)
  })
})

describe('board filter params', () => {
  it('reads repeated params, dropping duplicates and empty values', () => {
    const params = new URLSearchParams('type=Bug&type=Story&type=Bug&milestone=v1%2C%20v2&component=&groupBy=type')

    expect(parseBoardFilters(params)).toEqual({ type: ['Bug', 'Story'], milestone: ['v1, v2'], component: [] })
  })

  it('writes one field and keeps every other param', () => {
    const params = new URLSearchParams('selected=TST-1&groupBy=type&type=Bug&milestone=v1')

    const next = writeBoardFilter(params, 'type', ['Story', 'Investigation'])

    expect(next.getAll('type')).toEqual(['Story', 'Investigation'])
    expect(next.get('selected')).toBe('TST-1')
    expect(next.get('groupBy')).toBe('type')
    expect(next.get('milestone')).toBe('v1')
  })

  it('clears every filter but nothing else', () => {
    const params = new URLSearchParams('selected=TST-1&groupBy=type&type=Bug&milestone=v1&component=API')

    expect(clearBoardFilters(params).toString()).toBe('selected=TST-1&groupBy=type')
  })
})
