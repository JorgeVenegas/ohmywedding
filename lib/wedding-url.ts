/**
 * Wedding URL utilities for generating proper subdomain-based URLs
 */

// Get the base domain from environment
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ohmy.wedding'

// Local development domain for subdomain testing
const LOCAL_DOMAIN = 'ohmy.local'

/**
 * Check if we're running in development/localhost mode (path-based routing)
 * Returns false for ohmy.local since we want subdomain routing there
 */
function isLocalhost(): boolean {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    // ohmy.local and its subdomains should use subdomain routing
    if (host === LOCAL_DOMAIN || host.endsWith(`.${LOCAL_DOMAIN}`)) {
      return false
    }
    return host === 'localhost' || host === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)
  }
  return process.env.NODE_ENV === 'development'
}

/**
 * Get the current protocol (http or https)
 */
function getProtocol(): string {
  if (typeof window !== 'undefined') {
    return window.location.protocol
  }
  return process.env.NODE_ENV === 'production' ? 'https:' : 'http:'
}

/**
 * Get the port suffix for localhost
 */
function getPortSuffix(): string {
  if (typeof window !== 'undefined' && isLocalhost()) {
    const port = window.location.port
    return port ? `:${port}` : ''
  }
  return ''
}

/**
 * Wedding plan type
 */
export type WeddingPlan = 'free' | 'premium' | 'deluxe'

/**
 * Generate a URL for a wedding page, plan-aware.
 * 
 * - Free weddings: always path-based (e.g., /weddingname or localhost:3000/weddingname)
 * - Premium/Deluxe weddings: subdomain-based in production/ohmy.local (e.g., weddingname.ohmy.wedding)
 * - On localhost, all weddings use path-based routing regardless of plan
 * 
 * @param weddingNameId - The wedding name ID (e.g., "demo-luxury-noir")
 * @param path - Optional path within the wedding (e.g., "/gallery", "/rsvp")
 * @param plan - The wedding plan. Defaults to 'free' (path-based).
 * @returns The full URL or relative path depending on environment and plan
 */
export function getWeddingUrl(weddingNameId: string, path: string = '', plan: WeddingPlan = 'free'): string {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path : (path ? `/${path}` : '')
  
  // In development/localhost, always use path-based routing
  if (isLocalhost()) {
    return `/${weddingNameId}${normalizedPath}`
  }
  
  const protocol = getProtocol()

  // Free plan: always path-based on main domain
  if (plan === 'free') {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      if (host === LOCAL_DOMAIN || host.endsWith(`.${LOCAL_DOMAIN}`)) {
        const port = window.location.port ? `:${window.location.port}` : ''
        return `${protocol}//${LOCAL_DOMAIN}${port}/${weddingNameId}${normalizedPath}`
      }
    }
    const baseDomain = BASE_DOMAIN.replace(/^www\./, '')
    return `${protocol}//${baseDomain}/${weddingNameId}${normalizedPath}`
  }
  
  // Premium/Deluxe: subdomain-based
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === LOCAL_DOMAIN || host.endsWith(`.${LOCAL_DOMAIN}`)) {
      const port = window.location.port ? `:${window.location.port}` : ''
      return `${protocol}//${weddingNameId}.${LOCAL_DOMAIN}${port}${normalizedPath}`
    }
  }
  
  // In production, use subdomain-based routing
  const baseDomain = BASE_DOMAIN.replace(/^www\./, '')
  return `${protocol}//${weddingNameId}.${baseDomain}${normalizedPath}`
}

/**
 * Generate a relative path for a wedding page (for use in Link href)
 * This is for internal navigation where Next.js handles the routing
 * 
 * On subdomains like jorgeandyuli.ohmy.local, returns just the path (e.g., "/" or "/gallery")
 * On main domain, returns the full path with weddingId (e.g., "/jorgeandyuli" or "/jorgeandyuli/gallery")
 * 
 * @param weddingNameId - The wedding name ID
 * @param path - Optional path within the wedding
 * @returns Relative path for internal routing
 */
export function getWeddingPath(weddingNameId: string, path: string = ''): string {
  const normalizedPath = path.startsWith('/') ? path : (path ? `/${path}` : '')
  
  // On subdomain, the weddingId is implicit in the hostname
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isSubdomain = host === LOCAL_DOMAIN || host.endsWith(`.${LOCAL_DOMAIN}`) ||
                       host !== 'localhost' && host !== '127.0.0.1' && host.includes('ohmy.wedding')
    
    if (isSubdomain) {
      // Check if we're on a subdomain by seeing if the hostname contains the weddingId as a subdomain
      if (host.startsWith(`${weddingNameId}.`) && (host.includes('.ohmy.local') || host.includes('.ohmy.wedding'))) {
        // On the same wedding's subdomain, just return the path
        return normalizedPath || '/'
      }
    }
  }
  
  // On main domain or different subdomain, include the weddingId
  return `/${weddingNameId}${normalizedPath}`
}

/**
 * Generate the display URL for a wedding (for showing to users)
 * 
 * - Free: ohmy.wedding/weddingname
 * - Premium/Deluxe: weddingname.ohmy.wedding
 * 
 * @param weddingNameId - The wedding name ID
 * @param plan - The wedding plan. Defaults to 'free'.
 * @returns Human-readable URL
 */
export function getWeddingDisplayUrl(weddingNameId: string, plan: WeddingPlan = 'free'): string {
  if (isLocalhost()) {
    const portSuffix = getPortSuffix()
    return `localhost${portSuffix}/${weddingNameId}`
  }
  
  // Check if we're on ohmy.local
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === LOCAL_DOMAIN || host.endsWith(`.${LOCAL_DOMAIN}`)) {
      const port = window.location.port ? `:${window.location.port}` : ''
      if (plan === 'free') {
        return `${LOCAL_DOMAIN}${port}/${weddingNameId}`
      }
      return `${weddingNameId}.${LOCAL_DOMAIN}${port}`
    }
  }
  
  const baseDomain = BASE_DOMAIN.replace(/^www\./, '')
  if (plan === 'free') {
    return `${baseDomain}/${weddingNameId}`
  }
  return `${weddingNameId}.${baseDomain}`
}

/**
 * Check if we should use subdomain-based URLs
 */
export function useSubdomainUrls(): boolean {
  return !isLocalhost()
}

/**
 * Get the base URL for the main site (not wedding pages)
 */
export function getMainSiteUrl(): string {
  if (isLocalhost()) {
    const portSuffix = getPortSuffix()
    return `${getProtocol()}//localhost${portSuffix}`
  }
  return `https://www.${BASE_DOMAIN.replace(/^www\./, '')}`
}

/**
 * Parse subdomain from the current URL (client-side only)
 * @returns The subdomain or null if not on a subdomain
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const host = window.location.hostname
  
  // No subdomain handling for localhost/IP
  if (host === 'localhost' || host === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return null
  }
  
  const baseDomain = BASE_DOMAIN.replace(/^www\./, '')
  const domainsToCheck = [baseDomain, LOCAL_DOMAIN]
  
  for (const domain of domainsToCheck) {
    // If hostname is exactly the domain (or www), no subdomain
    if (host === domain || host === `www.${domain}`) {
      return null
    }
    
    // Check if hostname ends with the domain
    if (host.endsWith(`.${domain}`)) {
      const subdomain = host.slice(0, -(`.${domain}`.length))
      // Exclude www as it's not a wedding subdomain
      return subdomain && subdomain !== 'www' ? subdomain : null
    }
  }
  
  return null
}
