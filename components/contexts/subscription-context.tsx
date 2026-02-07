"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/use-auth'
import { 
  type PlanType, 
  type WeddingFeatures, 
  getDefaultFeatures,
  requiresPremium,
} from '@/lib/subscription-shared'

interface SubscriptionContextValue {
  planType: PlanType
  features: WeddingFeatures
  loading: boolean
  isPremium: boolean
  weddingId: string | null
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
  const [planType, setPlanType] = useState<PlanType>('free')
  const [features, setFeatures] = useState<WeddingFeatures>(getDefaultFeatures('free'))
  const [loading, setLoading] = useState(true)
  const [isSuperuser, setIsSuperuser] = useState(false)

  const fetchSubscriptionAndFeatures = useCallback(async () => {
    if (!user || !weddingId) {
      setPlanType('free')
      setFeatures(getDefaultFeatures('free'))
      setIsSuperuser(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      // Check if user is a superuser first via API route (avoids RLS issues)
      let isSuperuserUser = false
      try {
        const response = await fetch('/api/user/is-superuser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const { isSuperuser } = await response.json()
          isSuperuserUser = isSuperuser
        }
      } catch (err) {
        // Silently fail superuser check - not critical
        isSuperuserUser = false
      }

      setIsSuperuser(isSuperuserUser)

      // Fetch wedding features (which includes the wedding's plan)
      // weddingId could be either UUID or wedding_name_id, so we need to handle both
      const isUUID = weddingId.includes('-')
      
      const weddingQuery = supabase
        .from('weddings')
        .select('id')
      
      const { data: wedding } = isUUID
        ? await weddingQuery.eq('id', weddingId).single()
        : await weddingQuery.eq('wedding_name_id', weddingId).single()

      if (wedding) {
        const { data: weddingFeatures } = await supabase
          .from('wedding_subscriptions')
          .select('plan')
          .eq('wedding_id', wedding.id)
          .single()

        if (weddingFeatures) {
          // Always use the wedding's plan as the source of truth
          const weddingPlan = (weddingFeatures.plan as PlanType) || 'free'
          setPlanType(weddingPlan)
          
          // Superusers get all features enabled regardless of plan
          if (isSuperuserUser) {
            setFeatures({
              rsvp_enabled: true,
              invitations_panel_enabled: true,
              gallery_enabled: true,
              registry_enabled: true,
              schedule_enabled: true,
            })
          } else {
            setFeatures(getDefaultFeatures(weddingPlan))
          }
        } else {
          // No subscription record yet
          if (isSuperuserUser) {
            // Superuser still sees all features but plan stays free
            setPlanType('free')
            setFeatures({
              rsvp_enabled: true,
              invitations_panel_enabled: true,
              gallery_enabled: true,
              registry_enabled: true,
              schedule_enabled: true,
            })
          } else {
            // No wedding subscription found, default to free
            setPlanType('free')
            setFeatures(getDefaultFeatures('free'))
          }
        }
      } else {
        // Wedding not found
        setPlanType('free')
        setFeatures(getDefaultFeatures('free'))
      }
    } catch (error) {
      setPlanType('free')
      setFeatures(getDefaultFeatures('free'))
      setIsSuperuser(false)
    } finally {
      setLoading(false)
    }
  }, [user, weddingId])

  useEffect(() => {
    if (!authLoading) {
      fetchSubscriptionAndFeatures()
    }
  }, [authLoading, fetchSubscriptionAndFeatures])

  const isPremium = planType === 'premium' || planType === 'deluxe'

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures): boolean => {
    // Handle the plan field which is a string, not a boolean
    if (feature === 'plan') {
      return planType !== 'free'
    }
    // Defense-in-depth: premium features always require a paid plan,
    // regardless of what the DB boolean says (prevents stale data issues).
    // Superusers bypass this so they can still access everything.
    if (!isSuperuser && requiresPremium(feature) && planType === 'free') {
      return false
    }
    return features[feature] === true
  }, [features, planType, isSuperuser])

  return (
    <SubscriptionContext.Provider 
      value={{
        planType,
        features,
        loading: loading || authLoading,
        isPremium,
        weddingId,
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

// HOC to wrap components that require premium access
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
          <div className="max-w-2xl mx-auto px-4 py-20">
            {/* Import and use PremiumUpgradePrompt here */}
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}
