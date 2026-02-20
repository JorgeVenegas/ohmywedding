import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { WeddingFeatures, PlanType } from "@/lib/subscription-shared"
import { getDefaultFeatures } from "@/lib/subscription-shared"

export interface SubscriptionCheckResult {
  isAuthenticated: boolean
  userId: string | null
  planType: PlanType
  features: WeddingFeatures
  error?: string
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

  // Check if user is a superuser first
  const { data: superuserData } = await supabase
    .from('superusers')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (superuserData) {
    return {
      isAuthenticated: true,
      userId: user.id,
      planType: 'deluxe',
      features: getDefaultFeatures('deluxe'),
    }
  }
  
  // Get user subscription (DEPRECATED - user subscriptions have been removed)
  // NOTE: Plans are now per-wedding, not per-user. Kept for backwards compatibility.
  let planType: PlanType = 'free'
  // Previously checked user_subscriptions, but this table has been removed.
  // Plans are now determined at the wedding level.
  
  // If weddingNameId provided, also check wedding-specific features
  if (weddingNameId) {
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    if (wedding) {
      const { data: weddingFeatures } = await supabase
        .from('wedding_subscriptions')
        .select('plan')
        .eq('wedding_id', wedding.id)
        .single()
      
      if (weddingFeatures) {
        const weddingPlan = weddingFeatures.plan as PlanType
        return {
          isAuthenticated: true,
          userId: user.id,
          planType: weddingPlan,
          features: getDefaultFeatures(weddingPlan),
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
          upgrade_url: `/upgrade?source=api_gate_${feature}`,
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
          upgrade_url: '/upgrade?source=api_gate_premium',
        },
        { status: 403 }
      ),
    }
  }
  
  return { allowed: true }
}
