"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/use-auth'
import { 
  type PlanType, 
  type WeddingFeatures, 
  getDefaultFeatures,
  PLAN_FEATURES,
  PRICING
} from '@/lib/subscription-shared'
interface UseSubscriptionReturn {
  planType: PlanType
  features: WeddingFeatures
  loading: boolean
  error: string | null
  isPremium: boolean
  canAccessFeature: (feature: keyof WeddingFeatures) => boolean
  refetch: () => Promise<void>
}

// Hook to get user's subscription status
export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth()
  const [planType, setPlanType] = useState<PlanType>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setPlanType('free')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        // Check if subscription is active and not expired
        const isActive = data.status === 'active' || data.status === 'trial'
        const isExpired = data.expires_at && new Date(data.expires_at) < new Date()
        
        if (isActive && !isExpired) {
          setPlanType(data.plan_type as PlanType)
        } else {
          setPlanType('free')
        }
      } else {
        setPlanType('free')
      }
      
      setError(null)
    } catch (err) {
      setError('Failed to fetch subscription')
      setPlanType('free')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription()
    }
  }, [authLoading, fetchSubscription])

  const features = getDefaultFeatures(planType)
  const isPremium = planType === 'premium'

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures) => {
    return features[feature]
  }, [features])

  return {
    planType,
    features,
    loading: loading || authLoading,
    error,
    isPremium,
    canAccessFeature,
    refetch: fetchSubscription,
  }
}

interface UseWeddingFeaturesReturn {
  features: WeddingFeatures
  loading: boolean
  error: string | null
  canAccessFeature: (feature: keyof WeddingFeatures) => boolean
  refetch: () => Promise<void>
}

// Hook to get features for a specific wedding
export function useWeddingFeatures(weddingId: string | null): UseWeddingFeaturesReturn {
  const [features, setFeatures] = useState<WeddingFeatures>(getDefaultFeatures('free'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = useCallback(async () => {
    if (!weddingId) {
      setFeatures(getDefaultFeatures('free'))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      
      // First get the wedding UUID from wedding_name_id
      const { data: wedding, error: weddingError } = await supabase
        .from('weddings')
        .select('id')
        .eq('wedding_name_id', weddingId)
        .single()

      if (weddingError || !wedding) {
        setFeatures(getDefaultFeatures('free'))
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('wedding_features')
        .select('*')
        .eq('wedding_id', wedding.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setFeatures({
          rsvp_enabled: data.rsvp_enabled,
          invitations_panel_enabled: data.invitations_panel_enabled,
          gallery_enabled: data.gallery_enabled,
          registry_enabled: data.registry_enabled,
          schedule_enabled: data.schedule_enabled,
        })
      } else {
        setFeatures(getDefaultFeatures('free'))
      }
      
      setError(null)
    } catch (err) {
      setError('Failed to fetch features')
      setFeatures(getDefaultFeatures('free'))
    } finally {
      setLoading(false)
    }
  }, [weddingId])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures) => {
    return features[feature]
  }, [features])

  return {
    features,
    loading,
    error,
    canAccessFeature,
    refetch: fetchFeatures,
  }
}

// Re-export for convenience
export { PLAN_FEATURES, PRICING, getDefaultFeatures }
export type { PlanType, WeddingFeatures }
