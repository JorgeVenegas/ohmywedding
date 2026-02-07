import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Base domain for the application (without protocol)
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ohmy.wedding'

// Local development domain for subdomain testing
const LOCAL_DOMAIN = 'ohmy.local'

// Reserved subdomains that should not be treated as wedding IDs
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'mail', 'blog', 'help', 'support', 'status', 'superadmin']

// Paths on the main domain that should not be treated as wedding name IDs
const RESERVED_PATHS = ['','_next','api','auth','admin','create-wedding','login','upgrade','demo','success','favicon.ico','fonts','videos','images','site.webmanifest','superadmin']

/**
 * Extract subdomain from hostname
 * Examples:
 * - demo-luxury-noir.ohmy.wedding -> demo-luxury-noir
 * - www.ohmy.wedding -> www
 * - ohmy.wedding -> null
 * - localhost:3000 -> null
 */
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Check if this is a localhost or IP address (no subdomain handling)
  if (host === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return null
  }
  
  // Get the base domain without www
  const baseDomain = BASE_DOMAIN.replace(/^www\./, '')
  
  // Check both production domain and local development domain
  const domainsToCheck = [baseDomain, LOCAL_DOMAIN]
  
  for (const domain of domainsToCheck) {
    // If hostname is exactly the domain, no subdomain
    if (host === domain || host === `www.${domain}`) {
      return null
    }
    
    // Check if hostname ends with the domain
    if (host.endsWith(`.${domain}`)) {
      // Extract the subdomain part
      const subdomain = host.slice(0, -(`.${domain}`.length))
      return subdomain || null
    }
  }
  
  return null
}

