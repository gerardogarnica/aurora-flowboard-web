/**
 * Where to send the user after they sign in again. It travels as `?returnTo=` on /login —
 * a query param rather than router state because api-client leaves through a full page
 * reload, which would drop state.
 */
export const RETURN_TO_PARAM = 'returnTo'

export const DEFAULT_AFTER_LOGIN = '/dashboard'

/** The /login URL that brings the user back to `target` (a path plus optional search/hash). */
export function buildLoginPath(target: string): string {
  // Nothing worth remembering: the app lands there anyway.
  if (target === '/' || target === DEFAULT_AFTER_LOGIN || target.startsWith('/login')) return '/login'
  return `/login?${new URLSearchParams({ [RETURN_TO_PARAM]: target })}`
}

/**
 * The `returnTo` value if it points inside this app, else `null`. The param is attacker-
 * controlled (anyone can send a /login?returnTo= link), so only same-origin paths pass:
 * `//evil.com` and `/\evil.com` are protocol-relative URLs in the browser, and the origin
 * check also catches what the URL parser normalizes into one (tabs, newlines).
 */
export function getSafeReturnTo(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null

  const url = new URL(raw, window.location.origin)
  if (url.origin !== window.location.origin || url.pathname.startsWith('/login')) return null

  return `${url.pathname}${url.search}${url.hash}`
}
