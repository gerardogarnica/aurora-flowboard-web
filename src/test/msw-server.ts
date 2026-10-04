import { setupServer } from 'msw/node'

/** No default handlers: each test declares the endpoints it talks to with `server.use(...)`. */
export const server = setupServer()

/** The absolute URL `apiFetch` requests for an API path, for matching it in a handler. */
export function apiUrl(path: string): string {
  return `${import.meta.env.VITE_API_BASE_URL}${path}`
}
