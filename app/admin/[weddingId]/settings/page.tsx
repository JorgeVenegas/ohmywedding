"use client"

import Link from "next/link"
import React, { useState, useEffect, use, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { UpdateWeddingNameId } from "@/components/ui/update-wedding-name-id"
import { CollaboratorManager } from "@/components/ui/collaborator-manager"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useI18n } from "@/components/contexts/i18n-context"
import { useWeddingPermissions } from "@/hooks/use-auth"
import { WhatsappAccountSettings } from "./components/whatsapp-account-settings"
import {
  Settings,
  Globe,
  Save,
  ChevronRight,
  Crown,
  Sparkles,
  Check,
  UserCog,
  LayoutGrid,
  MessageCircle,
  Mail,
  Gift,
  Calendar,
  Users,
  CalendarClock,
  Clock,
  Loader2,
  Percent,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { INVITATION_PRICING, MANAGEMENT_PRICING, getTierLocaleCopy, planLabel, type PricingAxis, type InvitationTier, type ManagementTier, formatMXNFromCents } from "@/lib/subscription-shared"

// Maps a selected plan to its same-tier companion on the other axis
const COMPANION_TIER_MAP: Record<PricingAxis, Record<string, { axis: PricingAxis; tier: string }>> = {
  invitation: {
    basic:        { axis: 'management', tier: 'basic' },
    personalized: { axis: 'management', tier: 'pro' },
    bespoke:      { axis: 'management', tier: 'agency' },
  },
  management: {
    basic:   { axis: 'invitation', tier: 'basic' },
    pro:     { axis: 'invitation', tier: 'personalized' },
    agency:  { axis: 'invitation', tier: 'bespoke' },
  },
}

interface WeddingSettings {
  id: string
  wedding_id: string
  rsvp_travel_confirmation_enabled: boolean
  rsvp_require_ticket_attachment: boolean
  rsvp_require_no_ticket_reason: boolean
  rsvp_allow_plus_ones: boolean
  rsvp_deadline: string | null
  invitation_default_message: string | null
  invitation_custom_fields: any
  gallery_allow_guest_uploads: boolean
  gallery_moderation_enabled: boolean
  timezone: string
  language: string
  dashboard_sections: Record<string, boolean>
}

interface Subscription {
  plan: string
  invitation_tier?: string | null
  management_tier?: string | null
  status?: string
  started_at?: string
  expires_at?: string
}

interface SettingsPageProps {
  params: Promise<{ weddingId: string }>
}

type Section = "general" | "subscription" | "collaborators" | "dashboardSections" | "messaging" | "danger"

export default function SettingsPage({ params }: SettingsPageProps) {
  return (
    <Suspense>
      <SettingsPageInner params={params} />
    </Suspense>
  )
}

function SettingsPageInner({ params }: SettingsPageProps) {
  const { weddingId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { permissions: weddingPerms, loading: permsLoading } = useWeddingPermissions(weddingId)
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [weddingUuid, setWeddingUuid] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const validSections: Section[] = ["general", "subscription", "collaborators", "dashboardSections", "messaging", "danger"]
  const sectionFromUrl = searchParams.get('section') as Section | null
  const [activeSection, setActiveSection] = useState<Section>(
    sectionFromUrl && validSections.includes(sectionFromUrl) ? sectionFromUrl : "general"
  )

  const navigateToSection = useCallback((section: Section) => {
    setActiveSection(section)
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    router.replace(url.pathname + '?' + url.searchParams.toString(), { scroll: false })
  }, [router])
  const [hasChanges, setHasChanges] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showCompanionDialog, setShowCompanionDialog] = useState(false)
  const [companionMainTarget, setCompanionMainTarget] = useState<{ axis: PricingAxis; tier: string } | null>(null)
  const [selectedCompanionTier, setSelectedCompanionTier] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { t, setLocale } = useI18n()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetchData()
  }, [weddingId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [settingsRes, subscriptionRes] = await Promise.all([
        fetch(`/api/weddings/${weddingId}/settings`),
        fetch(`/api/weddings/${weddingId}/subscription`),
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
        setWeddingUuid(data.settings?.wedding_id ?? null)
      }

      if (subscriptionRes.ok) {
        const data = await subscriptionRes.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const settingsRes = await fetch(`/api/weddings/${weddingId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (settingsRes.ok) {
        setHasChanges(false)
        if (settings?.language) {
          setLocale(settings.language as import("@/lib/i18n").Locale)
        }
      }
    } catch (error) {
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradeFromSettings = async (target: { axis: PricingAxis; tier: string }) => {
    if (!weddingUuid) return
    setIsCheckingOut(true)
    setCheckoutError(null)
    try {
      const res = await fetch(`/api/weddings/${weddingUuid}/subscription/checkout-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis: target.axis, tier: target.tier, source: 'settings', cancelUrl: window.location.pathname + window.location.search, locale: settings?.language || 'en' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleDeleteWedding = async () => {
    if (!weddingUuid) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/weddings/${weddingUuid}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to delete wedding')
        return
      }
      router.push('/admin')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBundleCheckout = async (mainAxis: PricingAxis, mainTier: string, companionAxis: PricingAxis, companionTier: string) => {
    if (!weddingUuid) return
    setIsCheckingOut(true)
    setCheckoutError(null)
    try {
      const res = await fetch(`/api/weddings/${weddingUuid}/subscription/checkout-bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainAxis, mainTier, companionAxis, companionTier, source: 'settings_bundle', cancelUrl: window.location.pathname + window.location.search, locale: settings?.language || 'en' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create bundle checkout')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const selectPlanFromSettings = (axis: PricingAxis, tier: string) => {
    const companion = COMPANION_TIER_MAP[axis]?.[tier]
    setCompanionMainTarget({ axis, tier })
    if (companion) {
      setSelectedCompanionTier(companion.tier)
      setShowCompanionDialog(true)
    } else {
      handleUpgradeFromSettings({ axis, tier })
    }
  }

  const updateSetting = (key: keyof WeddingSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
      setHasChanges(true)
    }
  }

  const menuItems: { id: Section; label: string; icon: React.ComponentType<{ className?: string }>; danger?: boolean }[] = [
    { id: "general", label: t('admin.settings.nav.general'), icon: Globe },
    { id: "subscription", label: t('admin.settings.nav.subscription'), icon: Crown },
    { id: "collaborators", label: t('admin.settings.nav.collaborators'), icon: UserCog },
    { id: "dashboardSections", label: t('admin.settings.nav.dashboardSections'), icon: LayoutGrid },
    { id: "messaging", label: t('admin.settings.nav.messaging'), icon: MessageCircle },
    { id: "danger", label: t('admin.settings.nav.danger'), icon: AlertTriangle, danger: true },
  ]

  if (loading || permsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, "dashboard")} />
        <div className="page-container">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!weddingPerms.isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, "dashboard")} />
        <div className="page-container">
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-base font-serif text-[#420c14] mb-2">{t('admin.settings.ownerOnly')}</h2>
              <p className="text-muted-foreground mb-6">{t('admin.settings.ownerOnlyDescription')}</p>
              <Button variant="outline" asChild>
                <Link href={getCleanAdminUrl(weddingId, 'dashboard')}>{t('admin.settings.backToDashboard')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Read tiers directly from wedding_subscriptions — the authoritative source.
  // Fall back to deriving from legacy plan only when tier columns are absent.
  const currentInvTier = (
    subscription?.invitation_tier as 'basic' | 'personalized' | 'bespoke' | null | undefined
  ) ?? (
    subscription?.plan === 'deluxe' ? 'bespoke'
    : subscription?.plan === 'premium' ? 'personalized'
    : null
  )
  const currentMgmtTier = (
    subscription?.management_tier as 'basic' | 'pro' | 'agency' | null | undefined
  ) ?? (
    subscription?.plan === 'deluxe' ? 'agency'
    : subscription?.plan === 'premium' ? 'pro'
    : null
  )
  const invTiers = ['basic', 'personalized', 'bespoke'] as const
  const mgmtTiers = ['basic', 'pro', 'agency'] as const

  return (
    <>
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref={getCleanAdminUrl(weddingId, "dashboard")} />

      <div className="page-container">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">{t('admin.dashboard.management')}</p>
          <h1 className="text-3xl font-serif text-[#420c14] mb-1">{t('admin.settings.title')}</h1>
          <p className="text-sm text-[#420c14]/60">{t('admin.settings.description')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-56 flex-shrink-0">
            <Card className="p-2">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateToSection(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        item.danger
                          ? isActive
                            ? "bg-red-50 text-red-700 font-medium"
                            : "text-red-500/70 hover:bg-red-50 hover:text-red-600"
                          : isActive
                          ? "bg-[#420c14]/8 text-[#420c14] font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                      />
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <Card className="p-6">

              {/* General */}
              {activeSection === "general" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-serif text-[#420c14] mb-1">{t('admin.settings.nav.general')}</h2>
                    <p className="text-sm text-muted-foreground">{t('admin.settings.generalSettings.description')}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                    <UpdateWeddingNameId currentWeddingNameId={decodeURIComponent(weddingId)} />
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium">{t('admin.settings.generalSettings.timezone')}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t('admin.settings.generalSettings.timezoneDescription')}</p>
                      <Input
                        value={settings?.timezone || "America/New_York"}
                        onChange={(e) => updateSetting("timezone", e.target.value)}
                        placeholder="America/New_York"
                        className="max-w-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t('admin.settings.generalSettings.language')}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t('admin.settings.generalSettings.languageDescription')}</p>
                      <select
                        value={settings?.language || "en"}
                        onChange={(e) => updateSetting("language", e.target.value)}
                        className="max-w-xs h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan */}
              {activeSection === "subscription" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-base font-serif text-[#420c14] mb-1">{t('admin.settings.nav.subscription')}</h2>
                    <p className="text-sm text-muted-foreground">{t('admin.settings.subscription.description')}</p>
                  </div>

                  {/* Current Plan Banner */}
                  {(() => {
                    const hasPaidSub = currentInvTier === 'personalized' || currentInvTier === 'bespoke' || currentMgmtTier === 'pro' || currentMgmtTier === 'agency'
                    const isTopTier = currentInvTier === 'bespoke' || currentMgmtTier === 'agency'
                    if (!hasPaidSub) {
                      return (
                        <div className="rounded-xl border-2 border-[#420c14]/12 bg-[#420c14]/3 p-5">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-[#420c14]/35" />
                            <h3 className="font-serif text-lg text-[#420c14]/60">{t('admin.settings.subscription.trialTitle')}</h3>
                            <span className="px-2 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 rounded-full uppercase tracking-widest">
                              {t('admin.settings.subscription.trialBadge')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('admin.settings.subscription.trialDescription')}
                          </p>
                        </div>
                      )
                    }
                    return (
                      <div className={`rounded-xl border-2 p-5 ${
                        isTopTier
                          ? 'border-[#8B0000] bg-gradient-to-br from-[#8B0000]/5 to-transparent'
                          : 'border-[#DDA46F] bg-gradient-to-br from-[#DDA46F]/5 to-transparent'
                      }`}>
                        <div className="flex items-center gap-3">
                          {isTopTier ? (
                            <Crown className="h-5 w-5 text-[#8B0000]" />
                          ) : (
                            <Sparkles className="h-5 w-5 text-[#DDA46F]" />
                          )}
                          <h3 className="font-serif text-lg text-[#420c14]">
                            {planLabel(currentInvTier || 'basic', currentMgmtTier || 'basic')}
                          </h3>
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-green-100 text-green-700 rounded-full uppercase tracking-widest">
                            {t('admin.settings.subscription.activeBadge')}
                          </span>
                        </div>
                        {subscription?.expires_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('admin.settings.subscription.expiresLabel').replace('{{date}}', new Date(subscription.expires_at).toLocaleDateString())}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {/* Invitation Design Plans */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DDA46F] mb-4">
                      {t('admin.settings.subscription.invitationDesign')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {invTiers.map((tier) => {
                        const pricing = INVITATION_PRICING[tier]
                        const locale = settings?.language || 'en'
                        const localCopy = getTierLocaleCopy('invitation', tier, locale)
                        const cardTagline = t(`admin.settings.bundleDialog.tiers.invitation.${tier}.tagline`)
                        const cardFeatures = t(`admin.settings.bundleDialog.tiers.invitation.${tier}.features`).split('|')
                        const cardCta = t(`admin.settings.bundleDialog.tiers.invitation.${tier}.cta`)
                        const isActive = currentInvTier !== null && currentInvTier === tier
                        const isUpgrade = currentInvTier === null
                          ? true
                          : invTiers.indexOf(tier) > invTiers.indexOf(currentInvTier as typeof invTiers[number])
                        const isCheckingThisTier = isCheckingOut && companionMainTarget?.axis === 'invitation' && companionMainTarget?.tier === tier
                        return (
                          <div
                            key={tier}
                            className={`rounded-xl border-2 p-4 transition-all ${
                              isActive
                                ? 'border-[#DDA46F] bg-[#DDA46F]/5'
                                : isUpgrade
                                ? 'border-border bg-card'
                                : 'border-border/40 bg-muted/20 opacity-55'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <h4 className="font-serif text-sm text-[#420c14]">{localCopy.name}</h4>
                              {isActive && (
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#DDA46F]/10 text-[#DDA46F] border border-[#DDA46F]/20 rounded-full uppercase tracking-widest">
                                  {t('admin.settings.subscription.currentBadge')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{cardTagline}</p>
                            <p className="text-sm font-semibold text-[#420c14] mb-3">{pricing.priceDisplayMXN}</p>
                            <ul className="space-y-1.5 mb-4">
                              {cardFeatures.slice(0, 3).map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-snug">
                                  <Check className="h-3 w-3 text-[#DDA46F] mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                            {isUpgrade && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-8 border-[#DDA46F]/30 hover:border-[#DDA46F] hover:bg-[#DDA46F]/5 text-[#420c14] gap-1.5"
                                disabled={isCheckingOut}
                                onClick={() => selectPlanFromSettings('invitation', tier)}
                              >
                                {isCheckingThisTier && <Loader2 className="h-3 w-3 animate-spin" />}
                                {cardCta}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {checkoutError}
                    </p>
                  )}

                  {/* Management Plans */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DDA46F] mb-4">
                      {t('admin.settings.subscription.management')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {mgmtTiers.map((tier) => {
                        const pricing = MANAGEMENT_PRICING[tier as ManagementTier]
                        const locale = settings?.language || 'en'
                        const localCopy = getTierLocaleCopy('management', tier, locale)
                        const cardTagline = t(`admin.settings.bundleDialog.tiers.management.${tier}.tagline`)
                        const cardFeatures = t(`admin.settings.bundleDialog.tiers.management.${tier}.features`).split('|')
                        const cardCta = t(`admin.settings.bundleDialog.tiers.management.${tier}.cta`)
                        const isActive = currentMgmtTier !== null && currentMgmtTier === tier
                        const isUpgrade = currentMgmtTier === null
                          ? true
                          : mgmtTiers.indexOf(tier) > mgmtTiers.indexOf(currentMgmtTier as typeof mgmtTiers[number])
                        const isCheckingThisTier = isCheckingOut && companionMainTarget?.axis === 'management' && companionMainTarget?.tier === tier
                        return (
                          <div
                            key={tier}
                            className={`rounded-xl border-2 p-4 transition-all ${
                              isActive
                                ? 'border-[#DDA46F] bg-[#DDA46F]/5'
                                : isUpgrade
                                ? 'border-border bg-card'
                                : 'border-border/40 bg-muted/20 opacity-55'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <h4 className="font-serif text-sm text-[#420c14]">{localCopy.name}</h4>
                              {isActive && (
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#DDA46F]/10 text-[#DDA46F] border border-[#DDA46F]/20 rounded-full uppercase tracking-widest">
                                  {t('admin.settings.subscription.currentBadge')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{cardTagline}</p>
                            <p className="text-sm font-semibold text-[#420c14] mb-3">{pricing.priceDisplayMXN}</p>
                            <ul className="space-y-1.5 mb-4">
                              {cardFeatures.slice(0, 3).map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-snug">
                                  <Check className="h-3 w-3 text-[#DDA46F] mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                            {isUpgrade && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-8 border-[#DDA46F]/30 hover:border-[#DDA46F] hover:bg-[#DDA46F]/5 text-[#420c14] gap-1.5"
                                disabled={isCheckingOut}
                                onClick={() => selectPlanFromSettings('management', tier)}
                              >
                                {isCheckingThisTier && <Loader2 className="h-3 w-3 animate-spin" />}
                                {cardCta}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* portal rendered below at root level */}

              {/* Collaborators */}
              {activeSection === "collaborators" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-serif text-[#420c14] mb-1">{t('admin.settings.nav.collaborators')}</h2>
                    <p className="text-sm text-muted-foreground">{t('admin.settings.collaborators.description')}</p>
                  </div>
                  <CollaboratorManager weddingNameId={decodeURIComponent(weddingId)} />
                </div>
              )}

              {/* Sections */}
              {activeSection === "dashboardSections" && (
                <DashboardSectionsTab
                  dashboardSections={settings?.dashboard_sections ?? {}}
                  onChange={(sections) => {
                    if (settings) {
                      setSettings({ ...settings, dashboard_sections: sections })
                      setHasChanges(true)
                    }
                  }}
                />
              )}

              {/* Inbox / Messaging */}
              {activeSection === "messaging" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-serif text-[#420c14] mb-1">{t('admin.settings.nav.messaging')}</h2>
                    <p className="text-sm text-muted-foreground">{t('admin.settings.messaging.description')}</p>
                  </div>
                  <WhatsappAccountSettings weddingId={decodeURIComponent(weddingId)} />
                </div>
              )}

              {/* Danger Zone */}
              {activeSection === "danger" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-serif text-red-700 mb-1">{t('admin.settings.dangerZone.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('admin.settings.dangerZone.description')}</p>
                  </div>

                  <div className="rounded-xl border-2 border-red-200 bg-red-50/40 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-red-800 mb-1">{t('admin.settings.dangerZone.deleteTitle')}</h3>
                        <p className="text-sm text-red-700/70 leading-relaxed max-w-md">
                          {t('admin.settings.dangerZone.deleteDescription')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 gap-2"
                        onClick={() => { setDeleteConfirmText(""); setShowDeleteDialog(true) }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('admin.settings.dangerZone.deleteButton')}
                      </Button>
                    </div>
                  </div>

                  {/* Delete confirmation dialog */}
                  {showDeleteDialog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-red-100">
                        <div className="flex justify-center mb-5">
                          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7 text-red-600" />
                          </div>
                        </div>
                        <h2 className="text-xl font-serif text-red-800 text-center mb-2">
                          {t('admin.settings.dangerZone.confirmTitle')}
                        </h2>
                        <p className="text-sm text-red-700/70 text-center mb-1">
                          {t('admin.settings.dangerZone.confirmDescription')}
                        </p>
                        <p className="text-xs text-red-600 text-center font-medium mb-5">
                          {t('admin.settings.dangerZone.permanentWarning')}
                        </p>
                        <div className="mb-6">
                          <Label className="text-sm text-red-800 mb-2 block">
                            {t('admin.settings.dangerZone.typeToConfirm').replace('{{name}}', decodeURIComponent(weddingId))}
                          </Label>
                          <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder={decodeURIComponent(weddingId)}
                            className="border-red-200 focus:border-red-400 focus-visible:ring-red-200"
                            disabled={isDeleting}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-700"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-red-700 hover:bg-red-800 text-white gap-2"
                            disabled={deleteConfirmText !== decodeURIComponent(weddingId) || isDeleting}
                            onClick={handleDeleteWedding}
                          >
                            {isDeleting
                              ? <><Loader2 className="h-4 w-4 animate-spin" />{t('admin.settings.dangerZone.deleting')}</>
                              : <><Trash2 className="h-4 w-4" />{t('admin.settings.dangerZone.deleteConfirmButton')}</>
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Save Button — shown only for sections with editable settings */}
            {hasChanges && activeSection !== 'subscription' && activeSection !== 'collaborators' && activeSection !== 'messaging' && activeSection !== 'danger' && (
              <div className="mt-4 flex justify-end">
                <Button onClick={saveSettings} disabled={saving} className="gap-2" size="lg">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                      {t('admin.settings.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {t('common.saveChanges')}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Companion bundle dialog — rendered via portal so it covers the full screen */}
    {mounted && showCompanionDialog && companionMainTarget && (() => {
      const companionRef = COMPANION_TIER_MAP[companionMainTarget.axis]?.[companionMainTarget.tier]
      if (!companionRef) return null
      const dialogLocale = settings?.language || 'en'

      // Main plan (full price)
      const mainPricingData = companionMainTarget.axis === 'invitation'
        ? INVITATION_PRICING[companionMainTarget.tier as InvitationTier]
        : MANAGEMENT_PRICING[companionMainTarget.tier as ManagementTier]
      if (!mainPricingData) return null
      const mainCard = { ...mainPricingData, name: getTierLocaleCopy(companionMainTarget.axis, companionMainTarget.tier, dialogLocale).name }

      // Companion axis tiers — all 3 options, user-selectable
      const companionAxis = companionRef.axis
      const companionTiers = companionAxis === 'invitation'
        ? (['basic', 'personalized', 'bespoke'] as const)
        : (['basic', 'pro', 'agency'] as const)
      const activeTier = selectedCompanionTier || companionRef.tier

      const companionPricingData = companionAxis === 'invitation'
        ? INVITATION_PRICING[activeTier as InvitationTier]
        : MANAGEMENT_PRICING[activeTier as ManagementTier]
      if (!companionPricingData) return null
      const companionCard = { ...companionPricingData, name: getTierLocaleCopy(companionAxis, activeTier, dialogLocale).name }

      const companionHalfCents = Math.round(companionCard.price_mxn / 2)
      const companionHalfDisplay = formatMXNFromCents(companionHalfCents)
      const bundleTotalDisplay = formatMXNFromCents(mainCard.price_mxn + companionHalfCents)
      const mainAxisLabel = companionMainTarget.axis === 'invitation' ? t('admin.settings.bundleDialog.invitationDesign') : t('admin.settings.bundleDialog.management')
      const companionAxisLabel = companionAxis === 'invitation' ? t('admin.settings.bundleDialog.invitationDesign') : t('admin.settings.bundleDialog.management')

      const tierTagline = t(`admin.settings.bundleDialog.tiers.${companionAxis}.${activeTier}.tagline`)
      const tierFeatures = t(`admin.settings.bundleDialog.tiers.${companionAxis}.${activeTier}.features`).split('|')

      return createPortal(
        <AnimatePresence>
          <motion.div
            key="companion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCompanionDialog(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#f5f2eb] rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-[#DDA46F] via-[#f0c990] to-[#DDA46F]" />
              <div className="p-8">
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#DDA46F]/15 flex items-center justify-center">
                    <Percent className="w-7 h-7 text-[#DDA46F]" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif text-[#420c14] text-center mb-1">{t('admin.settings.bundleDialog.title')}</h2>
                <p className="text-xs tracking-[0.25em] uppercase text-[#DDA46F] text-center mb-7">{t('admin.settings.bundleDialog.subtitle')}</p>

                {/* Both line items */}
                <div className="space-y-2 mb-5">
                  {/* Main plan — full price */}
                  <div className="flex items-center justify-between bg-white/70 border border-[#420c14]/8 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#420c14]/35 mb-0.5">{mainAxisLabel}</p>
                      <p className="text-sm font-medium text-[#420c14]">{mainCard.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#420c14]">{mainCard.priceDisplayMXN}</span>
                  </div>

                  {/* Companion plan — 50% off, selectable tier */}
                  <div className="bg-[#DDA46F]/10 border border-[#DDA46F]/25 rounded-xl overflow-hidden">
                    {/* Tier selector pills */}
                    <div className="flex gap-1.5 px-4 pt-3 pb-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#420c14]/35 self-center mr-1">{companionAxisLabel}</p>
                      {companionTiers.map((cTier) => {
                        const cName = getTierLocaleCopy(companionAxis, cTier, dialogLocale).name
                        const isSelected = cTier === activeTier
                        return (
                          <button
                            key={cTier}
                            onClick={() => setSelectedCompanionTier(cTier)}
                            disabled={isCheckingOut}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                              isSelected
                                ? 'bg-[#DDA46F] text-[#420c14]'
                                : 'bg-[#420c14]/8 text-[#420c14]/50 hover:bg-[#420c14]/15'
                            }`}
                          >
                            {cName}
                          </button>
                        )
                      })}
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#420c14] bg-[#DDA46F] rounded-full px-2 py-0.5 self-center">50% off</span>
                    </div>
                    <div className="flex items-start justify-between px-4 pt-1 pb-2">
                      <div>
                        <p className="text-sm font-medium text-[#420c14]">{companionCard.name}</p>
                        <p className="text-[11px] text-[#420c14]/50 mt-0.5 leading-snug max-w-[200px]">{tierTagline}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-semibold text-[#420c14]">{companionHalfDisplay}</p>
                        <p className="text-xs text-[#420c14]/35 line-through">{companionCard.priceDisplayMXN}</p>
                      </div>
                    </div>
                    <ul className="px-4 pb-3 space-y-1">
                      {tierFeatures.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-[#420c14]/60">
                          <Check className="h-3 w-3 text-[#DDA46F] flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-[#420c14]/10 pt-4 mb-6">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#420c14]/40">{t('admin.settings.bundleDialog.total')}</span>
                  <span className="text-lg font-serif font-semibold text-[#420c14]">{bundleTotalDisplay}</span>
                </div>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => {
                      handleBundleCheckout(
                        companionMainTarget.axis, companionMainTarget.tier,
                        companionAxis, activeTier
                      )
                    }}
                    disabled={isCheckingOut}
                    className="w-full h-12 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] font-semibold text-sm tracking-wide gap-2"
                  >
                    {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Percent className="w-4 h-4" />}
                    {isCheckingOut ? t('admin.settings.bundleDialog.redirecting') : t('admin.settings.bundleDialog.addBundle').replace('{{price}}', bundleTotalDisplay)}
                  </Button>
                  <Button
                    onClick={() => handleUpgradeFromSettings(companionMainTarget)}
                    disabled={isCheckingOut}
                    variant="ghost"
                    className="w-full h-10 text-[#420c14]/45 hover:text-[#420c14] hover:bg-[#420c14]/5 text-sm"
                  >
                    {t('admin.settings.bundleDialog.continueWith').replace('{{axis}}', mainAxisLabel).replace('{{plan}}', mainCard.name)}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    })()}
    </>
  )
}

// Dashboard section keys matching the dashboard cards
const DASHBOARD_CARD_KEYS = [
  "invitations",
  "registry",
  "seating",
  "dishes",
  "itinerary",
  "suppliers",
  "timeline",
  "summary",
] as const

const DASHBOARD_PANEL_KEYS = [
  "invitationOpens",
  "recentActivity",
  "payments",
] as const

type DashboardSectionKey = typeof DASHBOARD_CARD_KEYS[number] | typeof DASHBOARD_PANEL_KEYS[number]

const SECTION_ICONS: Record<DashboardSectionKey, React.ComponentType<{ className?: string }>> = {
  invitations: Mail,
  registry: Gift,
  seating: LayoutGrid,
  dishes: Calendar,
  itinerary: Calendar,
  suppliers: Users,
  timeline: CalendarClock,
  summary: Settings,
  invitationOpens: Mail,
  recentActivity: Calendar,
  payments: Gift,
}

interface DashboardSectionsTabProps {
  dashboardSections: Record<string, boolean>
  onChange: (sections: Record<string, boolean>) => void
}

function DashboardSectionsTab({ dashboardSections, onChange }: DashboardSectionsTabProps) {
  const { t } = useI18n()

  const isSectionEnabled = (key: DashboardSectionKey) => dashboardSections[key] !== false

  const toggleSection = (key: DashboardSectionKey) => {
    onChange({ ...dashboardSections, [key]: !isSectionEnabled(key) })
  }

  const renderRow = (key: DashboardSectionKey) => {
    const Icon = SECTION_ICONS[key]
    const enabled = isSectionEnabled(key)
    return (
      <div
        key={key}
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
          enabled ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-75'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            enabled ? 'bg-[#420c14]/5' : 'bg-muted'
          }`}>
            <Icon className={`h-4 w-4 ${enabled ? 'text-[#420c14]' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t(`admin.dashboard.cards.${key}.title` as any)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`admin.dashboard.cards.${key}.description` as any)}
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={() => toggleSection(key)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-serif text-[#420c14] mb-1">{t('admin.settings.dashboardSections.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('admin.settings.dashboardSections.description')}</p>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3">
            {t('admin.settings.dashboardSections.cards')}
          </p>
          <div className="space-y-2">{DASHBOARD_CARD_KEYS.map(renderRow)}</div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3">
            {t('admin.settings.dashboardSections.panels')}
          </p>
          <div className="space-y-2">{DASHBOARD_PANEL_KEYS.map(renderRow)}</div>
        </div>
      </div>
    </div>
  )
}
