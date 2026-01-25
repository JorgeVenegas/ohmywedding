// Shared subscription types and utilities (safe for client and server)

export type PlanType = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'

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
}

export interface PlanFeature {
  name: string
  description: string
  included_free: boolean
  included_premium: boolean
}

// Define all features and their availability by plan
export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Wedding Website',
    description: 'Beautiful, customizable wedding website',
    included_free: true,
    included_premium: true,
  },
  {
    name: 'Gallery',
    description: 'Photo gallery with multiple layouts',
    included_free: true,
    included_premium: true,
  },
  {
    name: 'Gift Registry',
    description: 'Connect your gift registries',
    included_free: true,
    included_premium: true,
  },
  {
    name: 'Schedule/Timeline',
    description: 'Display your wedding day schedule',
    included_free: true,
    included_premium: true,
  },
  {
    name: 'Guest Management',
    description: 'Manage unlimited guests and groups',
    included_free: false,
    included_premium: true,
  },
  {
    name: 'RSVP System',
    description: 'Online RSVPs with phone verification',
    included_free: false,
    included_premium: true,
  },
  {
    name: 'Invitations Panel',
    description: 'Send and track digital invitations',
    included_free: false,
    included_premium: true,
  },
  {
    name: 'Travel Tracking',
    description: 'Track guest travel arrangements',
    included_free: false,
    included_premium: true,
  },
  {
    name: 'Priority Support',
    description: '24/7 priority customer support',
    included_free: false,
    included_premium: true,
  },
]

// Pricing information
export const PRICING = {
  free: {
    name: 'Free',
    price: 0,
    priceDisplay: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
  },
  premium: {
    name: 'Premium',
    price: 2900, // in cents for Stripe
    priceDisplay: '$29',
    period: 'one-time',
    description: 'Everything you need for your big day',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  },
}

// Default features for each plan
export function getDefaultFeatures(planType: PlanType): WeddingFeatures {
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

// Check if feature requires premium
export function requiresPremium(feature: keyof WeddingFeatures): boolean {
  const premiumFeatures: (keyof WeddingFeatures)[] = [
    'rsvp_enabled',
    'invitations_panel_enabled',
  ]
  return premiumFeatures.includes(feature)
}
