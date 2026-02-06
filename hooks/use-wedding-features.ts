import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export type PlanType = 'free' | 'premium' | 'deluxe'

export interface PlanFeature {
  feature_key: string
  enabled: boolean
  limit_value: number | null
}

export interface WeddingFeatures {
  plan: PlanType
  features: Record<string, { enabled: boolean; limit: number | null }>
  loading: boolean
  error: string | null
}

/**
 * Hook to fetch wedding features based on the wedding's plan
 * This is the source of truth for what features are available
 * Works for all users including superusers - features are based solely on wedding plan
 */
export function useWeddingFeatures(weddingId: string | undefined): WeddingFeatures {
  const [plan, setPlan] = useState<PlanType>('free')
  const [features, setFeatures] = useState<Record<string, { enabled: boolean; limit: number | null }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!weddingId) {
      setLoading(false)
      return
    }

    const fetchFeatures = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        // Detect if weddingId is a UUID or wedding_name_id
        const isUUID = weddingId.includes('-') && weddingId.length === 36
        
        let actualWeddingId: string
        
        if (!isUUID) {
          // It's a wedding_name_id, look up the UUID
          const { data: wedding, error: lookupError } = await supabase
            .from('weddings')
            .select('id')
            .eq('wedding_name_id', weddingId)
            .single()
          
          if (lookupError) {
            console.error('Wedding lookup error:', {
              message: lookupError.message,
              code: lookupError.code,
              weddingNameId: weddingId
            })
            throw new Error(`Failed to find wedding: ${lookupError.message}`)
          }
          
          actualWeddingId = wedding.id
        } else {
          actualWeddingId = weddingId
        }

        // Get wedding plan
        const { data: weddingFeatures, error: weddingError } = await supabase
          .from('wedding_features')
          .select('plan')
          .eq('wedding_id', actualWeddingId)
          .single()

        if (weddingError) {
          console.error('Wedding features query error:', {
            message: weddingError.message,
            code: weddingError.code,
            details: weddingError.details,
            hint: weddingError.hint
          })
          throw new Error(`Failed to fetch wedding plan: ${weddingError.message}`)
        }

        const weddingPlan = (weddingFeatures?.plan as PlanType) || 'free'
        setPlan(weddingPlan)

        // Get all features for this plan
        const { data: planFeatures, error: featuresError } = await supabase
          .from('plan_features')
          .select('feature_key, enabled, limit_value')
          .eq('plan', weddingPlan)

        if (featuresError) {
          console.error('Plan features query error:', {
            message: featuresError.message,
            code: featuresError.code,
            details: featuresError.details,
            hint: featuresError.hint
          })
          throw new Error(`Failed to fetch plan features: ${featuresError.message}`)
        }

        // Convert to object for easy lookup
        const featuresMap: Record<string, { enabled: boolean; limit: number | null }> = {}
        planFeatures?.forEach((feature) => {
          featuresMap[feature.feature_key] = {
            enabled: feature.enabled,
            limit: feature.limit_value
          }
        })

        setFeatures(featuresMap)
      } catch (err) {
        console.error('Error fetching wedding features:', {
          error: err,
          weddingId,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        })
        setError(err instanceof Error ? err.message : 'Failed to fetch features')
      } finally {
        setLoading(false)
      }
    }

    fetchFeatures()
  }, [weddingId])

  return { plan, features, loading, error }
}

/**
 * Helper to check if a specific feature is enabled
 */
export function isFeatureEnabled(
  features: WeddingFeatures['features'],
  featureKey: string
): boolean {
  return features[featureKey]?.enabled ?? false
}

/**
 * Helper to get feature limit
 */
export function getFeatureLimit(
  features: WeddingFeatures['features'],
  featureKey: string
): number | null {
  return features[featureKey]?.limit ?? null
}
