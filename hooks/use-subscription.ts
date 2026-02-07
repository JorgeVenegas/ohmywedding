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

// Hook to get user's subscription status (DEPRECATED - plans are now per-wedding)
export function useSubscription(): UseSubscriptionReturn {
  // User subscriptions have been removed. Default to free.
  // To get a wedding's plan, use useWeddingFeatures() instead.
  const { user, loading: authLoading } = useAuth()
  
  const features = getDefaultFeatures('free')
  const isPremium = false

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures): boolean => {
    const value = features[feature]
    // Handle the plan field which is a string, not a boolean
    if (feature === 'plan') {
      return value !== 'free'
    }
    return value === true
  }, [features])

  return {
    planType: 'free',
    features,
    loading: authLoading,
    error: null,
    isPremium,
    canAccessFeature,
    refetch: async () => {},
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
        .from('wedding_subscriptions')
        .select('plan')
        .eq('wedding_id', wedding.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        const plan = data.plan as PlanType
        setFeatures(getDefaultFeatures(plan))
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

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures): boolean => {
    const value = features[feature]
    // Handle the plan field which is a string, not a boolean
    if (feature === 'plan') {
      return value !== 'free'
    }
    return value === true
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
