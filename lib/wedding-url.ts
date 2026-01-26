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
 * Generate a URL for a wedding page
 * 
 * In production: https://demo-luxury-noir.ohmy.wedding/
 * In development: http://localhost:3000/demo-luxury-noir
 * 
 * @param weddingNameId - The wedding name ID (e.g., "demo-luxury-noir")
 * @param path - Optional path within the wedding (e.g., "/gallery", "/rsvp")
 * @returns The full URL or relative path depending on environment
 */
export function getWeddingUrl(weddingNameId: string, path: string = ''): string {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path : (path ? `/${path}` : '')
  
  // In development/localhost, use path-based routing
  if (isLocalhost()) {
    return `/${weddingNameId}${normalizedPath}`
  }
  
  // Check if we're on ohmy.local (local subdomain testing)
  const protocol = getProtocol()
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
 * @param weddingNameId - The wedding name ID
 * @returns Human-readable URL
 */
export function getWeddingDisplayUrl(weddingNameId: string): string {
  if (isLocalhost()) {
    const portSuffix = getPortSuffix()
    return `localhost${portSuffix}/${weddingNameId}`
  }
  
  // Check if we're on ohmy.local
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === LOCAL_DOMAIN || host.endsWith(`.${LOCAL_DOMAIN}`)) {
      const port = window.location.port ? `:${window.location.port}` : ''
      return `${weddingNameId}.${LOCAL_DOMAIN}${port}`
    }
  }
  
  const baseDomain = BASE_DOMAIN.replace(/^www\./, '')
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
