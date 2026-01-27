/**
 * Generate clean admin URLs that remove redundant weddingId on subdomains
 * On subdomains like jorgeandyuli.ohmy.local, the weddingId is implicit in the hostname
 * So /admin/jorgeandyuli/dashboard becomes /admin/dashboard
 */

export function getCleanAdminUrl(weddingId: string, page: string = 'dashboard'): string {
  if (typeof window === 'undefined') {
    return `/admin/${weddingId}/${page}`
  }

  const hostname = window.location.hostname
  const isSubdomain = hostname.includes('ohmy.local') || hostname.includes('ohmy.wedding')

  if (isSubdomain) {
    // On subdomain, weddingId is implicit in hostname
    return `/admin/${page}`
  }

  // On main domain, need explicit weddingId
  return `/admin/${weddingId}/${page}`
}

/**
 * Generate main domain URLs for global pages
 * When on a subdomain like jorgeandyuli.ohmy.local, redirect to the main domain
 * e.g., jorgeandyuli.ohmy.local/upgrade -> ohmy.local/upgrade (dev) or ohmy.wedding/upgrade (prod)
 */
export function getMainDomainUrl(path: string): string {
  if (typeof window === 'undefined') {
    // Server-side: can't determine domain, return the path
    return path
  }

  const hostname = window.location.hostname
  const protocol = window.location.protocol
  
  // Check if we're on a subdomain
  const isOnSubdomain = hostname.includes('ohmy.local') || hostname.includes('ohmy.wedding')
  
  if (!isOnSubdomain) {
    // Already on main domain
    return path
  }
  
  // Extract the base domain from the current hostname
  let baseDomain = hostname
  if (hostname.includes('ohmy.local')) {
    baseDomain = 'ohmy.local'
  } else if (hostname.includes('ohmy.wedding')) {
    baseDomain = 'ohmy.wedding'
  }
  
  // Include port if not default
  const port = window.location.port ? `:${window.location.port}` : ''
  
  // Return full URL to main domain
  return `${protocol}//${baseDomain}${port}${path}`
}

