import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient, resetClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

export type WeddingPermissions = {
  canEdit: boolean
  canDelete: boolean
  canManageCollaborators: boolean
  canManageInvitations: boolean
  canManageGuests: boolean
  isOwner: boolean
  isCollaborator: boolean
  role: 'owner' | 'editor' | 'guest'
  userId: string | null
}

const defaultPermissions: WeddingPermissions = {
  canEdit: false,
  canDelete: false,
  canManageCollaborators: false,
  canManageInvitations: false,
  canManageGuests: false,
  isOwner: false,
  isCollaborator: false,
  role: 'guest',
  userId: null
}

// Clear all Supabase auth cookies across all domains (safety net for signOut)
function clearAllAuthCookies() {
  if (typeof document === 'undefined') return

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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to auth state changes. This fires INITIAL_SESSION immediately
    // with the current session (from cookies), then SIGNED_IN/SIGNED_OUT/etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] auth event:', event, session?.user?.email ?? 'no user')
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[useAuth] signOut error:', err)
    }
    // Safety net: manually clear cookies across all potential domains
    clearAllAuthCookies()
    resetClient()
    window.location.href = '/'
  }, [])

  return { user, loading, signOut }
}

export function useWeddingPermissions(weddingNameId: string | null) {
  const [permissions, setPermissions] = useState<WeddingPermissions>(defaultPermissions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const lastFetchKey = useRef<string | null>(null)

  // Single effect: subscribe to auth state changes and drive permission fetching.
  // Using onAuthStateChange only (no getUser/getSession calls here) to avoid
  // queuing extra token refresh requests that trigger 429s.
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useWeddingPermissions] onAuthStateChange:', event, 'hasSession:', !!session)
      setAuthReady(true)

      // Only reset + refetch on actual sign in/out events, not TOKEN_REFRESHED
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        lastFetchKey.current = null
        // Pass the session directly so refetch doesn't need to call getSession()
        refetchWithSession(session?.access_token ?? null)
      }
    })

    // Mark ready on mount using the cached session (no network call)
    console.log('[useWeddingPermissions] calling getSession() on mount')
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useWeddingPermissions] getSession mount result:', session ? `user=${session.user?.email}` : 'no session')
      setAuthReady(true)
      refetchWithSession(session?.access_token ?? null)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingNameId])

  // Accepts an optional access token to avoid calling getSession() inside refetch
  const refetchWithSession = useCallback(async (accessToken: string | null) => {
    if (!weddingNameId) {
      setPermissions(defaultPermissions)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const fetchKey = `${weddingNameId}:${accessToken || 'noauth'}`
      if (lastFetchKey.current === fetchKey) {
        setLoading(false)
        return
      }
      lastFetchKey.current = fetchKey

      const headers: Record<string, string> = { 'Cache-Control': 'no-cache' }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(`/api/weddings/${weddingNameId}/permissions`, {
        cache: 'no-store',
        headers
      })

      if (!response.ok) throw new Error('Failed to fetch permissions')

      const data = await response.json()
      setPermissions(data.permissions)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPermissions(defaultPermissions)
    } finally {
      setLoading(false)
    }
  }, [weddingNameId])

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await refetchWithSession(session?.access_token ?? null)
  }, [refetchWithSession])

  // Fetch permissions when auth is ready
  useEffect(() => {
    if (authReady) {
      refetch()
    }
  }, [authReady, refetch])

  return { permissions, loading, error, refetch }
}

export function useCollaborators(weddingNameId: string | null) {
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!weddingNameId) {
      setCollaboratorEmails([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get current session to pass auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache'
      }
      
      // Pass access token in Authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/weddings/${weddingNameId}/collaborators`, {
        cache: 'no-store',
        headers
      })
      
      if (response.status === 401) {
        // User is not authorized to view collaborators
        setCollaboratorEmails([])
        setError(null)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch collaborators')
      }

      const data = await response.json()
      setCollaboratorEmails(data.collaboratorEmails || [])
      setIsOwner(data.isOwner || false)
      setOwnerId(data.ownerId || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCollaboratorEmails([])
    } finally {
      setLoading(false)
    }
  }, [weddingNameId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addCollaborator = useCallback(async (email: string) => {
    if (!weddingNameId) return { success: false, error: 'No wedding selected' }

    try {
      const response = await fetch(`/api/weddings/${weddingNameId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to add collaborator' }
      }

      setCollaboratorEmails(data.collaboratorEmails || [])
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [weddingNameId])

  const removeCollaborator = useCallback(async (email: string) => {
    if (!weddingNameId) return { success: false, error: 'No wedding selected' }

    try {
      const response = await fetch(`/api/weddings/${weddingNameId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || 'Failed to remove collaborator' }
      }

      const data = await response.json()
      setCollaboratorEmails(data.collaboratorEmails || [])
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [weddingNameId])

  return {
    collaboratorEmails,
    isOwner,
    ownerId,
    loading,
    error,
    refetch,
    addCollaborator,
    removeCollaborator
  }
}
