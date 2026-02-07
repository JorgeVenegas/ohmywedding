"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Feature {
  feature_key: string
  enabled: boolean
  limit_value: number | null
}

export function useWeddingFeaturesPublic(weddingNameId: string) {
  const [plan, setPlan] = useState<'free' | 'premium' | 'deluxe' | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get wedding ID from wedding_name_id
        const { data: wedding, error: weddingError } = await supabase
          .from('weddings')
          .select('id')
          .eq('wedding_name_id', weddingNameId)
          .single()

        if (weddingError) {
          console.error('Wedding lookup error:', {
            message: weddingError.message,
            code: weddingError.code,
            weddingNameId
          })
          throw new Error(`Failed to find wedding: ${weddingError.message}`)
        }

        // Get wedding plan from wedding_subscriptions
        const { data: weddingFeatures, error: wfError } = await supabase
          .from('wedding_subscriptions')
          .select('plan')
          .eq('wedding_id', wedding.id)
          .single()

        if (wfError) {
          console.error('Wedding features query error:', {
            message: wfError.message,
            code: wfError.code,
            weddingId: wedding.id
          })
          throw new Error(`Failed to fetch wedding features: ${wfError.message}`)
        }

        const weddingPlan = weddingFeatures?.plan || 'free'
        setPlan(weddingPlan)

        // Get all plan features for this plan
        const { data: planFeatures, error: pfError } = await supabase
          .from('plan_features')
          .select('feature_key, enabled, limit_value')
          .eq('plan', weddingPlan)

        if (pfError) {
          console.error('Plan features query error:', {
            message: pfError.message,
            code: pfError.code,
            plan: weddingPlan
          })
          throw new Error(`Failed to fetch plan features: ${pfError.message}`)
        }

        setFeatures(planFeatures || [])
      } catch (err) {
        console.error('Error in useWeddingFeaturesPublic:', {
          error: err,
          weddingNameId,
          message: err instanceof Error ? err.message : 'Unknown error'
        })
        setError(err instanceof Error ? err.message : 'Failed to fetch features')
      } finally {
        setLoading(false)
      }
    }

    if (weddingNameId) {
      fetchFeatures()
    }
  }, [weddingNameId])

  return { plan, features, loading, error }
}

export function isFeatureEnabled(features: Feature[], featureKey: string): boolean {
  const feature = features.find(f => f.feature_key === featureKey)
  return feature?.enabled || false
}

export function getFeatureLimit(features: Feature[], featureKey: string): number | null {
  const feature = features.find(f => f.feature_key === featureKey)
  return feature?.limit_value ?? null
}
