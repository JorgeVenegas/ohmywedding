import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { InvitationTier, ManagementTier, WeddingFeatures } from "@/lib/subscription-shared"
import { getDefaultFeatures, hasPaidPlanFromTiers } from "@/lib/subscription-shared"

export interface SubscriptionCheckResult {
  isAuthenticated: boolean
  userId: string | null
  invitationTier: InvitationTier
  managementTier: ManagementTier
  hasPaidPlan: boolean
  features: WeddingFeatures
  error?: string
}

// Check subscription and features for API route
export async function checkSubscription(weddingNameId?: string): Promise<SubscriptionCheckResult> {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      isAuthenticated: false,
      userId: null,
      invitationTier: 'basic',
      managementTier: 'basic',
      hasPaidPlan: false,
      features: getDefaultFeatures('basic', 'basic'),
      error: 'Not authenticated',
    }
  }

  // Superusers get full access
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
      invitationTier: 'bespoke',
      managementTier: 'agency',
      hasPaidPlan: true,
      features: {
        rsvp_enabled: true,
        invitations_panel_enabled: true,
        gallery_enabled: true,
        registry_enabled: true,
        schedule_enabled: true,
        seating_enabled: true,
      },
    }
  }

  if (weddingNameId) {
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (wedding) {
      const { data: sub } = await supabase
        .from('wedding_subscriptions')
        .select('invitation_tier, management_tier, plan')
        .eq('wedding_id', wedding.id)
        .single()

      if (sub) {
        const legacyPlan = (sub as any).plan as string | null
        const invTier: InvitationTier =
          (sub.invitation_tier as InvitationTier) ||
          (legacyPlan === 'deluxe' ? 'bespoke' : legacyPlan === 'premium' ? 'personalized' : 'basic')
        const mgmtTier: ManagementTier =
          (sub.management_tier as ManagementTier) ||
          (legacyPlan === 'deluxe' ? 'agency' : legacyPlan === 'premium' ? 'pro' : 'basic')

        return {
          isAuthenticated: true,
          userId: user.id,
          invitationTier: invTier,
          managementTier: mgmtTier,
          hasPaidPlan: hasPaidPlanFromTiers(invTier, mgmtTier),
          features: getDefaultFeatures(invTier, mgmtTier),
        }
      }
    }
  }

  return {
    isAuthenticated: true,
    userId: user.id,
    invitationTier: 'basic',
    managementTier: 'basic',
    hasPaidPlan: false,
    features: getDefaultFeatures('basic', 'basic'),
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
          error: 'This feature requires an upgraded plan',
          feature,
          upgrade_url: `/upgrade?source=api_gate_${feature}`,
        },
        { status: 403 }
      ),
    }
  }

  return { allowed: true }
}

// Check if the wedding has any paid plan
export async function requirePaidPlan(weddingNameId?: string): Promise<{ allowed: boolean; response?: NextResponse }> {
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

  if (!check.hasPaidPlan) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'This feature requires an upgraded plan',
          upgrade_url: '/upgrade?source=api_gate_plan',
        },
        { status: 403 }
      ),
    }
  }

  return { allowed: true }
}

// Deprecated alias — use requirePaidPlan
export const requirePremium = requirePaidPlan
