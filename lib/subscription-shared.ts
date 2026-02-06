// Shared subscription types and utilities (safe for client and server)

export type PlanType = 'free' | 'premium' | 'deluxe'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'

// Feature keys used in plan_features table
export type FeatureKey = 
  | 'guests_limit'
  | 'guest_groups_limit'
  | 'activity_tracking_limit'
  | 'rsvp_enabled'
  | 'custom_registry_enabled'
  | 'registry_links_enabled'
  | 'subdomain_enabled'
  | 'confirmation_tracking_enabled'
  | 'message_templates_enabled'
  | 'activity_reports_enabled'
  | 'whatsapp_automation_enabled'
  | 'custom_components_enabled'
  | 'ticket_support_enabled'
  | 'dedicated_support_enabled'
  | 'registry_commission'

export interface UserSubscription {
  id: string
  user_id: string
  plan_type: PlanType
  status: SubscriptionStatus
  started_at: string
  expires_at: string | null
  cancelled_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface WeddingFeatures {
  rsvp_enabled: boolean
  invitations_panel_enabled: boolean
  gallery_enabled: boolean
  registry_enabled: boolean
  schedule_enabled: boolean
  plan?: PlanType
}

// Database-driven plan feature (from plan_features table)
export interface PlanFeatureRow {
  id: string
  plan: PlanType
  feature_key: FeatureKey
  enabled: boolean
  limit_value: number | null
  config_json: Record<string, unknown>
  description: string | null
}

export interface PlanPricing {
  id: string
  plan: PlanType
  price_usd: number
  price_mxn: number
  stripe_price_id_usd: string | null
  stripe_price_id_mxn: string | null
}

export interface PlanFeature {
  name: string
  description: string
  included_free: boolean
  included_premium: boolean
  included_deluxe: boolean
}

// Define all features and their availability by plan
export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Wedding Website',
    description: 'Beautiful, customizable wedding website',
    included_free: true,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Gallery',
    description: 'Photo gallery with multiple layouts',
    included_free: true,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Gift Registry Links',
    description: 'Connect your external gift registries',
    included_free: true,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Schedule/Timeline',
    description: 'Display your wedding day schedule',
    included_free: true,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Guest Management',
    description: 'Up to 50 guests (Free), 250 (Premium), Unlimited (Deluxe)',
    included_free: true,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'RSVP System',
    description: 'Online RSVPs with phone verification',
    included_free: false,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Custom Registry',
    description: 'Accept contributions with Stripe payments',
    included_free: false,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Custom Subdomain',
    description: 'Your own subdomain (e.g., john-and-jane.ohmywedding.mx)',
    included_free: false,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Confirmation Tracking',
    description: 'Track when guests open invitations',
    included_free: false,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'Activity Reports',
    description: 'Weekly (Premium) or Daily (Deluxe) reports',
    included_free: false,
    included_premium: true,
    included_deluxe: true,
  },
  {
    name: 'WhatsApp Automation',
    description: 'Automated WhatsApp messages to guests',
    included_free: false,
    included_premium: false,
    included_deluxe: true,
  },
  {
    name: 'Custom Components',
    description: 'Create custom section components',
    included_free: false,
    included_premium: false,
    included_deluxe: true,
  },
  {
    name: 'Dedicated Support',
    description: 'Personal support agent',
    included_free: false,
    included_premium: false,
    included_deluxe: true,
  },
]

// Pricing information
export const PRICING = {
  free: {
    name: 'Free',
    price_usd: 0,
    price_mxn: 0,
    priceDisplay: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
  },
  premium: {
    name: 'Premium',
    price_usd: 25000, // $250 USD in cents
    price_mxn: 500000, // $5,000 MXN in centavos
    priceDisplay: '$250 USD',
    priceDisplayMXN: '$5,000 MXN',
    period: 'one-time',
    description: 'Everything you need for your big day',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  },
  deluxe: {
    name: 'Deluxe',
    price_usd: 50000, // $500 USD in cents
    price_mxn: 1000000, // $10,000 MXN in centavos
    priceDisplay: '$500 USD',
    priceDisplayMXN: '$10,000 MXN',
    period: 'one-time',
    description: 'The ultimate wedding experience',
    stripePriceId: process.env.STRIPE_DELUXE_PRICE_ID || '',
  },
}

// Default features for each plan
export function getDefaultFeatures(planType: PlanType): WeddingFeatures {
  if (planType === 'deluxe') {
    return {
      rsvp_enabled: true,
      invitations_panel_enabled: true,
      gallery_enabled: true,
      registry_enabled: true,
      schedule_enabled: true,
      plan: 'deluxe',
    }
  }
  
  if (planType === 'premium') {
    return {
      rsvp_enabled: true,
      invitations_panel_enabled: true,
      gallery_enabled: true,
      registry_enabled: true,
      schedule_enabled: true,
      plan: 'premium',
    }
  }
  
  return {
    rsvp_enabled: false,
    invitations_panel_enabled: false,
    gallery_enabled: true,
    registry_enabled: true,
    schedule_enabled: true,
    plan: 'free',
  }
}

// Check if feature requires a paid plan
export function requiresPremium(feature: keyof WeddingFeatures): boolean {
  const premiumFeatures: (keyof WeddingFeatures)[] = [
    'rsvp_enabled',
    'invitations_panel_enabled',
  ]
  return premiumFeatures.includes(feature)
}

// Check if user has at least the required plan level
export function hasPlanLevel(userPlan: PlanType, requiredPlan: PlanType): boolean {
  const planLevels: Record<PlanType, number> = {
    free: 0,
    premium: 1,
    deluxe: 2,
  }
  return planLevels[userPlan] >= planLevels[requiredPlan]
}
