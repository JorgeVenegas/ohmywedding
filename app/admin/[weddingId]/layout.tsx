"use client"

import { use, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { SubscriptionProvider } from "@/components/contexts/subscription-context"
import { FreeTrialBanner } from "@/components/ui/free-trial-banner"
import { useI18n } from "@/components/contexts/i18n-context"
import { AIChatPanel } from "@/components/ai/chat-panel"
import type { Locale } from "@/lib/i18n"

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ weddingId: string }>
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  // Resolve params once via React.use() so we get a stable string, not
  // a new Promise object on every render (which would re-run the effect below).
  const resolvedParams = use(params)
  const weddingId = decodeURIComponent(resolvedParams.weddingId)

  const [isAuthorized, setIsAuthorized]     = useState<boolean | null>(null)
  const [isLoading, setIsLoading]           = useState(true)
  const [aiChatEnabled, setAiChatEnabled]   = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { t, setLocale } = useI18n()

  useEffect(() => {
    const segment = pathname.split('/').pop() || 'dashboard'
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      invitations: 'Invitations',
      'invitation-progress': 'Invitation Progress',
      guests: 'Guests',
      gallery: 'Gallery',
      itinerary: 'Itinerary',
      registry: 'Registry',
      suppliers: 'Suppliers',
      seating: 'Seating',
      timeline: 'Timeline',
      summary: 'Summary',
      settings: 'Settings',
      activity: 'Activity',
      inbox: 'Inbox',
      'guest-messages': 'Guest Messages',
      dishes: 'Menu',
    }
    const label = titles[segment] ?? 'Admin'
    document.title = segment === 'dashboard'
      ? 'OhMyWedding Dashboard'
      : `${label} | OhMyWedding`
  }, [pathname])

  useEffect(() => {
    async function checkAuthorization() {
      try {
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

        // Fetch permissions, settings, and AI chat eligibility in parallel
        const [permissionsResponse, settingsResponse, aiEnabledResponse] = await Promise.all([
          fetch(`/api/weddings/${weddingId}/permissions`),
          fetch(`/api/weddings/${weddingId}/settings`),
          fetch(`/api/ai/chat/enabled?weddingSlug=${encodeURIComponent(weddingId)}`),
        ])

        if (!permissionsResponse.ok) {
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }

        const { permissions } = await permissionsResponse.json()

        // AI chat eligibility
        if (aiEnabledResponse.ok) {
          const { enabled } = await aiEnabledResponse.json()
          setAiChatEnabled(!!enabled)
        }

        // Apply the wedding's configured language to the admin UI
        if (settingsResponse.ok) {
          const { settings } = await settingsResponse.json()
          if (settings?.language) {
            setLocale(settings.language as Locale)
          }
        }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId])

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
          <h1 className="text-2xl font-serif text-brand mb-2">{t('admin.layout.noPermission')}</h1>
          <p className="text-sm text-brand/50 mb-6">
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
      <FreeTrialBanner />
      {children}
      {aiChatEnabled && <AIChatPanel weddingId={weddingId} />}
    </SubscriptionProvider>
  )
}
