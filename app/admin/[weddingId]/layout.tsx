"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { SubscriptionProvider } from "@/components/contexts/subscription-context"
import { PlanIndicator } from "@/components/plan-indicator"
import { getCleanAdminUrl } from "@/lib/admin-url"

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ weddingId: string }>
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    async function checkAuthorization() {
      try {
        const resolvedParams = await params
        // Decode the weddingId in case it's URL encoded
        const decodedWeddingId = decodeURIComponent(resolvedParams.weddingId)
        setWeddingId(decodedWeddingId)
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // Not logged in - redirect to login on main domain
          const hostname = window.location.hostname
          const isSubdomain = hostname.includes('ohmy.local') || hostname.includes('ohmy.wedding')
          
          if (isSubdomain) {
            // On subdomain, redirect to main domain with full URL as redirect
            const mainDomain = hostname.includes('ohmy.local') 
              ? `http://ohmy.local:${window.location.port || '3000'}`
              : 'https://ohmy.wedding'
            
            window.location.href = `${mainDomain}/login?redirect=${encodeURIComponent(window.location.href)}`
          } else {
            // On main domain, use relative URL
            router.push(`/login?redirect=${encodeURIComponent(getCleanAdminUrl(decodedWeddingId, 'dashboard'))}`)
          }
          return
        }

        // Use the permissions API to check access
        const response = await fetch(`/api/weddings/${decodedWeddingId}/permissions`)
        
        if (!response.ok) {
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }

        const { permissions } = await response.json()
        
        // Allow access if user can edit (owner, collaborator, or unowned wedding)
        if (permissions.canEdit || permissions.role === 'owner' || permissions.role === 'editor') {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error('Authorization check failed:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthorization()
  }, [params, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access this wedding&apos;s admin panel. 
            Only the wedding owner and invited collaborators can manage this wedding.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <SubscriptionProvider weddingId={weddingId}>
      {children}
      <PlanIndicator />
    </SubscriptionProvider>
  )
}
