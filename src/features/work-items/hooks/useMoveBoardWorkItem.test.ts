import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'
import { makeBoardItem, makeColumn } from '@/test/fixtures/board'
import { apiUrl, server } from '@/test/msw-server'
import { createTestQueryClient, createWrapper } from '@/test/query-wrapper'
import { queryKeys } from '@/shared/lib/query-keys'
import { useMoveBoardWorkItem } from './useMoveBoardWorkItem'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const PROJECT_ID = 'p1'
const MOVE_URL = apiUrl('/v1/flowboard/work-items/:workItemId/move')

const card = makeBoardItem({ workItemId: 'wi-drag', code: 'TST-77', priority: 'Medium' })
const second = makeBoardItem({ workItemId: 'wi-second', code: 'TST-78', priority: 'Low' })
const urgent = makeBoardItem({ workItemId: 'wi-urgent', priority: 'High' })
const minor = makeBoardItem({ workItemId: 'wi-minor', priority: 'Low', createdOnUtc: '2026-08-01T12:00:00Z' })

const board: ProjectBoardColumn[] = [
  makeColumn('todo', [card, second], { flowStateName: 'To Do' }),
  makeColumn('doing', [urgent, minor], { flowStateName: 'Doing' }),
]

const boardKey = queryKeys.projects.board(PROJECT_ID)
const moveCard = { workItemId: card.workItemId, code: card.code, toStateId: 'doing', toStateName: 'Doing' }
const moveSecond = { workItemId: second.workItemId, code: second.code, toStateId: 'doing', toStateName: 'Doing' }

let client: QueryClient

beforeEach(() => {
  client = createTestQueryClient()
  client.setQueryData(boardKey, board)
})

function renderMove() {
  return renderHook(() => useMoveBoardWorkItem(PROJECT_ID), { wrapper: createWrapper(client) })
}

const columnIds = (stateId: string) =>
  client
    .getQueryData<ProjectBoardColumn[]>(boardKey)
    ?.find((c) => c.flowStateId === stateId)
    ?.workItems.map((wi) => wi.workItemId)

describe('useMoveBoardWorkItem', () => {
  it('moves the card into its sorted place and keeps it pending until the server answers', async () => {
    let respond!: () => void
    const answered = new Promise<void>((resolve) => (respond = resolve))
    server.use(
      http.patch(MOVE_URL, async () => {
        await answered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() => expect(columnIds('doing')).toEqual([urgent.workItemId, card.workItemId, minor.workItemId]))
    expect(columnIds('todo')).toEqual([second.workItemId])
    expect(result.current.pendingIds.has(card.workItemId)).toBe(true)

    respond()
    await waitFor(() => expect(result.current.pendingIds.has(card.workItemId)).toBe(false))
  })

  it('releases each card on its own when two cards move at once', async () => {
    let respondFirst!: () => void
    const firstAnswered = new Promise<void>((resolve) => (respondFirst = resolve))
    server.use(
      http.patch(MOVE_URL, async ({ params }) => {
        if (params.workItemId === card.workItemId) await firstAnswered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderMove()

    act(() => result.current.move(moveCard))
    act(() => result.current.move(moveSecond))

    await waitFor(() => expect(result.current.pendingIds.has(second.workItemId)).toBe(false))
    expect(result.current.pendingIds.has(card.workItemId)).toBe(true)

    respondFirst()
    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
  })

  it('rolls the board back, toasts the backend reason and releases the card when the move is rejected', async () => {
    server.use(
      http.patch(MOVE_URL, () =>
        HttpResponse.json(
          { detail: 'No transition is defined between the current state and the target state' },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No transition is defined between the current state and the target state — changes reverted',
      ),
    )
    expect(client.getQueryData(boardKey)).toEqual(board)
    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
  })

  it('toasts the fallback when the network fails', async () => {
    server.use(http.patch(MOVE_URL, () => HttpResponse.error()))
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't move the work item — changes reverted"),
    )
    expect(client.getQueryData(boardKey)).toEqual(board)
  })

  it('invalidates the detail, activity and board, but not the Sidebar summary or the project list', async () => {
    server.use(http.patch(MOVE_URL, () => new HttpResponse(null, { status: 204 })))
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    // pendingIds empties in mutateAsync's finally, after onSettled has invalidated.
    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      queryKeys.workItems.detail(card.code),
      queryKeys.workItems.activity(card.workItemId),
      boardKey,
    ])
  })

  it('also refreshes every project detail when the move is forbidden (the role may have changed)', async () => {
    server.use(
      http.patch(MOVE_URL, () =>
        HttpResponse.json({ detail: 'Project members with the Viewer role cannot modify work items' }, { status: 403 }),
      ),
    )
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
    const { result } = renderMove()

    act(() => result.current.move(moveCard))

    await waitFor(() => expect(result.current.pendingIds.size).toBe(0))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.projects.details())
  })
})
