import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get the cookie domain for subdomain sharing
function getCookieDomain(host: string): string | undefined {
  // For localhost/IP, don't set domain
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || /^(\d{1,3}\.){3}\d{1,3}/.test(host)) {
    return undefined
  }
  
  // Remove port if present
  const hostname = host.split(':')[0]
  
  // For ohmy.local and subdomains
  if (hostname === 'ohmy.local' || hostname.endsWith('.ohmy.local')) {
    return '.ohmy.local'
  }
  
  // For ohmy.wedding and subdomains
  if (hostname === 'ohmy.wedding' || hostname.endsWith('.ohmy.wedding')) {
    return '.ohmy.wedding'
  }
  
  return undefined
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirect") || "/"
  const origin = requestUrl.origin

  console.log('[AuthCallback] Processing callback, code:', code ? 'present' : 'missing', 'redirectTo:', redirectTo)

  if (!code) {
    console.warn('[AuthCallback] No code in callback URL, redirecting to /')
    return NextResponse.redirect(new URL("/", origin))
  }

  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const cookieDomain = getCookieDomain(host)

  console.log('[AuthCallback] Host:', host, 'Cookie domain:', cookieDomain)

  // Track cookies that need to be set on the response — cookieStore.set() can silently
  // fail to be included when returning a NextResponse, so we set cookies on the response directly.
  const cookiesToSetOnResponse: { name: string; value: string; options: any }[] = []
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToSetOnResponse.push({ name, value, options })
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('[AuthCallback] Code exchange failed:', error.message)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, origin))
  }

  console.log('[AuthCallback] Code exchange succeeded, user:', data.user?.email, 'cookies to set:', cookiesToSetOnResponse.length)

  // Build the redirect response and set auth cookies directly on it.
  const response = NextResponse.redirect(new URL(redirectTo, origin))
  
  cookiesToSetOnResponse.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })
  })

  console.log('[AuthCallback] Set', cookiesToSetOnResponse.length, 'cookies on response, redirecting to:', redirectTo)

  return response
}
