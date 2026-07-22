// Server-side subscription utilities
// Re-export shared types for convenience
export * from './subscription-shared'

import { createServerSupabaseClient } from "@/lib/supabase-server"
import {
  type InvitationTier,
  type ManagementTier,
  type WeddingFeatures,
  type FeatureKey,
  getDefaultFeatures,
  hasPaidPlanFromTiers,
} from './subscription-shared'

// FeatureKey needed for getWeddingFeatureLimit
export type { FeatureKey }

// =============================================================================
// WEDDING SUBSCRIPTION FUNCTIONS
// =============================================================================

interface WeddingTiers {
  invitation_tier: InvitationTier
  management_tier: ManagementTier
}

export async function getWeddingTiers(weddingId: string): Promise<WeddingTiers> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('wedding_subscriptions')
    .select('invitation_tier, management_tier, plan')
    .eq('wedding_id', weddingId)
    .single()

  if (error || !data) {
    return { invitation_tier: 'basic', management_tier: 'basic' }
  }

  const legacyPlan = (data as any).plan as string | null
  const invTier: InvitationTier =
    (data.invitation_tier as InvitationTier) ||
    (legacyPlan === 'deluxe' ? 'bespoke' : legacyPlan === 'premium' ? 'personalized' : 'basic')
  const mgmtTier: ManagementTier =
    (data.management_tier as ManagementTier) ||
    (legacyPlan === 'deluxe' ? 'agency' : legacyPlan === 'premium' ? 'pro' : 'basic')

  return { invitation_tier: invTier, management_tier: mgmtTier }
}

// Get wedding features based on current tiers
export async function getWeddingFeatures(weddingId: string): Promise<WeddingFeatures> {
  const { invitation_tier, management_tier } = await getWeddingTiers(weddingId)
  return getDefaultFeatures(invitation_tier, management_tier)
}

// Check if a specific feature is enabled for a wedding
export async function isFeatureEnabled(
  weddingId: string,
  feature: keyof WeddingFeatures
): Promise<boolean> {
  const features = await getWeddingFeatures(weddingId)
  const value = features[feature]
  return typeof value === 'boolean' ? value : false
}

// Check if a wedding has any paid plan
export async function hasPaidPlan(weddingId: string): Promise<boolean> {
  const { invitation_tier, management_tier } = await getWeddingTiers(weddingId)
  return hasPaidPlanFromTiers(invitation_tier, management_tier)
}

// Get registry commission for a wedding (in centavos)
export async function getRegistryCommission(weddingId: string): Promise<number> {
  const supabase = await createServerSupabaseClient()
  // Try reading from the plan_features table if it exists
  try {
    const { invitation_tier, management_tier } = await getWeddingTiers(weddingId)
    const plan = management_tier === 'agency' ? 'deluxe' : management_tier === 'pro' ? 'premium' : 'free'
    const { data } = await supabase
      .from('plan_features')
      .select('config_json')
      .eq('plan', plan)
      .eq('feature_key', 'registry_commission')
      .single()
    const config = data?.config_json as { commission_mxn?: number } | null
    return config?.commission_mxn ?? 2000
  } catch {
    return 2000 // Default: 20 MXN
  }
}

// Get a limit value for a feature by plan (reads from plan_features table)
export async function getWeddingFeatureLimit(
  weddingId: string,
  featureKey: FeatureKey
): Promise<number | null> {
  const supabase = await createServerSupabaseClient()
  try {
    const { invitation_tier, management_tier } = await getWeddingTiers(weddingId)
    const plan = management_tier === 'agency' ? 'deluxe' : management_tier === 'pro' ? 'premium' : 'free'
    const { data } = await supabase
      .from('plan_features')
      .select('limit_value')
      .eq('plan', plan)
      .eq('feature_key', featureKey)
      .single()
    return data?.limit_value ?? null
  } catch {
    return null
  }
}

// Deprecated stubs
export async function hasPremiumAccess(_userId: string): Promise<boolean> {
  return false
}

export async function hasDeluxeAccess(_userId: string): Promise<boolean> {
  return false
}
