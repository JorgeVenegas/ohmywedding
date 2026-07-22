"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/use-auth'
import {
  type InvitationTier,
  type ManagementTier,
  type WeddingFeatures,
  getDefaultFeatures,
  hasPaidPlanFromTiers,
} from '@/lib/subscription-shared'

interface UseWeddingSubscriptionReturn {
  invitationTier: InvitationTier
  managementTier: ManagementTier
  features: WeddingFeatures
  loading: boolean
  error: string | null
  hasPaidPlan: boolean
  isPremium: boolean
  canAccessFeature: (feature: keyof WeddingFeatures) => boolean
  refetch: () => Promise<void>
}

// Deprecated: user-level subscription no longer exists — this is a stub.
export function useSubscription() {
  const { loading: authLoading } = useAuth()
  const features = getDefaultFeatures('basic', 'basic')

  return {
    invitationTier: 'basic' as InvitationTier,
    managementTier: 'basic' as ManagementTier,
    features,
    loading: authLoading,
    error: null,
    hasPaidPlan: false,
    isPremium: false,
    canAccessFeature: (_feature: keyof WeddingFeatures) => false,
    refetch: async () => {},
  }
}

// Hook to get subscription for a specific wedding
export function useWeddingFeatures(weddingId: string | null): UseWeddingSubscriptionReturn {
  const [invitationTier, setInvitationTier] = useState<InvitationTier>('basic')
  const [managementTier, setManagementTier] = useState<ManagementTier>('basic')
  const [features, setFeatures] = useState<WeddingFeatures>(getDefaultFeatures('basic', 'basic'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = useCallback(async () => {
    if (!weddingId) {
      setFeatures(getDefaultFeatures('basic', 'basic'))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { data: wedding, error: weddingError } = await supabase
        .from('weddings')
        .select('id')
        .eq('wedding_name_id', weddingId)
        .single()

      if (weddingError || !wedding) {
        setFeatures(getDefaultFeatures('basic', 'basic'))
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('wedding_subscriptions')
        .select('invitation_tier, management_tier, plan')
        .eq('wedding_id', wedding.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        const legacyPlan = (data as any).plan as string | null
        const invTier: InvitationTier =
          (data.invitation_tier as InvitationTier) ||
          (legacyPlan === 'deluxe' ? 'bespoke' : legacyPlan === 'premium' ? 'personalized' : 'basic')
        const mgmtTier: ManagementTier =
          (data.management_tier as ManagementTier) ||
          (legacyPlan === 'deluxe' ? 'agency' : legacyPlan === 'premium' ? 'pro' : 'basic')
        setInvitationTier(invTier)
        setManagementTier(mgmtTier)
        setFeatures(getDefaultFeatures(invTier, mgmtTier))
      } else {
        setInvitationTier('basic')
        setManagementTier('basic')
        setFeatures(getDefaultFeatures('basic', 'basic'))
      }

      setError(null)
    } catch (err) {
      setError('Failed to fetch features')
      setInvitationTier('basic')
      setManagementTier('basic')
      setFeatures(getDefaultFeatures('basic', 'basic'))
    } finally {
      setLoading(false)
    }
  }, [weddingId])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  const hasPaidPlan = hasPaidPlanFromTiers(invitationTier, managementTier)

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures): boolean => {
    return features[feature] === true
  }, [features])

  return {
    invitationTier,
    managementTier,
    features,
    loading,
    error,
    hasPaidPlan,
    isPremium: hasPaidPlan,
    canAccessFeature,
    refetch: fetchFeatures,
  }
}

export { getDefaultFeatures }
export type { InvitationTier, ManagementTier, WeddingFeatures }
