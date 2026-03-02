import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Module-level singleton — prevents multiple client instances competing for token refresh.
// Race conditions between simultaneous getUser()/refresh calls across different instances
// are the root cause of refresh_token_already_used errors.
let _supabaseClient: SupabaseClient | null = null

// Get the cookie domain for subdomain sharing
function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  
  const hostname = window.location.hostname
  
  // For localhost/IP, don't set domain (cookies work automatically)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return undefined
  }
  
  // For ohmy.local and subdomains, use .ohmy.local
  if (hostname === 'ohmy.local' || hostname.endsWith('.ohmy.local')) {
    return '.ohmy.local'
  }
  
  // For ohmy.wedding and subdomains, use .ohmy.wedding
  if (hostname === 'ohmy.wedding' || hostname.endsWith('.ohmy.wedding')) {
    return '.ohmy.wedding'
  }
  
  return undefined
}

export function createClient(): SupabaseClient {
  // Return the existing singleton — all callers share one client and one refresh flow
  if (_supabaseClient) return _supabaseClient

  const cookieDomain = getCookieDomain()
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  
  _supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: '/',
        // Use 'lax' for Safari compatibility - 'none' can cause ITP issues
        sameSite: 'lax',
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 365 // 1 year in seconds
      }
    }
  )

  return _supabaseClient
}
