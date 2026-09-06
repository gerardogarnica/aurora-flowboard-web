/**
 * Envelope returned by every paginated collection endpoint.
 * `page` is 1-based; `pageSize` is capped at 100 by the API.
 * A page past the end returns an empty `items` array with the real `totalCount`.
 */
export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
