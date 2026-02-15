"use client"

import Link from "next/link"
import React, { useState, useEffect, use } from "react"
import { Header } from "@/components/header"
import { UpdateWeddingNameId } from "@/components/ui/update-wedding-name-id"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import {
  Settings,
  Users,
  Mail,
  Image,
  Calendar,
  Gift,
  Globe,
  AlertCircle,
  Save,
  ChevronRight,
  Crown,
  Sparkles,
  Check,
  X,
} from "lucide-react"

interface WeddingFeatures {
  id: string
  wedding_id: string
  rsvp_enabled: boolean
  invitations_panel_enabled: boolean
  gallery_enabled: boolean
  registry_enabled: boolean
  schedule_enabled: boolean
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
}

interface Subscription {
  plan: 'free' | 'premium'
  status: string
  started_at?: string
  expires_at?: string
}

interface PlanFeatures {
  rsvp_enabled: boolean
  invitations_panel_enabled: boolean
  gallery_enabled: boolean
  registry_enabled: boolean
  schedule_enabled: boolean
}

interface SettingsPageProps {
  params: Promise<{ weddingId: string }>
}

type Section = "subscription" | "features" | "rsvp" | "invitations" | "gallery" | "general"

export default function SettingsPage({ params }: SettingsPageProps) {
  const { weddingId } = use(params)
  const [features, setFeatures] = useState<WeddingFeatures | null>(null)
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("subscription")
  const [hasChanges, setHasChanges] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    fetchData()
  }, [weddingId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [featuresRes, settingsRes, subscriptionRes] = await Promise.all([
        fetch(`/api/weddings/${weddingId}/features`),
        fetch(`/api/weddings/${weddingId}/settings`),
        fetch(`/api/user/subscription`),
      ])

      if (featuresRes.ok) {
        const data = await featuresRes.json()
        setFeatures(data.features)
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }

      if (subscriptionRes.ok) {
        const data = await subscriptionRes.json()
        setSubscription(data.subscription)
        setPlanFeatures(data.features)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const [featuresRes, settingsRes] = await Promise.all([
        fetch(`/api/weddings/${weddingId}/features`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(features),
        }),
        fetch(`/api/weddings/${weddingId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }),
      ])

      if (featuresRes.ok && settingsRes.ok) {
        setHasChanges(false)
      }
    } catch (error) {
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof WeddingSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
      setHasChanges(true)
    }
  }

  const menuItems = [
    { id: "subscription", label: t('admin.settings.nav.subscription'), icon: Crown },
    { id: "features", label: t('admin.settings.features.title'), icon: Settings },
    { id: "rsvp", label: t('admin.settings.nav.rsvp'), icon: Users },
    { id: "invitations", label: t('admin.settings.nav.invitations'), icon: Mail },
    { id: "gallery", label: t('admin.settings.nav.gallery'), icon: Image },
    { id: "general", label: t('admin.settings.nav.general'), icon: Globe },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="page-container">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="page-container">
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('admin.settings.title')}</h1>
            <p className="text-muted-foreground">
              {t('admin.settings.description')}
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={getCleanAdminUrl(weddingId, "dashboard")}>{t('admin.settings.backToDashboard')}</Link>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <Card className="p-2">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as Section)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-opacity ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <Card className="p-6">
              {activeSection === "subscription" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {t('admin.settings.subscription.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your subscription and view available features
                    </p>
                  </div>

                  {/* Current Plan Card */}
                  <div className={`rounded-lg border-2 p-6 ${
                    subscription?.plan === 'premium' 
                      ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20' 
                      : 'border-border bg-card'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {subscription?.plan === 'premium' ? (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Crown className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold">
                            {subscription?.plan === 'premium' ? 'Premium' : 'Free'}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {t('admin.settings.subscription.status')} {subscription?.status || t('admin.settings.active')}
                          </p>
                        </div>
                      </div>
                      {subscription?.plan === 'free' && (
                        <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                          <Crown className="h-4 w-4 mr-2" />
                          {t('admin.settings.upgradeToPremium')}
                        </Button>
                      )}
                    </div>

                    {subscription?.expires_at && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {subscription.plan === 'premium' 
                          ? `${t('admin.settings.subscription.expires')} ${new Date(subscription.expires_at).toLocaleDateString()}`
                          : ''}
                      </p>
                    )}

                    {/* Features List */}
                    <div className="space-y-3 mt-6">
                      <h4 className="font-semibold text-foreground mb-3">{t('admin.settings.features.title')}</h4>
                      <div className="grid gap-3">
                        <FeatureItem
                          label={t('admin.settings.features.rsvp.name')}
                          description={t('admin.settings.features.rsvp.description')}
                          available={planFeatures?.rsvp_enabled ?? false}
                          isPremium
                        />
                        <FeatureItem
                          label={t('admin.settings.features.invitations.name')}
                          description={t('admin.settings.features.invitations.description')}
                          available={planFeatures?.invitations_panel_enabled ?? false}
                          isPremium
                        />
                        <FeatureItem
                          label={t('admin.settings.features.gallery.name')}
                          description={t('admin.settings.features.gallery.description')}
                          available={planFeatures?.gallery_enabled ?? false}
                        />
                        <FeatureItem
                          label={t('admin.settings.features.registry.name')}
                          description={t('admin.settings.features.registry.description')}
                          available={planFeatures?.registry_enabled ?? false}
                        />
                        <FeatureItem
                          label={t('admin.settings.features.schedule.name')}
                          description={t('admin.settings.features.schedule.description')}
                          available={planFeatures?.schedule_enabled ?? false}
                        />
                      </div>
                    </div>

                    {subscription?.plan === 'free' && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                              Upgrade to unlock premium features
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                              Get access to RSVP management and invitation tools to make your wedding planning easier.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "features" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {t('admin.settings.features.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      View your plan's features and their status
                    </p>
                  </div>

                  {subscription?.plan === 'free' && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          You're on the Free Plan
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                          Some features require a Premium subscription. Visit the Subscription tab to upgrade.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <FeatureStatusCard
                      icon={Users}
                      label={t('admin.settings.features.rsvp.name')}
                      description={t('admin.settings.features.rsvp.description')}
                      available={planFeatures?.rsvp_enabled ?? false}
                      enabled={features?.rsvp_enabled ?? false}
                      isPremium
                    />
                    <FeatureStatusCard
                      icon={Mail}
                      label={t('admin.settings.features.invitations.name')}
                      description={t('admin.settings.features.invitations.description')}
                      available={planFeatures?.invitations_panel_enabled ?? false}
                      enabled={features?.invitations_panel_enabled ?? false}
                      isPremium
                    />
                    <FeatureStatusCard
                      icon={Image}
                      label={t('admin.settings.features.gallery.name')}
                      description={t('admin.settings.features.gallery.description')}
                      available={planFeatures?.gallery_enabled ?? false}
                      enabled={features?.gallery_enabled ?? false}
                    />
                    <FeatureStatusCard
                      icon={Gift}
                      label={t('admin.settings.features.registry.name')}
                      description={t('admin.settings.features.registry.description')}
                      available={planFeatures?.registry_enabled ?? false}
                      enabled={features?.registry_enabled ?? false}
                    />
                    <FeatureStatusCard
                      icon={Calendar}
                      label={t('admin.settings.features.schedule.name')}
                      description={t('admin.settings.features.schedule.description')}
                      available={planFeatures?.schedule_enabled ?? false}
                      enabled={features?.schedule_enabled ?? false}
                    />
                  </div>
                </div>
              )}

              {activeSection === "rsvp" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {t('admin.settings.rsvpSettings.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure how guests respond to your invitation
                    </p>
                  </div>

                  {!planFeatures?.rsvp_enabled && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          RSVP is a Premium Feature
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                          Upgrade to Premium to enable RSVP functionality.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Label className="text-base font-medium">{t('admin.settings.rsvpSettings.travelConfirmation')}</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Allow guests to provide travel information and manage their trip details
                          </p>
                        </div>
                        <Switch
                          checked={settings?.rsvp_travel_confirmation_enabled ?? true}
                          onCheckedChange={(value) =>
                            updateSetting("rsvp_travel_confirmation_enabled", value)
                          }
                          disabled={!planFeatures?.rsvp_enabled}
                        />
                      </div>

                      {settings?.rsvp_travel_confirmation_enabled && (
                        <div className="pl-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Label>{t('admin.settings.rsvpSettings.requireTicket')}</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Guests must upload their ticket when they indicate they will purchase one
                              </p>
                            </div>
                            <Switch
                              checked={settings?.rsvp_require_ticket_attachment ?? false}
                              onCheckedChange={(value) =>
                                updateSetting("rsvp_require_ticket_attachment", value)
                              }
                              disabled={!planFeatures?.rsvp_enabled}
                            />
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Label>{t('admin.settings.rsvpSettings.requireReason')}</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Guests must explain why they don't need a ticket
                              </p>
                            </div>
                            <Switch
                              checked={settings?.rsvp_require_no_ticket_reason ?? false}
                              onCheckedChange={(value) =>
                                updateSetting("rsvp_require_no_ticket_reason", value)
                              }
                              disabled={!planFeatures?.rsvp_enabled}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Label className="text-base font-medium">{t('admin.settings.rsvpSettings.allowPlusOnes')}</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Let guests bring additional attendees
                          </p>
                        </div>
                        <Switch
                          checked={settings?.rsvp_allow_plus_ones ?? false}
                          onCheckedChange={(value) =>
                            updateSetting("rsvp_allow_plus_ones", value)
                          }
                          disabled={!planFeatures?.rsvp_enabled}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <Label className="text-base font-medium">{t('admin.settings.rsvpSettings.rsvpDeadline')}</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Last date for guests to submit their RSVP
                      </p>
                      <Input
                        type="date"
                        value={settings?.rsvp_deadline || ""}
                        onChange={(e) => updateSetting("rsvp_deadline", e.target.value)}
                        disabled={!planFeatures?.rsvp_enabled}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "invitations" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {t('admin.settings.nav.invitations')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Customize your invitation messages and preferences
                    </p>
                  </div>

                  {!planFeatures?.invitations_panel_enabled && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Invitations is a Premium Feature
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                          Upgrade to Premium to enable invitation management.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Default Message</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        This message will be pre-filled when sending invitations
                      </p>
                      <Textarea
                        value={settings?.invitation_default_message || ""}
                        onChange={(e) =>
                          updateSetting("invitation_default_message", e.target.value)
                        }
                        disabled={!planFeatures?.invitations_panel_enabled}
                        rows={4}
                        placeholder="Enter your default invitation message..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "gallery" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {t('admin.settings.nav.gallery')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure photo gallery preferences
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-medium">{t('admin.settings.gallerySettings.allowGuestUploads')}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Let guests upload their photos to the gallery
                        </p>
                      </div>
                      <Switch
                        checked={settings?.gallery_allow_guest_uploads ?? false}
                        onCheckedChange={(value) =>
                          updateSetting("gallery_allow_guest_uploads", value)
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-medium">{t('admin.settings.gallerySettings.moderation')}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Review and approve guest uploads before they appear
                        </p>
                      </div>
                      <Switch
                        checked={settings?.gallery_moderation_enabled ?? false}
                        onCheckedChange={(value) =>
                          updateSetting("gallery_moderation_enabled", value)
                        }
                        disabled={!settings?.gallery_allow_guest_uploads}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "general" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {t('admin.settings.nav.general')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure timezone and language preferences
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                      <UpdateWeddingNameId currentWeddingNameId={decodeURIComponent(weddingId)} />
                    </div>

                    <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">{t('admin.settings.generalSettings.timezone')}</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Default timezone for all dates and times
                      </p>
                      <Input
                        value={settings?.timezone || "America/New_York"}
                        onChange={(e) => updateSetting("timezone", e.target.value)}
                        placeholder="America/New_York"
                        className="max-w-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">{t('admin.settings.generalSettings.language')}</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Primary language for your wedding site
                      </p>
                      <select
                        value={settings?.language || "en"}
                        onChange={(e) => updateSetting("language", e.target.value)}
                        className="max-w-xs h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Save Button */}
            {hasChanges && activeSection !== 'subscription' && activeSection !== 'features' && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="gap-2"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
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
  )
}

interface FeatureItemProps {
  label: string
  description: string
  available: boolean
  isPremium?: boolean
}

function FeatureItem({ label, description, available, isPremium }: FeatureItemProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
      <div className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
        available 
          ? 'bg-green-100 dark:bg-green-900/30' 
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        {available ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <X className="h-4 w-4 text-gray-400 dark:text-gray-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {isPremium && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded">
              Premium
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {!available && (
        <span className="text-xs text-muted-foreground flex-shrink-0">Not available</span>
      )}
    </div>
  )
}

interface FeatureStatusCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  available: boolean
  enabled: boolean
  isPremium?: boolean
}

function FeatureStatusCard({
  icon: Icon,
  label,
  description,
  available,
  enabled,
  isPremium,
}: FeatureStatusCardProps) {
  const { t } = useTranslation()
  return (
    <div className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
      available 
        ? 'border-border hover:border-border/80 bg-card' 
        : 'border-border/50 bg-muted/30 opacity-75'
    }`}>
      <div className="flex gap-3 flex-1">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            available ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <Icon className={`h-5 w-5 ${available ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className={`text-base font-medium ${!available && 'text-muted-foreground'}`}>
              {label}
            </Label>
            {isPremium && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                {t('admin.settings.premiumFeature')}
              </span>
            )}
            {!available && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                {t('admin.settings.locked')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {available && (
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-2 w-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {enabled ? t('admin.settings.active') : t('admin.settings.inactive')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
