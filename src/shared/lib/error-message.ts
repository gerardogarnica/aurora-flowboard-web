import { ApiError } from './api-client'

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/**
 * The one way to turn a caught error into text for a banner or a toast. An `ApiError` carries
 * the backend's ProblemDetails `detail`, written for users, so it's shown as is. Anything else
 * (a network failure's "Failed to fetch", a JS TypeError) is noise to a user, so it gives way
 * to `fallback`. So does an `ApiError` with an empty message: with no `detail`, the message
 * falls back to `statusText`, which is always empty over HTTP/2.
 */
export function getErrorMessage(error: unknown, fallback: string = GENERIC_ERROR_MESSAGE): string {
  if (error instanceof ApiError && error.message.trim() !== '') return error.message
  return fallback
}
