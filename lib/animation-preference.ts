'use client'

/**
 * Global "are scroll-reveal / entrance animations disabled" flag.
 *
 * Deliberately a tiny module-level store rather than React context: useScrollAnimation
 * has ~30 callers spread across every wedding section and none of them sit inside a
 * dedicated provider, so a context would mean wrapping the whole tree (and paying a
 * re-render fan-out) for one boolean. useSyncExternalStore gives the same
 * subscribe/notify behaviour with none of that.
 *
 * Two independent sources can disable animations:
 *  - the persisted `siteSettings.animationsEnabled === false` page-config setting,
 *    pushed in via setConfigAnimationsDisabled() from config-based-wedding-renderer
 *  - a hard runtime override, `window.__omwForceNoAnimations`, set by the screenshot
 *    capture (lib/screenshot.ts) before any page script runs. This path is used
 *    instead of the `?capture=1` query param because the subdomain-enforcement
 *    redirect in middleware.ts strips query strings, whereas an injected global
 *    survives every navigation.
 */

import { useSyncExternalStore } from 'react'

let configDisabled = false
const listeners = new Set<() => void>()

function forcedOff(): boolean {
  if (typeof window === 'undefined') return false
  if ((window as unknown as { __omwForceNoAnimations?: boolean }).__omwForceNoAnimations === true) return true
  // Manual fallback for direct captures that keep the query string.
  return new URLSearchParams(window.location.search).get('capture') === '1'
}

export function animationsDisabled(): boolean {
  return configDisabled || forcedOff()
}

/** Push the persisted page-config value. `enabled === false` disables animations. */
export function setConfigAnimationsDisabled(disabled: boolean): void {
  if (disabled === configDisabled) return
  configDisabled = disabled
  listeners.forEach(fn => fn())
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// Server always renders with animations "enabled" (nothing has loaded yet); the client
// reconciles on mount once page config resolves or the capture override is seen.
function serverSnapshot(): boolean {
  return false
}

export function useAnimationsDisabled(): boolean {
  return useSyncExternalStore(subscribe, animationsDisabled, serverSnapshot)
}
