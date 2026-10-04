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
import type { WorkItemDetailResponse } from '../types/work-item.types'
import { useMoveWorkItem } from './useMoveWorkItem'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const PROJECT_ID = 'p1'
const MOVE_URL = apiUrl('/v1/flowboard/work-items/:workItemId/move')

const card = makeBoardItem({ workItemId: 'wi-move', code: 'TST-42' })
const other = makeBoardItem()
const alreadyDone = makeBoardItem()

const board: ProjectBoardColumn[] = [
  makeColumn('todo', [card, other], { flowStateName: 'To Do' }),
  makeColumn('done', [alreadyDone], { flowStateName: 'Done' }),
]

const detail = {
  workItemId: card.workItemId,
  code: card.code,
  flowStateId: 'todo',
  flowStateName: 'To Do',
} as WorkItemDetailResponse

const boardKey = queryKeys.projects.board(PROJECT_ID)
const detailKey = queryKeys.workItems.detail(card.code)
const toDone = { toStateId: 'done', toStateName: 'Done' }

let client: QueryClient

beforeEach(() => {
  client = createTestQueryClient()
})

function renderMove() {
  return renderHook(() => useMoveWorkItem(card.workItemId, card.code, PROJECT_ID), {
    wrapper: createWrapper(client),
  })
}

function seedCaches() {
  client.setQueryData(boardKey, board)
  client.setQueryData(detailKey, detail)
}

const columnIds = (columns: ProjectBoardColumn[] | undefined, stateId: string) =>
  columns?.find((c) => c.flowStateId === stateId)?.workItems.map((wi) => wi.workItemId)

describe('useMoveWorkItem', () => {
  it('moves the card and patches the detail before the server answers', async () => {
    let respond!: () => void
    const answered = new Promise<void>((resolve) => (respond = resolve))
    server.use(
      http.patch(MOVE_URL, async () => {
        await answered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    seedCaches()
    const { result } = renderMove()

    act(() => result.current.mutate(toDone))

    await waitFor(() => expect(columnIds(client.getQueryData(boardKey), 'done')).toContain(card.workItemId))
    const columns = client.getQueryData<ProjectBoardColumn[]>(boardKey)
    expect(columnIds(columns, 'todo')).toEqual([other.workItemId])
    expect(columnIds(columns, 'done')).toEqual([alreadyDone.workItemId, card.workItemId])
    expect(columns?.[1].workItems[1]).toMatchObject({ flowStateId: 'done', flowStateName: 'Done' })
    expect(client.getQueryData(detailKey)).toMatchObject({ flowStateId: 'done', flowStateName: 'Done' })
    expect(result.current.isPending).toBe(true)

    respond()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls both caches back and toasts the backend reason when the move is rejected', async () => {
    server.use(
      http.patch(MOVE_URL, () =>
        HttpResponse.json({ detail: 'Transition not allowed for your role.' }, { status: 409 }),
      ),
    )
    seedCaches()
    const { result } = renderMove()

    act(() => result.current.mutate(toDone))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(boardKey)).toEqual(board)
    expect(client.getQueryData(detailKey)).toEqual(detail)
    expect(toast.error).toHaveBeenCalledWith('Transition not allowed for your role. — changes reverted')
  })

  it('invalidates the detail, activity, board, Sidebar summary and project list on settle', async () => {
    server.use(http.patch(MOVE_URL, () => new HttpResponse(null, { status: 204 })))
    seedCaches()
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
    const { result } = renderMove()

    act(() => result.current.mutate(toDone))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      detailKey,
      queryKeys.workItems.activity(card.workItemId),
      boardKey,
      queryKeys.mySummary(),
      queryKeys.projects.list(),
    ])
  })

  it('does not seed a board that was never loaded', async () => {
    server.use(http.patch(MOVE_URL, () => new HttpResponse(null, { status: 204 })))
    client.setQueryData(detailKey, detail)
    const { result } = renderMove()

    act(() => result.current.mutate(toDone))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(boardKey)).toBeUndefined()
    expect(client.getQueryData(detailKey)).toMatchObject({ flowStateId: 'done' })
  })
})
