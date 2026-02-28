"use client"
import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, ArrowRight, Mail, Gift, Settings, LayoutGrid, Globe, Sparkles, UtensilsCrossed, CalendarDays, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { ActivityFeed } from "@/components/ui/activity-feed"
import { InvitationStatsCard } from "@/components/ui/invitation-stats-card"
import { RegistryPaymentNotifications } from "@/components/ui/registry-payment-notifications"
import { OnboardingTutorial } from "@/components/ui/onboarding-tutorial"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { getWeddingPath } from "@/lib/wedding-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase-client"

interface AdminDashboardProps {
  params: Promise<{ weddingId: string }>
}

export default function AdminDashboard({ params }: AdminDashboardProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()
  const { user } = useAuth()
  const [showTutorial, setShowTutorial] = useState(false)
  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null)
  const [isLegacy, setIsLegacy] = useState(false)

  // Check if tutorial should be shown (per-user, via auth metadata)
  useEffect(() => {
    if (user && !user.user_metadata?.tutorial_completed) {
      setShowTutorial(true)
    }
  }, [user])

  // Check if wedding has a website — detect legacy dynamically (no is_legacy column read)
  useEffect(() => {
    async function checkWebsite() {
      const supabase = createClient()
      const { data } = await supabase
        .from('weddings')
        .select('id, has_website, page_config, wedding_websites(id)')
        .eq('wedding_name_id', decodedWeddingId)
        .maybeSingle()
      
      if (data) {
        const websiteRow = Array.isArray(data.wedding_websites) ? data.wedding_websites[0] : data.wedding_websites
        setHasWebsite(!!(websiteRow) || data.has_website)
        // Legacy: has data in weddings.page_config but no wedding_websites row yet
        const hasLegacyConfig = !!data.page_config && typeof data.page_config === 'object' && Object.keys(data.page_config).length > 0
        setIsLegacy(!websiteRow && hasLegacyConfig)
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
    websiteCard,
    {
      title: t('admin.dashboard.cards.invitations.title'),
      description: t('admin.dashboard.cards.invitations.description'),
      icon: Mail,
      href: getCleanAdminUrl(weddingId, 'invitations'),
      color: "primary" as const,
    },
    {
      title: t('admin.dashboard.cards.registry.title'),
      description: t('admin.dashboard.cards.registry.description'),
      icon: Gift,
      href: getCleanAdminUrl(weddingId, 'registry'),
      color: "accent" as const,
    },
    {
      title: t('admin.dashboard.cards.seating.title'),
      description: t('admin.dashboard.cards.seating.description'),
      icon: LayoutGrid,
      href: getCleanAdminUrl(weddingId, 'seating'),
      color: "accent" as const,
    },
    {
      title: t('admin.dashboard.cards.dishes.title'),
      description: t('admin.dashboard.cards.dishes.description'),
      icon: UtensilsCrossed,
      href: getCleanAdminUrl(weddingId, 'dishes'),
      color: "accent" as const,
    },
    {
      title: t('admin.dashboard.cards.itinerary.title'),
      description: t('admin.dashboard.cards.itinerary.description'),
      icon: CalendarDays,
      href: getCleanAdminUrl(weddingId, 'itinerary'),
      color: "accent" as const,
    },
    {
      title: t('admin.dashboard.cards.summary.title'),
      description: t('admin.dashboard.cards.summary.description'),
      icon: FileText,
      href: getCleanAdminUrl(weddingId, 'summary'),
      color: "secondary" as const,
    },
    {
      title: t('admin.dashboard.cards.settings.title'),
      description: t('admin.dashboard.cards.settings.description'),
      icon: Settings,
      href: getCleanAdminUrl(weddingId, 'settings'),
      color: "secondary" as const,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Onboarding Tutorial — shows only once per user */}
      {showTutorial && (
        <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
      )}

      <Header
        rightContent={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" />
              {t('admin.dashboard.signOut')}
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="page-container">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('admin.dashboard.welcomeBack')}</h1>
          <p className="text-lg text-muted-foreground">{t('admin.dashboard.manageDescription')}</p>
        </div>

        {/* Management Sections */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('admin.dashboard.management')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => {
              const Icon = section.icon
              const badge = 'badge' in section ? section.badge : undefined
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
              return (
                <Link key={index} href={section.href}>
                  <Card
                    className={`p-6 border transition-all duration-300 cursor-pointer h-full ${
                      colorClasses[section.color as keyof typeof colorClasses]
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
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {section.title}
                      {badge && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                          {badge}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Activity & Stats Section */}
        <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Invitation Stats */}
          <InvitationStatsCard weddingId={decodedWeddingId} />
          
          {/* Recent Activity */}
          <div className="xl:col-span-2">
            <ActivityFeed weddingId={decodedWeddingId} limit={8} />
          </div>

          {/* Completed Payments */}
          <RegistryPaymentNotifications weddingId={decodedWeddingId} />
        </div>
      </div>
    </main>
  )
}
