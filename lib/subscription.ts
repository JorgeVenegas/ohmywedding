// Server-side subscription utilities
// Re-export shared types for convenience
export * from './subscription-shared'

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { 
  type PlanType, 
  type WeddingFeatures, 
  type UserSubscription,
  getDefaultFeatures 
} from './subscription-shared'

// Server-side: Get user's subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as UserSubscription
}

// Server-side: Get user's active plan type
export async function getUserPlanType(userId: string): Promise<PlanType> {
  const subscription = await getUserSubscription(userId)
  
  if (!subscription) {
    return 'free'
  }
  
  // Check if subscription is active and not expired
  if (subscription.status !== 'active' && subscription.status !== 'trial') {
    return 'free'
  }
  
  if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
    return 'free'
  }
  
  return subscription.plan_type
}

// Server-side: Get wedding features
export async function getWeddingFeatures(weddingId: string): Promise<WeddingFeatures> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('wedding_features')
    .select('*')
    .eq('wedding_id', weddingId)
    .single()
  
  if (error || !data) {
    // Return free defaults if no features found
    return getDefaultFeatures('free')
  }
  
  return {
    rsvp_enabled: data.rsvp_enabled,
    invitations_panel_enabled: data.invitations_panel_enabled,
    gallery_enabled: data.gallery_enabled,
    registry_enabled: data.registry_enabled,
    schedule_enabled: data.schedule_enabled,
  }
}

// Server-side: Check if a specific feature is enabled for a wedding
export async function isFeatureEnabled(
  weddingId: string, 
  feature: keyof WeddingFeatures
): Promise<boolean> {
  const features = await getWeddingFeatures(weddingId)
  return features[feature]
}

// Server-side: Check if user has premium access
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const planType = await getUserPlanType(userId)
  return planType === 'premium'
}
