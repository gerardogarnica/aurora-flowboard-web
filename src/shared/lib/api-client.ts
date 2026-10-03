import { buildLoginPath } from './return-to'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const ACCESS_TOKEN_KEY = 'aurora_access_token'
export const REFRESH_TOKEN_KEY = 'aurora_refresh_token'
export const AUTH_STORAGE_KEY = 'aurora_auth'

const REFRESH_EXEMPT_PATHS = [
  '/v1/flowboard/auth/login',
  '/v1/flowboard/auth/refresh-token',
  '/v1/flowboard/auth/logout',
]

// How the refresh endpoint says the refresh token can no longer be used: 403 is
// Auth.InvalidRefreshToken (invalid or expired), 400 a missing token. Only these end the
// session — a 5xx, a 429 or a dropped connection is transient, and logging out on it
// would throw the user out over a wifi blip or a backend restart.
const SESSION_ENDED_STATUSES = [400, 401, 403]

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Builds an API path from a template, percent-encoding every interpolated value as exactly
 * one path segment: `apiPath\`/v1/flowboard/projects/${projectId}/board\``. Values often come
 * straight from the address bar (`:id`, `?selected=`), so without this a crafted link such as
 * `/projects/..%2Fusers%2Fmy-summary%3F/board` would send the user's token to another endpoint.
 * `encodeURIComponent` alone isn't enough: it leaves `.` as is and the URL parser resolves
 * `.` / `..` (even written `%2E%2E`) as dot segments, so those — and an empty value — are
 * refused with the 404 the backend gives any malformed id. Append a query string after it.
 */
export function apiPath(strings: TemplateStringsArray, ...values: string[]): string {
  return strings.reduce((path, part, i) => path + part + (i < values.length ? encodeSegment(values[i]) : ''), '')
}

function encodeSegment(value: string): string {
  if (value === '' || value === '.' || value === '..') throw new ApiError(404, 'Not found')
  return encodeURIComponent(value)
}

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

async function redirectToLogin() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  // Imported lazily: auth.store imports the token keys from this module, so a
  // static import here would close the cycle.
  const { useAuthStore } = await import('@/app/store/auth.store')
  useAuthStore.persist.clearStorage()
  const { pathname, search, hash } = window.location
  window.location.href = buildLoginPath(`${pathname}${search}${hash}`)
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    await redirectToLogin()
    return null
  }

  const response = await fetch(`${BASE_URL}/v1/flowboard/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (SESSION_ENDED_STATUSES.includes(response.status)) {
    await redirectToLogin()
    return null
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.detail ?? response.statusText)
  }

  const data: RefreshTokenResponse = await response.json()
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
  return data.accessToken
}

function getOrCreateRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (response.status === 401) {
    if (isRetry || REFRESH_EXEMPT_PATHS.includes(path)) {
      await redirectToLogin()
      throw new ApiError(401, 'Unauthorized')
    }

    const newToken = await getOrCreateRefresh()
    if (!newToken) {
      throw new ApiError(401, 'Unauthorized')
    }

    return apiFetch<T>(path, init, true)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.detail ?? response.statusText
    throw new ApiError(response.status, message)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
