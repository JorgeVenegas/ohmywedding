import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

  if (!code) {
    return NextResponse.redirect(new URL("/", origin))
  }

  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const cookieDomain = getCookieDomain(host)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Add cookie domain for cross-subdomain sharing
              // Use sameSite: 'lax' for server-side auth callbacks for best Safari compatibility
              const cookieOptions = {
                ...options,
                path: '/',
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  await supabase.auth.exchangeCodeForSession(code)

  return NextResponse.redirect(new URL(redirectTo, origin))
}
