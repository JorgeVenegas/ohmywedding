import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Base domain for the application (without protocol)
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ohmy.wedding'

// Local development domain for subdomain testing
const LOCAL_DOMAIN = 'ohmy.local'

// Reserved subdomains that should not be treated as wedding IDs
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'mail', 'blog', 'help', 'support', 'status', 'superadmin']

// Paths on the main domain that should not be treated as wedding name IDs
const RESERVED_PATHS = ['','_next','api','auth','admin','create-wedding','login','upgrade','demo','success','favicon.ico','fonts','videos','images','site.webmanifest','superadmin','couples','planners']

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

type WeddingStatus = { hasPaid: boolean; isLocked: boolean }

// Helper to look up a wedding's subscription status by its wedding_name_id
async function getWeddingStatus(weddingNameId: string): Promise<WeddingStatus> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, is_locked')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (weddingError || !wedding) {
      console.warn(`Middleware: Wedding not found for ${weddingNameId}:`, weddingError?.message)
      return { hasPaid: false, isLocked: false }
    }

    const isLocked = wedding.is_locked ?? false

    const { data: sub } = await supabase
      .from('wedding_subscriptions')
      .select('invitation_tier, management_tier, plan')
      .eq('wedding_id', wedding.id)
      .single()

    if (!sub) return { hasPaid: false, isLocked }

    // Any non-basic tier, or legacy premium/deluxe plan = paid
    const legacyPlan = (sub as any).plan as string | null
    const hasPaid =
      (sub.invitation_tier && sub.invitation_tier !== 'basic') ||
      (sub.management_tier && sub.management_tier !== 'basic') ||
      legacyPlan === 'premium' ||
      legacyPlan === 'deluxe'

    return { hasPaid: !!hasPaid, isLocked }
  } catch {
    return { hasPaid: false, isLocked: false }
  }
}

