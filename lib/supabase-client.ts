import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Module-level singleton — prevents multiple client instances competing for token refresh.
// Race conditions between simultaneous getUser()/refresh calls across different instances
// are the root cause of refresh_token_already_used errors.
let _supabaseClient: SupabaseClient | null = null

// ============================================
// CIRCUIT BREAKER for token refresh 429 loop
// ============================================
// When Supabase's auto-refresh gets a 429 or 400 on the token endpoint,
// the internal flow (_callRefreshToken → _removeSession → _notifyAllSubscribers →
// getSession → _callRefreshToken) creates an infinite retry loop.
// This circuit breaker intercepts fetch calls and short-circuits them.
let _refreshFailCount = 0
const REFRESH_FAIL_LIMIT = 3
let _refreshCircuitOpen = false
let _circuitResetTimer: ReturnType<typeof setTimeout> | null = null

function isTokenRefreshUrl(url: string): boolean {
  return url.includes('/auth/v1/token') && url.includes('grant_type=refresh_token')
}

// Clear all Supabase auth cookies + storage (used by circuit breaker and sign-out)
function clearAllSupabaseData() {
  if (typeof document === 'undefined') return

  // Clear cookies
  const cookiesToClear = document.cookie.split(';').map(c => c.trim().split('=')[0])
  const domains = ['', '.ohmy.local', '.ohmy.wedding']
  if (typeof window !== 'undefined') domains.push(window.location.hostname)

  cookiesToClear.forEach(name => {
    if (name.includes('sb-') || name.includes('supabase')) {
      domains.forEach(domain => {
        const domainPart = domain ? `; domain=${domain}` : ''
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}; path=/`
      })
    }
  })

  // Clear localStorage & sessionStorage
  if (typeof window !== 'undefined') {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    } catch { /* ignore */ }
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch { /* ignore */ }
  }
}

// Wraps the global fetch to intercept token refresh requests.
// After REFRESH_FAIL_LIMIT consecutive failures (429 or 400), the circuit opens
// and all subsequent refresh requests are immediately rejected with a synthetic 503
// for 30 seconds. This breaks the infinite retry loop.
function circuitBreakerFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

  if (isTokenRefreshUrl(url)) {
    // Log the stack trace to identify WHO is triggering the refresh
    console.log('[supabase-client] refresh_token request intercepted. Stack:', new Error().stack?.split('\n').slice(1, 6).join('\n'))

    // If circuit is open, immediately return a synthetic failed response
    if (_refreshCircuitOpen) {
      console.warn('[supabase-client] Circuit breaker OPEN — blocking refresh_token request')
      return Promise.resolve(new Response(
        JSON.stringify({ error: 'circuit_breaker_open', message: 'Too many refresh failures' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    // Let the request through, then check the response
    return fetch(input, init).then(response => {
      if (response.status === 429 || response.status === 400) {
        _refreshFailCount++
        console.warn(`[supabase-client] Token refresh failed (${response.status}), count: ${_refreshFailCount}/${REFRESH_FAIL_LIMIT}`)

        if (_refreshFailCount >= REFRESH_FAIL_LIMIT) {
          _refreshCircuitOpen = true
          console.warn('[supabase-client] Circuit breaker OPENED — clearing stale auth data')
          clearAllSupabaseData()
          // Reset the singleton so no stale state remains
          _supabaseClient = null

          // Auto-reset circuit after 30s so user can try again (e.g. after signing in)
          if (_circuitResetTimer) clearTimeout(_circuitResetTimer)
          _circuitResetTimer = setTimeout(() => {
            _refreshCircuitOpen = false
            _refreshFailCount = 0
            _circuitResetTimer = null
            console.log('[supabase-client] Circuit breaker RESET')
          }, 30_000)
        }
      } else if (response.ok) {
        // Successful refresh — reset the counter
        console.log('[supabase-client] Token refresh SUCCEEDED, resetting fail counter')
        _refreshFailCount = 0
      }
      return response
    })
  }

  // Non-token-refresh requests pass through normally
  return fetch(input, init)
}

// Manually reset the circuit breaker (e.g. after successful sign-in)
export function resetCircuitBreaker(): void {
  console.log('[supabase-client] resetCircuitBreaker() called. Stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'))
  _refreshCircuitOpen = false
  _refreshFailCount = 0
  if (_circuitResetTimer) {
    clearTimeout(_circuitResetTimer)
    _circuitResetTimer = null
  }
}

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

// Reset the singleton — call this before sign-out to clear internal cached state.
// Needed when the login page clears cookies/storage: the singleton may still
// hold a stale session in memory which prevents fresh cookie reads.
export function resetClient(): void {
  console.log('[supabase-client] resetClient() called. Stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'))
  _supabaseClient = null
}

export function createClient(): SupabaseClient {
  // Return the existing singleton — all callers share one client and one refresh flow
  if (_supabaseClient) return _supabaseClient

  console.log('[supabase-client] Creating NEW Supabase client singleton. Stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'))

  const cookieDomain = getCookieDomain()
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  
  _supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: circuitBreakerFetch,
      },
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