// Helper to look up a wedding's plan by its wedding_name_id
// This is completely independent of the logged-in user
async function getWeddingPlan(weddingNameId: string): Promise<'free' | 'premium' | 'deluxe'> {
  try {
    // Use the service role key to bypass RLS entirely.
    // The wedding_subscriptions table only allows owner SELECT via RLS,
    // but we need to read the plan for ANY visitor to handle redirects.
    // This is safe because middleware runs server-side only.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (weddingError || !wedding) {
      console.warn(`Middleware: Wedding not found for ${weddingNameId}:`, weddingError?.message)
      return 'free'
    }

    const { data: weddingFeatures, error: featuresError } = await supabase
      .from('wedding_subscriptions')
      .select('plan')
      .eq('wedding_id', wedding.id)
      .single()

    if (featuresError || !weddingFeatures) {
      console.warn(`Middleware: Features not found for wedding ${wedding.id}:`, featuresError?.message)
      return 'free'
    }

    const plan = (weddingFeatures.plan as 'free' | 'premium' | 'deluxe') || 'free'
    console.log(`Middleware: Wedding ${weddingNameId} has plan: ${plan}`)
    return plan
  } catch {
    return 'free'
  }
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // =========================================================================
  // SKIP MIDDLEWARE: API routes and special paths
  // These should be processed directly without routing logic
  // =========================================================================
  if (
    pathname.startsWith('/auth/callback') || 
    pathname.startsWith('/api/registry/webhook') ||
    pathname.startsWith('/api/connect/webhook') ||
    pathname.startsWith('/api/subscriptions/webhook') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/site.webmanifest'
  ) {
    return NextResponse.next()
  }

  const subdomain = getSubdomain(hostname)

  // =========================================================================
  // MAIN DOMAIN: path-based wedding URLs (/weddingNameId/...)
  // - Free weddings: serve normally (path-based is correct)
  // - Premium/Deluxe weddings: redirect to subdomain
  // =========================================================================
  if (!subdomain) {
    const segments = pathname.split('/').filter(Boolean)
    const first = segments[0]

    if (first && !RESERVED_PATHS.includes(first.toLowerCase())) {
      const hostWithoutPort = hostname.split(':')[0]
      const port = hostname.includes(':') ? `:${hostname.split(':')[1]}` : ''

      // Normalize: treat www.ohmy.wedding the same as ohmy.wedding
      const normalizedHost = hostWithoutPort.replace(/^www\./, '')

      // Only handle our known main domains (ohmy.local, ohmy.wedding, www.ohmy.wedding, localhost)
      if (normalizedHost === 'ohmy.local' || normalizedHost === 'ohmy.wedding' || normalizedHost === 'localhost') {
        // localhost uses path-based for all plans, no redirects needed
        if (normalizedHost === 'localhost') {
          // fall through to normal processing
        } else {
        // Check wedding plan to decide whether to redirect to subdomain
        const plan = await getWeddingPlan(first)

        if (plan === 'premium' || plan === 'deluxe') {
          // Premium/Deluxe: redirect to subdomain URL.
          // Construct as string to avoid issues with request.url not reflecting
          // the actual Host header hostname.
          const protocol = request.nextUrl.protocol || 'http:'
          const targetHost = normalizedHost === 'ohmy.local'
            ? `${first}.ohmy.local${port}`
            : `${first}.ohmy.wedding`

          let targetPath = pathname

          if (pathname.startsWith(`/admin/${first}`)) {
            const rest = pathname.slice(`/admin/${first}`.length)
            targetPath = rest ? `/admin${rest}` : '/admin/dashboard'
          } else {
            const rest = pathname.slice(first.length + 1)
            targetPath = rest ? `/${rest}` : '/'
          }

          const redirectTarget = `${protocol}//${targetHost}${targetPath}`
          return NextResponse.redirect(redirectTarget)
        }
        // Free plan: DON'T redirect to subdomain, continue with normal path-based routing
        }
      }
    }
  }
  
  // =========================================================================
  // SUBDOMAIN: wedding-specific subdomain (e.g., weddingname.ohmy.wedding)
  // - Premium/Deluxe weddings: rewrite to path-based URL (subdomain is correct)
  // - Free weddings: redirect to main domain with raw Location header
  // =========================================================================
  if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    // Skip static files, API routes, and auth routes on subdomains - they should not be rewritten
    if (pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/auth/') ||
        pathname === '/favicon.ico' ||
        pathname === '/site.webmanifest' ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
      // API routes and static files: pass through to Supabase auth without rewriting
      const response = NextResponse.next()
      response.headers.set('x-wedding-subdomain', subdomain)
      return handleSupabaseAuth(request, response)
    } else {
      // Check wedding plan - free weddings must not be on subdomains
      const plan = await getWeddingPlan(subdomain)

      if (plan === 'free') {
        // Free weddings are served path-based, not subdomain-based.
        // Rewrite to a 404 page with subdomain info
        const url = request.nextUrl.clone()
        url.pathname = '/subdomain-not-available'
        url.searchParams.set('subdomain', subdomain)
        
        const response = NextResponse.rewrite(url)
        response.headers.set('x-wedding-subdomain', subdomain)
        return handleSupabaseAuth(request, response)
      }

      // Premium/Deluxe: serve normally on subdomain
      if (pathname.startsWith('/admin')) {
        const adminPath = pathname.slice(6) // Remove '/admin' prefix, e.g., '/dashboard'
        
        if (adminPath.startsWith(`/${subdomain}/`) || adminPath === `/${subdomain}`) {
          const response = NextResponse.next()
          response.headers.set('x-wedding-subdomain', subdomain)
          return handleSupabaseAuth(request, response)
        } else {
          const newPath = `/admin/${subdomain}${adminPath}`
          const url = request.nextUrl.clone()
          url.pathname = newPath
          
          const response = NextResponse.rewrite(url)
          response.headers.set('x-wedding-subdomain', subdomain)
          return handleSupabaseAuth(request, response)
        }
      } else {
        const newPath = `/${subdomain}${pathname === '/' ? '' : pathname}`
        const url = request.nextUrl.clone()
        url.pathname = newPath
        
        const response = NextResponse.rewrite(url)
        response.headers.set('x-wedding-subdomain', subdomain)
        return handleSupabaseAuth(request, response)
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  return handleSupabaseAuth(request, supabaseResponse)
}

// Get the cookie domain based on the request host for subdomain sharing
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

async function handleSupabaseAuth(request: NextRequest, response: NextResponse) {
  const host = request.headers.get('host') || ''
  const cookieDomain = getCookieDomain(host)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = cookieDomain
              ? { ...options, domain: cookieDomain, path: '/' }
              : options
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // CRITICAL: Handle refresh token errors to prevent infinite error loops
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // If refresh token is invalid/expired, clear all auth cookies immediately
      // This prevents the error from repeating on every subsequent request
      if (
        error.message?.includes('Refresh Token') ||
        (error as any).code === 'refresh_token_not_found' ||
        error.message?.includes('Invalid Refresh Token') ||
        error.status === 400
      ) {
        const allCookies = request.cookies.getAll()
        for (const cookie of allCookies) {
          if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
            // Delete with no domain (covers main domain cookies)
            response.cookies.set(cookie.name, '', {
              path: '/',
              expires: new Date(0),
              maxAge: 0,
            })
            // Also delete with explicit domain (covers subdomain cookies)
            if (cookieDomain) {
              response.cookies.set(cookie.name, '', {
                domain: cookieDomain,
                path: '/',
                expires: new Date(0),
                maxAge: 0,
              })
            }
          }
        }
      }
      user = null
    } else {
      user = data.user
    }
  } catch {
    // If getUser throws unexpectedly, treat as unauthenticated
    user = null
  }

  // Protect admin routes - require authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const host = request.headers.get('host') || ''
      const subdomain = getSubdomain(host)
      
      // Get the main domain for login redirect
      // Subdomains don't have a login route, so redirect to main domain
      let loginUrl: URL
      
      if (subdomain) {
        // On subdomain - redirect to main domain for login
        const hostWithoutPort = host.split(':')[0]
        const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
        
        // Determine the main domain based on current host
        let mainDomain: string
        if (hostWithoutPort.endsWith('.ohmy.local')) {
          mainDomain = `ohmy.local${port}`
        } else if (hostWithoutPort.endsWith('.ohmy.wedding')) {
          mainDomain = 'ohmy.wedding'
        } else {
          // Fallback to BASE_DOMAIN
          mainDomain = BASE_DOMAIN
        }
        
        const protocol = request.nextUrl.protocol
        loginUrl = new URL(`${protocol}//${mainDomain}/login`)
      } else {
        // Already on main domain
        loginUrl = new URL('/login', request.url)
      }
      
      // Set redirect to return to the original URL after login
      loginUrl.searchParams.set('redirect', request.url)
      
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
