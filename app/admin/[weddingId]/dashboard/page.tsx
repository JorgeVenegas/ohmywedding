"use client"
import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, ArrowRight, Mail, Gift, Settings, LayoutGrid, Globe, Sparkles, UtensilsCrossed, CalendarDays, FileText, Handshake, CircleX, CalendarClock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/header"
import { ActivityFeed } from "@/components/ui/activity-feed"
import { InvitationStatsCard } from "@/components/ui/invitation-stats-card"
import { RegistryPaymentNotifications } from "@/components/ui/registry-payment-notifications"
import { UpcomingEventsCard } from "@/components/ui/upcoming-events-card"
import { OnboardingTutorial } from "@/components/ui/onboarding-tutorial"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { getWeddingPath } from "@/lib/wedding-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { useAuth, useWeddingPermissions } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase-client"

interface AdminDashboardProps {
  params: Promise<{ weddingId: string }>
}

export default function AdminDashboard({ params }: AdminDashboardProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { permissions: weddingPerms } = useWeddingPermissions(decodedWeddingId)
  const [showTutorial, setShowTutorial] = useState(false)
  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null)
  const [isLegacy, setIsLegacy] = useState(false)
  const [coupleNames, setCoupleNames] = useState<string | null>(null)
  const [dashboardSections, setDashboardSections] = useState<Record<string, boolean>>({})
  const [sectionsLoaded, setSectionsLoaded] = useState(false)
  const [isReady, setIsReady] = useState<boolean | null>(null)
  const [readyStatusManagedBy, setReadyStatusManagedBy] = useState<'owner' | 'all'>('owner')
  const [savingReadyStatus, setSavingReadyStatus] = useState(false)

  // Check if tutorial should be shown (per-user, via needs_onboarding table)
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('needs_onboarding')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setShowTutorial(true)
      })
  }, [user])

  // Fetch dashboard sections settings and ready status
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [settingsRes, readyStatusRes] = await Promise.all([
          fetch(`/api/weddings/${weddingId}/settings`),
          fetch(`/api/weddings/${weddingId}/ready-status`),
        ])
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          if (data.settings?.dashboard_sections) {
            setDashboardSections(data.settings.dashboard_sections)
          }
        }
        if (readyStatusRes.ok) {
          const data = await readyStatusRes.json()
          setIsReady(data.is_ready)
          setReadyStatusManagedBy(data.ready_status_managed_by)
        }
      } catch {} finally {
        setSectionsLoaded(true)
      }
    }
    fetchDashboardData()
  }, [weddingId])

  // Check if wedding has a website — detect legacy dynamically (no is_legacy column read)
  useEffect(() => {
    async function checkWebsite() {
      const supabase = createClient()
      // weddingId can be either a UUID (subdomain users) or a wedding_name_id slug
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const isUUID = UUID_REGEX.test(decodedWeddingId)
      const query = supabase
        .from('weddings')
        .select('id, has_website, page_config, partner1_first_name, partner2_first_name, wedding_websites(id)')
      const { data } = isUUID
        ? await query.eq('id', decodedWeddingId).maybeSingle()
        : await query.eq('wedding_name_id', decodedWeddingId).maybeSingle()
      
      if (data) {
        const websiteRow = Array.isArray(data.wedding_websites) ? data.wedding_websites[0] : data.wedding_websites
        const hasLegacyConfig = !!data.page_config && typeof data.page_config === 'object' && Object.keys(data.page_config).length > 0
        setHasWebsite(!!(websiteRow) || data.has_website || hasLegacyConfig)
        setIsLegacy(!websiteRow && hasLegacyConfig)
        if (data.partner1_first_name) {
          const p1 = data.partner1_first_name
          const p2 = data.partner2_first_name
          setCoupleNames(p2 ? `${p1} & ${p2}` : p1)
        }
      } else {
        // Wedding not found — default to showing create card
        setHasWebsite(false)
      }
    }
    checkWebsite()
  }, [decodedWeddingId])

  const websiteCard = {
    title: hasWebsite ? t('admin.dashboard.cards.website.titleEdit') : t('admin.dashboard.cards.website.titleCreate'),
    description: hasWebsite ? t('admin.dashboard.cards.website.descriptionEdit') : t('admin.dashboard.cards.website.descriptionCreate'),
    icon: Globe,
    href: hasWebsite ? getWeddingPath(weddingId) : getCleanAdminUrl(weddingId, 'create-website'),
    color: "primary" as const,
    badge: isLegacy ? 'Legacy' : undefined,
  }

  const sections = [
    { ...websiteCard, sectionKey: 'website' },
    {
      sectionKey: 'invitations',
      title: t('admin.dashboard.cards.invitations.title'),
      description: t('admin.dashboard.cards.invitations.description'),
      icon: Mail,
      href: getCleanAdminUrl(weddingId, 'invitations'),
      color: "primary" as const,
    },
    {
      sectionKey: 'registry',
      title: t('admin.dashboard.cards.registry.title'),
      description: t('admin.dashboard.cards.registry.description'),
      icon: Gift,
      href: getCleanAdminUrl(weddingId, 'registry'),
      color: "accent" as const,
    },
    {
      sectionKey: 'seating',
      title: t('admin.dashboard.cards.seating.title'),
      description: t('admin.dashboard.cards.seating.description'),
      icon: LayoutGrid,
      href: getCleanAdminUrl(weddingId, 'seating'),
      color: "accent" as const,
    },
    {
      sectionKey: 'dishes',
      title: t('admin.dashboard.cards.dishes.title'),
      description: t('admin.dashboard.cards.dishes.description'),
      icon: UtensilsCrossed,
      href: getCleanAdminUrl(weddingId, 'dishes'),
      color: "accent" as const,
    },
    {
      sectionKey: 'itinerary',
      title: t('admin.dashboard.cards.itinerary.title'),
      description: t('admin.dashboard.cards.itinerary.description'),
      icon: CalendarDays,
      href: getCleanAdminUrl(weddingId, 'itinerary'),
      color: "accent" as const,
    },
    {
      sectionKey: 'suppliers',
      title: t('admin.dashboard.cards.suppliers.title'),
      description: t('admin.dashboard.cards.suppliers.description'),
      icon: Handshake,
      href: getCleanAdminUrl(weddingId, 'suppliers'),
      color: "accent" as const,
    },
    {
      sectionKey: 'timeline',
      title: t('admin.dashboard.cards.timeline.title'),
      description: t('admin.dashboard.cards.timeline.description'),
      icon: CalendarClock,
      href: getCleanAdminUrl(weddingId, 'timeline'),
      color: "accent" as const,
    },
    {
      sectionKey: 'summary',
      title: t('admin.dashboard.cards.summary.title'),
      description: t('admin.dashboard.cards.summary.description'),
      icon: FileText,
      href: getCleanAdminUrl(weddingId, 'summary'),
      color: "secondary" as const,
    },
    {
      sectionKey: 'settings',
      title: t('admin.dashboard.cards.settings.title'),
      description: t('admin.dashboard.cards.settings.description'),
      icon: Settings,
      href: getCleanAdminUrl(weddingId, 'settings'),
      color: "secondary" as const,
      ownerOnly: true,
    },
  ].filter(s => {
    // Owner-only sections (settings)
    if ('ownerOnly' in s && s.ownerOnly && !weddingPerms.isOwner) return false
    // Dashboard sections toggle (website and settings are always shown)
    if (s.sectionKey !== 'website' && s.sectionKey !== 'settings' && dashboardSections[s.sectionKey] === false) return false
    return true
  })

  return (
    <main className="min-h-screen bg-background">
      {/* Onboarding Tutorial — shows only once per user */}
      {showTutorial && (
        <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
      )}

      <Header
        rightContent={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('admin.dashboard.signOut')}
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="page-container">
        {/* Not-Ready Banner */}
        {isReady === false && (
          <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CircleX className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Wedding not ready</p>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Activity tracking is paused. Invitation views and RSVPs won't be recorded until you mark it as Ready.
                </p>
              </div>
            </div>
            {(weddingPerms.isOwner || readyStatusManagedBy === 'all') && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Mark Ready</span>
                <Switch
                  checked={false}
                  disabled={savingReadyStatus}
                  onCheckedChange={async () => {
                    setSavingReadyStatus(true)
                    try {
                      const res = await fetch(`/api/weddings/${weddingId}/ready-status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_ready: true }),
                      })
                      if (res.ok) setIsReady(true)
                    } finally {
                      setSavingReadyStatus(false)
                    }
                  }}
                />
              </div>
            )}
            {weddingPerms.isOwner && (
              <Link
                href={getCleanAdminUrl(weddingId, 'settings')}
                className="text-xs text-amber-700 dark:text-amber-300 underline underline-offset-2 flex-shrink-0"
              >
                Settings
              </Link>
            )}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {coupleNames ? (
              <>{t('admin.dashboard.welcomeBack').replace(/[¡!]/g, '')}, <span className="text-primary">{coupleNames}</span>!</>
            ) : t('admin.dashboard.welcomeBack')}
          </h1>
          <p className="text-lg text-muted-foreground">{t('admin.dashboard.manageDescription')}</p>
        </div>

        {/* Management Sections */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('admin.dashboard.management')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!sectionsLoaded ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 border border-muted/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-muted/10">
                      <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-36 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-full bg-muted/60 animate-pulse rounded" />
                </Card>
              ))
            ) : sections.map((section, index) => {
              const Icon = section.icon
              const badge = 'badge' in section ? section.badge : undefined
              const isWebsiteCard = index === 0
              const isWebsiteLoading = isWebsiteCard && hasWebsite === null
              const colorClasses = {
                primary: "border-primary/20 hover:border-primary/50 hover:bg-primary/5",
                secondary: "border-secondary/20 hover:border-secondary/50 hover:bg-secondary/5",
                accent: "border-accent/20 hover:border-accent/50 hover:bg-accent/5",
              }
              const iconColorClasses = {
                primary: "text-primary",
                secondary: "text-secondary",
                accent: "text-accent",
              }
              const cardContent = (
                <Card
                  className={`p-6 border transition-all duration-300 h-full ${
                    isWebsiteLoading ? 'border-primary/20' : `cursor-pointer ${colorClasses[section.color as keyof typeof colorClasses]}`
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        section.color === "primary"
                          ? "bg-primary/10"
                          : section.color === "secondary"
                            ? "bg-secondary/10"
                            : "bg-accent/10"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${iconColorClasses[section.color as keyof typeof iconColorClasses]}`}
                      />
                    </div>
                    {!isWebsiteLoading && <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />}
                  </div>
                  {isWebsiteLoading ? (
                    <>
                      <div className="h-5 w-36 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-4 w-full bg-muted/60 animate-pulse rounded" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {section.title}
                        {badge && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                            {badge}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </>
                  )}
                </Card>
              )
              return isWebsiteLoading ? (
                <div key={index}>{cardContent}</div>
              ) : (
                <Link key={index} href={section.href}>{cardContent}</Link>
              )
            })}
          </div>
        </div>

        {/* Activity & Stats Section */}
        {(dashboardSections.invitationOpens !== false || dashboardSections.recentActivity !== false || dashboardSections.payments !== false) && (
          <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
            {dashboardSections.invitationOpens !== false && (
              <div className="h-full">
                <InvitationStatsCard weddingId={decodedWeddingId} />
              </div>
            )}

            {dashboardSections.recentActivity !== false && (
              <div className={`h-full ${dashboardSections.invitationOpens !== false ? "xl:col-span-2" : "md:col-span-2 xl:col-span-3"}`}>
                <ActivityFeed
                  weddingId={decodedWeddingId}
                  limit={8}
                  viewAllHref={`/admin/${encodeURIComponent(decodedWeddingId)}/activity`}
                />
              </div>
            )}

            {dashboardSections.payments !== false && (
              <div className="h-full">
                <RegistryPaymentNotifications weddingId={decodedWeddingId} />
              </div>
            )}
          </div>
        )}

        {dashboardSections.timeline !== false && (
          <div className="mt-6">
            <UpcomingEventsCard
              weddingId={decodedWeddingId}
              viewAllHref={getCleanAdminUrl(weddingId, 'timeline')}
            />
          </div>
        )}
      </div>
    </main>
  )
}
