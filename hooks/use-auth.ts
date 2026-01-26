import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

export type WeddingPermissions = {
  canEdit: boolean
  canDelete: boolean
  canManageCollaborators: boolean
  isOwner: boolean
  isCollaborator: boolean
  role: 'owner' | 'editor' | 'guest'
  userId: string | null
}

const defaultPermissions: WeddingPermissions = {
  canEdit: false,
  canDelete: false,
  canManageCollaborators: false,
  isOwner: false,
  isCollaborator: false,
  role: 'guest',
  userId: null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // Clear all Supabase auth cookies manually to handle domain mismatch issues
    // This ensures cookies set with different domains are also cleared
    const cookiesToClear = document.cookie.split(';').map(c => c.trim().split('=')[0])
    const domains = ['', '.ohmy.local', '.ohmy.wedding', window.location.hostname]
    const paths = ['/', '']
    
    cookiesToClear.forEach(name => {
      if (name.includes('sb-') || name.includes('supabase')) {
        domains.forEach(domain => {
          paths.forEach(path => {
            const domainPart = domain ? `; domain=${domain}` : ''
            const pathPart = path ? `; path=${path}` : '; path=/'
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}${pathPart}`
          })
        })
      }
    })
    
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

  // Wait for auth to be ready before fetching permissions
  useEffect(() => {
    const supabase = createClient()
    
    // Check initial auth state
    supabase.auth.getUser().then(() => {
      setAuthReady(true)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refetch = useCallback(async () => {
    if (!weddingNameId) {
      setPermissions(defaultPermissions)
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
      const fetchKey = `${weddingNameId}:${session?.access_token || 'noauth'}`
      if (lastFetchKey.current === fetchKey) {
        setLoading(false)
        return
      }

      lastFetchKey.current = fetchKey
      
      const response = await fetch(`/api/weddings/${weddingNameId}/permissions`, {
        cache: 'no-store',
        headers
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }

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

  // Fetch permissions when auth is ready or weddingNameId changes
  useEffect(() => {
    if (authReady) {
      refetch()
    }
  }, [authReady, refetch])

  // Also refetch when auth state changes
  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refetch()
    })

    return () => subscription.unsubscribe()
  }, [refetch])

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
