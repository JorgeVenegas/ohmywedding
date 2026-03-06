"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { SubscriptionProvider } from "@/components/contexts/subscription-context"
import { PlanIndicator } from "@/components/plan-indicator"
import { useTranslation } from "@/components/contexts/i18n-context"

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ weddingId: string }>
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string>('')
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    async function checkAuthorization() {
      try {
        const resolvedParams = await params
        // Decode the weddingId in case it's URL encoded
        const decodedWeddingId = decodeURIComponent(resolvedParams.weddingId)
        setWeddingId(decodedWeddingId)
        
        const supabase = createClient()

        // Use getSession() to check auth. This reads from cookies/cache
        // without making a network request (no 429 risk).
        // Do NOT call signOut on errors — that destroys valid cookies and
        // creates a redirect loop (admin → signOut → login → admin → signOut...).
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null
        
        if (!user) {
          // Not logged in — redirect to same-origin /login.
          // The middleware already serves /login on subdomains, so this
          // works on both main domain and subdomains without CORS issues.
          // The login page handles the subdomain→main domain hop internally.
          router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`)
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
          <p className="text-muted-foreground">{t('admin.layout.verifyingAccess')}</p>
        </div>
      </div>
    )
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('admin.layout.noPermission')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('admin.layout.noPermissionDescription')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('admin.layout.goHome')}
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
