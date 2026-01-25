import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { WeddingFeatures, PlanType } from "@/lib/subscription-shared"

export interface SubscriptionCheckResult {
  isAuthenticated: boolean
  userId: string | null
  planType: PlanType
  features: WeddingFeatures
  error?: string
}

// Get default features based on plan type
function getDefaultFeatures(planType: PlanType): WeddingFeatures {
  if (planType === 'premium') {
    return {
      rsvp_enabled: true,
      invitations_panel_enabled: true,
      gallery_enabled: true,
      registry_enabled: true,
      schedule_enabled: true,
    }
  }
  
  return {
    rsvp_enabled: false,
    invitations_panel_enabled: false,
    gallery_enabled: true,
    registry_enabled: true,
    schedule_enabled: true,
  }
}

// Check subscription and features for API route
export async function checkSubscription(weddingNameId?: string): Promise<SubscriptionCheckResult> {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      isAuthenticated: false,
      userId: null,
      planType: 'free',
      features: getDefaultFeatures('free'),
      error: 'Not authenticated',
    }
  }
  
  // Get user subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  let planType: PlanType = 'free'
  if (subscription) {
    const isActive = subscription.status === 'active' || subscription.status === 'trial'
    const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date()
    if (isActive && !isExpired) {
      planType = subscription.plan_type as PlanType
    }
  }
  
  // If weddingNameId provided, also check wedding-specific features
  if (weddingNameId) {
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    if (wedding) {
      const { data: weddingFeatures } = await supabase
        .from('wedding_features')
        .select('*')
        .eq('wedding_id', wedding.id)
        .single()
      
      if (weddingFeatures) {
        return {
          isAuthenticated: true,
          userId: user.id,
          planType,
          features: {
            rsvp_enabled: weddingFeatures.rsvp_enabled,
            invitations_panel_enabled: weddingFeatures.invitations_panel_enabled,
            gallery_enabled: weddingFeatures.gallery_enabled,
            registry_enabled: weddingFeatures.registry_enabled,
            schedule_enabled: weddingFeatures.schedule_enabled,
          },
        }
      }
    }
  }
  
  return {
    isAuthenticated: true,
    userId: user.id,
    planType,
    features: getDefaultFeatures(planType),
  }
}

// Check if a specific feature is enabled
export async function requireFeature(
  feature: keyof WeddingFeatures,
  weddingNameId?: string
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const check = await checkSubscription(weddingNameId)
  
  if (!check.isAuthenticated) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }
  
  if (!check.features[feature]) {
    return {
      allowed: false,
      response: NextResponse.json(
        { 
          error: 'This feature requires a Premium subscription',
          feature,
          upgrade_url: '/upgrade',
        },
        { status: 403 }
      ),
    }
  }
  
  return { allowed: true }
}

// Helper to quickly check premium for API route and return error response if needed
export async function requirePremium(weddingNameId?: string): Promise<{ allowed: boolean; response?: NextResponse }> {
  const check = await checkSubscription(weddingNameId)
  
  if (!check.isAuthenticated) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }
  
  if (check.planType !== 'premium') {
    return {
      allowed: false,
      response: NextResponse.json(
        { 
          error: 'This feature requires a Premium subscription',
          upgrade_url: '/upgrade',
        },
        { status: 403 }
      ),
    }
  }
  
  return { allowed: true }
}
