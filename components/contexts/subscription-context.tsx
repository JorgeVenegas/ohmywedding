"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/use-auth'
import { 
  type PlanType, 
  type WeddingFeatures, 
  getDefaultFeatures 
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

      // If superuser, grant all features
      if (isSuperuserUser) {
        setPlanType('premium')
        setFeatures({
          rsvp_enabled: true,
          invitations_panel_enabled: true,
          gallery_enabled: true,
          registry_enabled: true,
          schedule_enabled: true,
        })
        setLoading(false)
        return
      }

      // Fetch user subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      let userPlanType: PlanType = 'free'
      if (subscription) {
        const isActive = subscription.status === 'active' || subscription.status === 'trial'
        const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date()
        if (isActive && !isExpired) {
          userPlanType = subscription.plan_type as PlanType
        }
      }
      setPlanType(userPlanType)

      // Fetch wedding features
      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('wedding_name_id', weddingId)
        .single()

      if (wedding) {
        const { data: weddingFeatures } = await supabase
          .from('wedding_features')
          .select('*')
          .eq('wedding_id', wedding.id)
          .single()

        if (weddingFeatures) {
          setFeatures({
            rsvp_enabled: weddingFeatures.rsvp_enabled,
            invitations_panel_enabled: weddingFeatures.invitations_panel_enabled,
            gallery_enabled: weddingFeatures.gallery_enabled,
            registry_enabled: weddingFeatures.registry_enabled,
            schedule_enabled: weddingFeatures.schedule_enabled,
          })
        } else {
          // No features record - use defaults based on subscription
          setFeatures(getDefaultFeatures(userPlanType))
        }
      } else {
        setFeatures(getDefaultFeatures(userPlanType))
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

  const isPremium = planType === 'premium'

  const canAccessFeature = useCallback((feature: keyof WeddingFeatures) => {
    return features[feature]
  }, [features])

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
