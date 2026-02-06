// Server-side subscription utilities
// Re-export shared types for convenience
export * from './subscription-shared'

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { 
  type PlanType, 
  type WeddingFeatures, 
  type UserSubscription,
  type FeatureKey,
  type PlanFeatureRow,
  type PlanPricing,
  getDefaultFeatures,
  hasPlanLevel,
} from './subscription-shared'

// =============================================================================
// USER SUBSCRIPTION FUNCTIONS
// =============================================================================

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

// =============================================================================
// WEDDING PLAN FUNCTIONS (Database-driven)
// =============================================================================

// Get the plan for a specific wedding
export async function getWeddingPlan(weddingId: string): Promise<PlanType> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('wedding_features')
    .select('plan')
    .eq('wedding_id', weddingId)
    .single()
  
  if (error || !data) {
    return 'free'
  }
  
  return (data.plan as PlanType) || 'free'
}

// Get a specific feature configuration for a plan
export async function getPlanFeature(
  plan: PlanType, 
  featureKey: FeatureKey
): Promise<PlanFeatureRow | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('plan_features')
    .select('*')
    .eq('plan', plan)
    .eq('feature_key', featureKey)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as PlanFeatureRow
}

// Check if a feature is enabled for a plan
export async function canAccessFeature(
  plan: PlanType, 
  featureKey: FeatureKey
): Promise<boolean> {
  const feature = await getPlanFeature(plan, featureKey)
  return feature?.enabled ?? false
}

// Check if a wedding can access a feature
export async function canWeddingAccessFeature(
  weddingId: string, 
  featureKey: FeatureKey
): Promise<boolean> {
  const plan = await getWeddingPlan(weddingId)
  return canAccessFeature(plan, featureKey)
}

// Get the limit value for a feature
export async function getFeatureLimit(
  plan: PlanType, 
  featureKey: FeatureKey
): Promise<number | null> {
  const feature = await getPlanFeature(plan, featureKey)
  return feature?.limit_value ?? null
}

// Get the limit for a wedding's feature
export async function getWeddingFeatureLimit(
  weddingId: string, 
  featureKey: FeatureKey
): Promise<number | null> {
  const plan = await getWeddingPlan(weddingId)
  return getFeatureLimit(plan, featureKey)
}

// Get feature config JSON
export async function getFeatureConfig<T = Record<string, unknown>>(
  plan: PlanType, 
  featureKey: FeatureKey
): Promise<T | null> {
  const feature = await getPlanFeature(plan, featureKey)
  return (feature?.config_json as T) ?? null
}

// Get feature config for a wedding
export async function getWeddingFeatureConfig<T = Record<string, unknown>>(
  weddingId: string, 
  featureKey: FeatureKey
): Promise<T | null> {
  const plan = await getWeddingPlan(weddingId)
  return getFeatureConfig<T>(plan, featureKey)
}

// Get all features for a plan
export async function getPlanFeatures(plan: PlanType): Promise<PlanFeatureRow[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('plan_features')
    .select('*')
    .eq('plan', plan)
    .order('feature_key')
  
  if (error || !data) {
    return []
  }
  
  return data as PlanFeatureRow[]
}

// Get plan pricing
export async function getPlanPricing(plan: PlanType): Promise<PlanPricing | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('plan_pricing')
    .select('*')
    .eq('plan', plan)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as PlanPricing
}

// Get all plan pricing
export async function getAllPlanPricing(): Promise<PlanPricing[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('plan_pricing')
    .select('*')
    .order('price_usd')
  
  if (error || !data) {
    return []
  }
  
  return data as PlanPricing[]
}

// Get registry commission for a wedding (in centavos)
export async function getRegistryCommission(weddingId: string): Promise<number> {
  const config = await getWeddingFeatureConfig<{ commission_mxn: number }>(
    weddingId, 
    'registry_commission'
  )
  // Default to 20 MXN (2000 centavos) if not found
  return config?.commission_mxn ?? 2000
}

// =============================================================================
// LEGACY WEDDING FEATURES FUNCTIONS
// =============================================================================

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
    plan: data.plan || 'free',
  }
}

// Server-side: Check if a specific feature is enabled for a wedding
export async function isFeatureEnabled(
  weddingId: string, 
  feature: keyof WeddingFeatures
): Promise<boolean> {
  const features = await getWeddingFeatures(weddingId)
  const value = features[feature]
  return typeof value === 'boolean' ? value : false
}

// Server-side: Check if user has premium or deluxe access
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const planType = await getUserPlanType(userId)
  return hasPlanLevel(planType, 'premium')
}

// Server-side: Check if user has deluxe access
export async function hasDeluxeAccess(userId: string): Promise<boolean> {
  const planType = await getUserPlanType(userId)
  return planType === 'deluxe'
}
