const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const ACCESS_TOKEN_KEY = 'aurora_access_token'
export const REFRESH_TOKEN_KEY = 'aurora_refresh_token'
export const AUTH_STORAGE_KEY = 'aurora_auth'

const REFRESH_EXEMPT_PATHS = [
  '/v1/flowboard/auth/login',
  '/v1/flowboard/auth/refresh-token',
  '/v1/flowboard/auth/logout',
]

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
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
  window.location.href = '/login'
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    await redirectToLogin()
    return null
  }

  try {
    const response = await fetch(`${BASE_URL}/v1/flowboard/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (response.status !== 200) {
      await redirectToLogin()
      return null
    }

    const data: RefreshTokenResponse = await response.json()
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    return data.accessToken
  } catch {
    await redirectToLogin()
    return null
  }
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
