const BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aurora_access_token')
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (response.status === 401) {
    localStorage.removeItem('aurora_access_token')
    window.location.href = '/login'
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.detail ?? response.statusText
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}
