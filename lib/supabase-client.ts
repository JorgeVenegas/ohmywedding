import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton managed by US, not by @supabase/ssr's internal cache.
// We set isSingleton: false so our resetClient() actually works.
let _supabaseClient: SupabaseClient | null = null

// Get cookie domain for cross-subdomain cookie sharing
function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return undefined
  }
  if (hostname === 'ohmy.local' || hostname.endsWith('.ohmy.local')) {
    return '.ohmy.local'
  }
  if (hostname === 'ohmy.wedding' || hostname.endsWith('.ohmy.wedding')) {
    return '.ohmy.wedding'
  }
  return undefined
}

/**
 * Reset the singleton client. Call after signing out so the next
 * createClient() call creates a fresh instance without stale state.
 */
export function resetClient(): void {
  _supabaseClient = null
}

/**
 * Get or create the Supabase browser client singleton.
 * Uses cookies (via @supabase/ssr) for session storage so tokens
 * are available to both client-side code and the middleware.
 */
export function createClient(): SupabaseClient {
  if (_supabaseClient) return _supabaseClient

  const cookieDomain = getCookieDomain()
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'

  _supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Disable @supabase/ssr's internal singleton so our resetClient() works.
      // Without this, the library caches the client internally and our
      // resetClient() (setting _supabaseClient = null) has no effect.
      isSingleton: false,
      cookieOptions: {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 365 // 1 year
      },
      // Note: createBrowserClient internally forces detectSessionInUrl: true
      // and flowType: 'pkce' regardless of what we pass here. The auth callback
      // page relies on this auto-detection — see /auth/callback/page.tsx.
    }
  )

  return _supabaseClient
}
