"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/use-auth'
import {
  type InvitationTier,
  type ManagementTier,
  type WeddingFeatures,
  getDefaultFeatures,
  hasPaidInvitation,
  hasPaidManagement,
  hasPaidPlanFromTiers,
  requiresInvitation,
  requiresManagement,
} from '@/lib/subscription-shared'

interface SubscriptionContextValue {
  invitationTier: InvitationTier
  managementTier: ManagementTier
  hasPaidPlan: boolean
  isPremium: boolean // alias for hasPaidPlan
  features: WeddingFeatures
  loading: boolean
  weddingId: string | null
  freeTrialStartedAt: string | null
  canAccessFeature: (feature: keyof WeddingFeatures) => boolean
  refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

interface SubscriptionProviderProps {
  children: React.ReactNode
  weddingId: string
}

export function SubscriptionProvider({ children, weddingId }: SubscriptionProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const [invitationTier, setInvitationTier] = useState<InvitationTier>('basic')
  const [managementTier, setManagementTier] = useState<ManagementTier>('basic')
  const [features, setFeatures] = useState<WeddingFeatures>(getDefaultFeatures('basic', 'basic'))
  const [loading, setLoading] = useState(true)
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [freeTrialStartedAt, setFreeTrialStartedAt] = useState<string | null>(null)

  const fetchSubscriptionAndFeatures = useCallback(async () => {
    if (!user || !weddingId) {
      setInvitationTier('basic')
      setManagementTier('basic')
      setFeatures(getDefaultFeatures('basic', 'basic'))
      setIsSuperuser(false)
      setFreeTrialStartedAt(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      let isSuperuserUser = false
      try {
        const response = await fetch('/api/user/is-superuser', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const { isSuperuser: su } = await response.json()
          isSuperuserUser = su
        }
      } catch {
        isSuperuserUser = false
      }

      setIsSuperuser(isSuperuserUser)

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isUUID = UUID_REGEX.test(weddingId)

      const weddingQuery = supabase
        .from('weddings')
        .select('id, created_at')

      const { data: wedding } = isUUID
        ? await weddingQuery.eq('id', weddingId).single()
        : await weddingQuery.eq('wedding_name_id', weddingId).single()

      if (wedding) {
        const { data: sub } = await supabase
          .from('wedding_subscriptions')
          .select('invitation_tier, management_tier, plan, created_at')
          .eq('wedding_id', wedding.id)
          .single()

        if (sub) {
          // Prefer explicit tier columns; fall back to legacy plan mapping for old records
          const legacyPlan = (sub as any).plan as string | null
          const invTier: InvitationTier =
            (sub.invitation_tier as InvitationTier) ||
            (legacyPlan === 'deluxe' ? 'bespoke' : legacyPlan === 'premium' ? 'personalized' : 'basic')
          const mgmtTier: ManagementTier =
            (sub.management_tier as ManagementTier) ||
            (legacyPlan === 'deluxe' ? 'agency' : legacyPlan === 'premium' ? 'pro' : 'basic')

          setInvitationTier(invTier)
          setManagementTier(mgmtTier)
          setFreeTrialStartedAt(sub.created_at ?? (wedding as any).created_at ?? null)

          if (isSuperuserUser) {
            setFeatures({
              rsvp_enabled: true,
              invitations_panel_enabled: true,
              gallery_enabled: true,
              registry_enabled: true,
              schedule_enabled: true,
              seating_enabled: true,
            })
          } else {
            setFeatures(getDefaultFeatures(invTier, mgmtTier))
          }
        } else {
          setFreeTrialStartedAt((wedding as any).created_at ?? null)
          setInvitationTier('basic')
          setManagementTier('basic')
          if (isSuperuserUser) {
            setFeatures({
              rsvp_enabled: true,
              invitations_panel_enabled: true,
              gallery_enabled: true,
              registry_enabled: true,
              schedule_enabled: true,
              seating_enabled: true,
            })
          } else {
            setFeatures(getDefaultFeatures('basic', 'basic'))
          }
        }
      } else {
        setInvitationTier('basic')
        setManagementTier('basic')
        setFeatures(getDefaultFeatures('basic', 'basic'))
      }
    } catch {
      setInvitationTier('basic')
      setManagementTier('basic')
      setFeatures(getDefaultFeatures('basic', 'basic'))
      setIsSuperuser(false)
      setFreeTrialStartedAt(null)
    } finally {
      setLoading(false)
    }
  }, [user, weddingId])

  useEffect(() => {
    if (!authLoading) {
      fetchSubscriptionAndFeatures()
    }
  }, [authLoading, fetchSubscriptionAndFeatures])

  const hasPaidPlan = hasPaidPlanFromTiers(invitationTier, managementTier)

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures): boolean => {
    if (isSuperuser) return true
    if (requiresInvitation(feature) && !hasPaidInvitation(invitationTier)) return false
    if (requiresManagement(feature) && !hasPaidManagement(managementTier)) return false
    return features[feature] === true
  }, [features, invitationTier, managementTier, isSuperuser])

  return (
    <SubscriptionContext.Provider
      value={{
        invitationTier,
        managementTier,
        hasPaidPlan,
        isPremium: hasPaidPlan,
        features,
        loading: loading || authLoading,
        weddingId,
        freeTrialStartedAt,
        canAccessFeature,
        refetch: fetchSubscriptionAndFeatures,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}

export function withPremiumCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: keyof WeddingFeatures
) {
  return function WithPremiumCheckComponent(props: P) {
    const { canAccessFeature, loading } = useSubscriptionContext()

    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )
    }

    if (!canAccessFeature(feature)) {
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-4 py-20" />
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}
