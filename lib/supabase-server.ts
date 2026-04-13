import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies, headers } from "next/headers"

// Get the cookie domain based on the request host
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
  
  // For ohmy.wedding and subdomains (including www)
  if (hostname === 'ohmy.wedding' || hostname.endsWith('.ohmy.wedding')) {
    return '.ohmy.wedding'
  }
  
  return undefined
}

// Check granular collaborator permissions from the collaborator_permissions table
// Returns the permission flags for a collaborator, or null if not a collaborator
export async function getCollaboratorPermissions(
  weddingId: string, // UUID
  collaboratorEmail: string
) {
  const adminClient = createAdminSupabaseClient()
  const { data: permissions } = await adminClient
    .from('collaborator_permissions')
    .select('*')
    .eq('wedding_id', weddingId)
    .eq('collaborator_email', collaboratorEmail.toLowerCase())
    .single()

  // Return defaults if no row exists (default: view-only)
  if (!permissions) {
    return {
      can_edit_details: false,
      can_edit_page_design: false,
      can_manage_guests: false,
      can_view_guests: true,
      can_manage_invitations: false,
      can_view_invitations: true,
      can_manage_registry: false,
      can_view_registry: true,
      can_manage_gallery: false,
      can_view_gallery: true,
      can_manage_rsvps: false,
      can_view_rsvps: true,
      can_manage_collaborators: false,
    }
  }

  return permissions
}

// Admin client with service role key that bypasses RLS
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const cookieDomain = getCookieDomain(host)
  const isProduction = process.env.NODE_ENV === 'production'

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              secure: isProduction,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            }
            cookieStore.set(name, value, cookieOptions)
          })
        } catch {
          // Handle cookie setting errors
        }
      },
    },
  })
}
