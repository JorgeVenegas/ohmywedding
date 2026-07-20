// Tracks which audience-specific landing page (/couples or /planners) a visitor
// came from, so pages reached from there (create-wedding, login, demo, upgrade,
// gift...) can send them back to the right place instead of always the root chooser.

import { getCleanAdminUrl } from './admin-url'

export type LandingSource = 'couples' | 'planners'

const LANDING_SOURCES: LandingSource[] = ['couples', 'planners']

export function isLandingSource(value: string | null | undefined): value is LandingSource {
  return !!value && (LANDING_SOURCES as string[]).includes(value)
}

/**
 * Appends `from=<source>` to a relative href, preserving any existing query string.
 * No-op if source is falsy. Accepts a raw string so a `from` param read from
 * `searchParams` can be forwarded along without re-validating at every call site —
 * `resolveLandingBackHref` is what actually validates it on the reading end.
 */
export function withLandingSource(href: string, source?: string | null): string {
  if (!source) return href
  const [path, query] = href.split('?')
  const params = new URLSearchParams(query)
  params.set('from', source)
  return `${path}?${params.toString()}`
}

/**
 * Resolves the "back to landing" href from a `from` search param.
 * Falls back to the root chooser ("/") when `from` is missing or unrecognized.
 * Pass `hash` to append a fragment (e.g. "pricing") — only applied when a real
 * landing source was resolved, since the root chooser has no such sections.
 */
export function resolveLandingBackHref(from: string | null | undefined, hash?: string): string {
  if (!isLandingSource(from)) return '/'
  return hash ? `/${from}#${hash}` : `/${from}`
}

/**
 * Resolves the best available "back" destination for pages that can be reached
 * either from the authenticated admin dashboard (a `weddingId` query param is
 * present — return there) or from one of the audience landing pages (fall back
 * to `resolveLandingBackHref`). Use this instead of `resolveLandingBackHref`
 * directly on any page that's also linked to from within `app/admin/...`.
 */
export function resolveBackHref(
  params: { weddingId?: string | null; from?: string | null },
  hash?: string
): string {
  if (params.weddingId) return getCleanAdminUrl(params.weddingId, 'dashboard')
  return resolveLandingBackHref(params.from, hash)
}
