import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { apiUrl, server } from '@/test/msw-server'
import { createTestQueryClient, createWrapper } from '@/test/query-wrapper'
import type { PagedResult } from '@/shared/types/paged-result.types'
import type { ProjectChangeLog } from '../types/project.types'
import { useAddProjectMember } from './useAddProjectMember'
import { useProjectChangeLogs } from './useProjectChangeLogs'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const PROJECT_ID = 'p1'
const CHANGE_LOGS_URL = apiUrl('/v1/flowboard/projects/:projectId/change-logs')

function makeLog(id: string): ProjectChangeLog {
  return {
    id,
    changedById: 'u1',
    changedByFullName: 'Ada Lovelace',
    changedByInitials: 'AL',
    changeType: 'Updated',
    affectedEntityId: null,
    affectedEntityName: null,
    newStatus: null,
    changedOnUtc: '2026-10-14T12:00:00Z',
  }
}

function pageOf(items: ProjectChangeLog[], page = 1): PagedResult<ProjectChangeLog> {
  return { items, page, pageSize: 20, totalCount: items.length, totalPages: 1 }
}

let client: QueryClient

beforeEach(() => {
  client = createTestQueryClient()
})

describe('useProjectChangeLogs', () => {
  it('requests the given page with the default page size', async () => {
    let requested: URL | undefined
    server.use(
      http.get(CHANGE_LOGS_URL, ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json(pageOf([makeLog('c1')], 3))
      }),
    )

    const { result } = renderHook(() => useProjectChangeLogs(PROJECT_ID, 3, true), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(requested?.pathname).toBe('/v1/flowboard/projects/p1/change-logs')
    expect(requested?.searchParams.get('page')).toBe('3')
    expect(requested?.searchParams.get('pageSize')).toBe('20')
  })

  it("doesn't fetch while disabled", () => {
    // No handler: the MSW server fails the test on any request.
    const { result } = renderHook(() => useProjectChangeLogs(PROJECT_ID, 1, false), {
      wrapper: createWrapper(client),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  // The change-log key sits under the project detail, so mutations that only invalidate the
  // detail also refresh the history they just wrote to.
  it('refetches after a member is added to the project', async () => {
    let calls = 0
    server.use(
      http.get(CHANGE_LOGS_URL, () => {
        calls += 1
        return HttpResponse.json(pageOf(calls === 1 ? [] : [makeLog('added')]))
      }),
      http.post(apiUrl('/v1/flowboard/projects/:projectId/members'), () => new HttpResponse(null, { status: 202 })),
    )

    const { result } = renderHook(
      () => ({ logs: useProjectChangeLogs(PROJECT_ID, 1, true), add: useAddProjectMember() }),
      { wrapper: createWrapper(client) },
    )
    await waitFor(() => expect(result.current.logs.data?.totalCount).toBe(0))

    act(() => result.current.add.mutate({ projectId: PROJECT_ID, userId: 'u2', role: 'Developer' }))

    await waitFor(() => expect(result.current.logs.data?.items.map((l) => l.id)).toEqual(['added']))
  })
})