// UUID regex for detecting weddingId path segments
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// English-speaking countries (default to English)
const ENGLISH_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU', 'NZ', 'IE'])

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // =========================================================================
  // SKIP MIDDLEWARE: API routes and special paths
  // These should be processed directly without routing logic
  // =========================================================================
  if (
    pathname.startsWith('/auth/callback') ||
    pathname === '/login' ||
    pathname === '/create-wedding' ||
    pathname === '/wedding-locked' ||
    pathname.startsWith('/upgrade') ||
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
        // Check wedding status (paid tier + lock state)
        const { hasPaid, isLocked } = await getWeddingStatus(first)

        if (isLocked) {
          const url = request.nextUrl.clone()
          url.pathname = '/wedding-locked'
          url.searchParams.set('wedding', first)
          return NextResponse.redirect(url)
        }

        if (hasPaid) {
          // Premium/Deluxe: redirect to subdomain URL.
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

          // RSC fetches (Next.js client-side navigation) use fetch().
          // Cross-origin redirects on fetch are blocked by browsers (CORS).
          // For RSC requests, rewrite instead of redirect so the content
          // is served on the same origin without a visible URL change.
          const isRscRequest = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc')
          if (isRscRequest) {
            // Rewrite: serve the content from the path-based route on same origin
            // (the Next.js app serves the same route regardless of host)
            return NextResponse.next()
          }

          const redirectTarget = `${protocol}//${targetHost}${targetPath}`
          return NextResponse.redirect(redirectTarget)
        }
        // Free plan: DON'T redirect to subdomain, continue with normal path-based routing
        }
      }
    }

    // =========================================================================
    // ADMIN PATHS: /admin/{weddingNameId}/... on main domain
    // Redirect to subdomain for premium/deluxe weddings.
    // RSC fetches (client-side navigation) must NOT be redirected cross-origin
    // because browsers block cross-origin redirects on fetch() (CORS).
    // =========================================================================
    if (first === 'admin') {
      const weddingNameId = segments[1]
      if (weddingNameId && !UUID_RE.test(weddingNameId)) {
        const hostWithoutPort = hostname.split(':')[0]
        const port = hostname.includes(':') ? `:${hostname.split(':')[1]}` : ''
        const normalizedHost = hostWithoutPort.replace(/^www\./, '')

        if (normalizedHost === 'ohmy.local' || normalizedHost === 'ohmy.wedding') {
          const { hasPaid, isLocked } = await getWeddingStatus(weddingNameId)

          if (isLocked) {
            const url = request.nextUrl.clone()
            url.pathname = '/wedding-locked'
            url.searchParams.set('wedding', weddingNameId)
            return NextResponse.redirect(url)
          }

          if (hasPaid) {
            const isRscRequest = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc')
            if (isRscRequest) {
              return NextResponse.next()
            }

            const protocol = request.nextUrl.protocol || 'http:'
            const targetHost = normalizedHost === 'ohmy.local'
              ? `${weddingNameId}.ohmy.local${port}`
              : `${weddingNameId}.ohmy.wedding`
            const rest = pathname.slice(`/admin/${weddingNameId}`.length)
            const targetPath = rest ? `/admin${rest}` : '/admin/dashboard'
            return NextResponse.redirect(`${protocol}//${targetHost}${targetPath}`)
          }
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
    // Skip static files, API routes, auth routes, and login on subdomains - they should not be rewritten.
    // /login must be same-origin on subdomains to avoid CORS errors when RSC fetch
    // requests get redirected to the main domain for auth.
    if (pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/auth/') ||
        pathname === '/login' ||
        pathname === '/favicon.ico' ||
        pathname === '/site.webmanifest' ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
      // API routes and static files: pass through to Supabase auth without rewriting
      const response = NextResponse.next()
      response.headers.set('x-wedding-subdomain', subdomain)
      return handleSupabaseAuth(request, response)
    } else {
      // Check wedding status — paid tier + lock state
      const { hasPaid, isLocked } = await getWeddingStatus(subdomain)

      if (isLocked) {
        const url = request.nextUrl.clone()
        url.hostname = hostname.replace(`${subdomain}.`, '')
        url.pathname = '/wedding-locked'
        url.searchParams.set('wedding', subdomain)
        return NextResponse.redirect(url)
      }

      if (!hasPaid) {
        // Unpaid weddings are served path-based, not subdomain-based.
        const url = request.nextUrl.clone()
        url.pathname = '/subdomain-not-available'
        url.searchParams.set('subdomain', subdomain)

        const response = NextResponse.rewrite(url)
        response.headers.set('x-wedding-subdomain', subdomain)
        return handleSupabaseAuth(request, response)
      }

      // Paid plan: serve normally on subdomain
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

  // Check for actual auth session cookies BEFORE creating the server client.
  // Creating the server client triggers Supabase's auto-initialization
  // (_initialize → _recoverAndRefresh) which can fire onAuthStateChange
  // and call setAll() — modifying response cookies as a side effect.
  // When there are no auth cookies, we must NOT create the client at all.
  let user = null
  const hasAuthCookies = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') &&
         (c.name.includes('auth-token') || c.name.includes('refresh')) &&
         !c.name.includes('code-verifier')
  )

  if (hasAuthCookies) {
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

    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.warn('[Middleware] getUser error:', error.message, 'path:', request.nextUrl.pathname)
        if ((error as any).code !== 'refresh_token_already_used') {
          // Auth cookies are invalid — clear them so the browser stops sending them.
          const allCookies = request.cookies.getAll()
          for (const cookie of allCookies) {
            if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
              response.cookies.set(cookie.name, '', {
                path: '/',
                expires: new Date(0),
                maxAge: 0,
              })
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
    } catch (catchErr) {
      console.error('[Middleware] getUser threw:', catchErr, 'path:', request.nextUrl.pathname)
      user = null
    }
  }

  // Protect admin routes - require authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Always redirect to same-origin /login to avoid CORS issues.
      // Next.js RSC navigation uses fetch(), and cross-origin redirects on fetch
      // are blocked by browsers. By keeping /login on the same origin (including
      // subdomains), the redirect works for both full-page and RSC navigations.
      const loginUrl = new URL('/login', request.url)
      
      // Set redirect to return to the original URL after login
      loginUrl.searchParams.set('redirect', request.url)
      
      return NextResponse.redirect(loginUrl)
    }
  }

  // Set geo-locale cookie for language auto-detection
  // Only set if the user doesn't already have a preferred-locale in localStorage
  // (that's client-side, so we just always set the geo cookie as a hint)
  if (!request.cookies.get('geo-locale')) {
    const country = request.headers.get('x-vercel-ip-country') || ''
    const geoLocale = ENGLISH_COUNTRIES.has(country) ? 'en' : 'es'
    response.cookies.set('geo-locale', geoLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })
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
