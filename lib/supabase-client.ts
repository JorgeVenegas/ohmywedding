import { createBrowserClient } from "@supabase/ssr"

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

export function createClient() {
  const cookieDomain = getCookieDomain()
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: cookieDomain ? {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
        secure: window.location.protocol === 'https:'
      } : undefined
    }
  )
}
