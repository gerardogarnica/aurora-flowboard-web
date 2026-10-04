import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw-server'

// A request no handler covers fails the test instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  // Without `globals`, Testing Library can't register its own cleanup.
  cleanup()
  localStorage.clear()
})

afterAll(() => server.close())
