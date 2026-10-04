import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiUrl, server } from '@/test/msw-server'
import { ACCESS_TOKEN_KEY, ApiError, AUTH_STORAGE_KEY, REFRESH_TOKEN_KEY, apiFetch } from './api-client'

const REFRESH_PATH = '/v1/flowboard/auth/refresh-token'
const PROJECTS_PATH = '/v1/flowboard/projects'

/** A protected endpoint that only accepts the `valid` access token. */
function protectedEndpoint(valid: string) {
  return http.get(apiUrl(PROJECTS_PATH), ({ request }) =>
    request.headers.get('Authorization') === `Bearer ${valid}`
      ? HttpResponse.json([{ id: 'p1' }])
      : new HttpResponse(null, { status: 401 }),
  )
}

/** A refresh endpoint answering with `respond`, counting its calls. */
function refreshEndpoint(respond: () => Response | Promise<Response>) {
  const calls = { count: 0 }
  server.use(
    http.post(apiUrl(REFRESH_PATH), async () => {
      calls.count += 1
      return respond()
    }),
  )
  return calls
}

const rotatedTokens = () => HttpResponse.json({ accessToken: 'new-access', refreshToken: 'new-refresh' })

let location: { pathname: string; search: string; hash: string; href: string }

beforeEach(() => {
  localStorage.setItem(ACCESS_TOKEN_KEY, 'old-access')
  localStorage.setItem(REFRESH_TOKEN_KEY, 'old-refresh')
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { user: { id: 'u1' } }, version: 0 }))
  location = { pathname: '/projects/p1', search: '', hash: '', href: 'http://localhost/projects/p1' }
  vi.stubGlobal('location', location)
})

function expectSessionEnded() {
  expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
  expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  expect(location.href).toBe('/login?returnTo=%2Fprojects%2Fp1')
}

function expectSessionKept() {
  expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('old-access')
  expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('old-refresh')
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull()
  expect(location.href).toBe('http://localhost/projects/p1')
}

describe('apiFetch token refresh', () => {
  it('refreshes on a 401, stores the rotated tokens and retries with the new access token', async () => {
    server.use(protectedEndpoint('new-access'))
    const refresh = refreshEndpoint(rotatedTokens)

    await expect(apiFetch(PROJECTS_PATH)).resolves.toEqual([{ id: 'p1' }])

    expect(refresh.count).toBe(1)
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('new-access')
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh')
  })

  it('shares one refresh between concurrent 401s', async () => {
    server.use(protectedEndpoint('new-access'))
    const refresh = refreshEndpoint(async () => {
      await delay(20)
      return rotatedTokens()
    })

    const results = await Promise.all([apiFetch(PROJECTS_PATH), apiFetch(PROJECTS_PATH), apiFetch(PROJECTS_PATH)])

    expect(results).toEqual([[{ id: 'p1' }], [{ id: 'p1' }], [{ id: 'p1' }]])
    expect(refresh.count).toBe(1)
  })

  it.each([400, 401, 403])('ends the session when the refresh answers %i', async (status) => {
    server.use(protectedEndpoint('new-access'))
    refreshEndpoint(() => HttpResponse.json({ detail: 'Invalid refresh token.' }, { status }))

    const error = await apiFetch(PROJECTS_PATH).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401 })
    expectSessionEnded()
  })

  it('keeps the session when the refresh fails with a 5xx, and surfaces the backend detail', async () => {
    server.use(protectedEndpoint('new-access'))
    refreshEndpoint(() => HttpResponse.json({ detail: 'Database unavailable.' }, { status: 503 }))

    const error = await apiFetch(PROJECTS_PATH).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 503, message: 'Database unavailable.' })
    expectSessionKept()
  })

  it('keeps the session when the refresh never reaches the server', async () => {
    server.use(protectedEndpoint('new-access'))
    refreshEndpoint(() => HttpResponse.error())

    await expect(apiFetch(PROJECTS_PATH)).rejects.toBeInstanceOf(TypeError)
    expectSessionKept()
  })

  it('ends the session when the retry is rejected again', async () => {
    server.use(protectedEndpoint('never-valid'))
    const refresh = refreshEndpoint(rotatedTokens)

    await expect(apiFetch(PROJECTS_PATH)).rejects.toMatchObject({ status: 401 })

    expect(refresh.count).toBe(1)
    expectSessionEnded()
  })

  it('ends the session without calling the refresh endpoint when there is no refresh token', async () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    server.use(protectedEndpoint('new-access'))
    const refresh = refreshEndpoint(rotatedTokens)

    await expect(apiFetch(PROJECTS_PATH)).rejects.toMatchObject({ status: 401 })

    expect(refresh.count).toBe(0)
    expectSessionEnded()
  })

  it('does not try to refresh a 401 from an auth endpoint', async () => {
    server.use(http.post(apiUrl('/v1/flowboard/auth/login'), () => new HttpResponse(null, { status: 401 })))
    const refresh = refreshEndpoint(rotatedTokens)

    await expect(apiFetch('/v1/flowboard/auth/login', { method: 'POST' })).rejects.toMatchObject({ status: 401 })

    expect(refresh.count).toBe(0)
  })
})
