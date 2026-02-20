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
  | 'seating_enabled'

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
  seating_enabled: boolean
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
  {
    name: 'Seating Chart',
    description: 'Interactive floor plan designer with drag-and-drop table arrangement',
    included_free: false,
    included_premium: false,
    included_deluxe: true,
  },
]

// Pricing information
export const PRICING = {
  free: {
    name: 'Free',
    tagline: 'Get started for free',
    price_usd: 0,
    price_mxn: 0,
    priceDisplay: '$0',
    priceDisplayMXN: '$0 MXN',
    period: 'forever',
    description: 'Create your free wedding website with essential features to get started.',
  },
  premium: {
    name: 'Premium',
    tagline: 'We do it together',
    price_usd: 35000, // $350 USD in cents
    price_mxn: 700000, // $7,000 MXN in centavos
    priceDisplay: '$350 USD',
    priceDisplayMXN: '$7,000 MXN',
    period: 'one-time',
    description: 'We accompany you from day one — premium features, expert guidance, and all existing components at your fingertips.',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  },
  deluxe: {
    name: 'Deluxe',
    tagline: 'We take care of everything',
    price_usd: 75000, // $750 USD in cents
    price_mxn: 1500000, // $15,000 MXN in centavos
    priceDisplay: '$750 USD',
    priceDisplayMXN: '$15,000 MXN',
    period: 'one-time',
    description: 'The ultimate bespoke experience — we create your wedding page with completely personalized, custom-made components and exceptional attention to detail.',
    stripePriceId: process.env.STRIPE_DELUXE_PRICE_ID || '',
  },
}

// --- Centralized plan card definitions (for upgrade + landing pages) ---

export const PLAN_CARDS = {
  free: {
    name: PRICING.free.name,
    tagline: PRICING.free.tagline,
    price: PRICING.free.priceDisplayMXN,
    period: PRICING.free.period,
    description: 'A refined start for your celebration',
    features: [
      'Beautiful wedding website',
      'Photo gallery',
      'Event schedule',
      'Gift registry links',
      'Up to 50 guests',
      'Last 10 activities only',
    ],
    cta: 'Get Started',
    href: '/create-wedding',
  },
  premium: {
    name: PRICING.premium.name,
    tagline: PRICING.premium.tagline,
    price: PRICING.premium.priceDisplayMXN,
    period: PRICING.premium.period,
    description: 'We accompany you from day one with expert guidance and premium tools',
    features: [
      'Everything in Free',
      'Up to 250 guests',
      'Unlimited guest groups',
      '1 week activity retention',
      'Personalized invitations',
      'Bespoke registry with secure payouts',
      'Bespoke domain option',
      'Website stays forever',
      'Expert guidance & advice from our team',
    ],
    cta: 'Upgrade to Premium',
    href: '/upgrade?source=pricing_premium',
  },
  deluxe: {
    name: PRICING.deluxe.name,
    tagline: PRICING.deluxe.tagline,
    price: PRICING.deluxe.priceDisplayMXN,
    period: PRICING.deluxe.period,
    description: 'We take care of everything — bespoke design, personalized components, exceptional attention to detail',
    features: [
      'Everything in Premium',
      'Unlimited guests & groups',
      'Unlimited activity retention',
      'Completely personalized, bespoke components',
      'Bespoke domain setup',
      'Daily activity reports',
      'WhatsApp automation (extra cost)',
      'Lower registry commission',
      'Dedicated personal support agent',
      'We design & build your entire page',
      'Interactive seating chart designer',
    ],
    cta: 'Go Deluxe',
    href: '/upgrade?plan=deluxe&source=pricing_deluxe',
  },
}

// --- Centralized feature comparison table ---

export const COMPARISON_FEATURES = [
  { category: 'Core Features', features: [
    { name: 'Beautiful wedding website', free: true, premium: true, deluxe: true },
    { name: 'Photo gallery', free: true, premium: true, deluxe: true },
    { name: 'Event schedule', free: true, premium: true, deluxe: true },
    { name: 'Gift registry links', free: true, premium: true, deluxe: true },
    { name: 'Website permanence', free: '6 months', premium: 'Forever', deluxe: 'Forever' },
  ]},
  { category: 'Guest Management', features: [
    { name: 'Guest limit', free: '50', premium: '250', deluxe: 'Unlimited' },
    { name: 'Guest groups', free: '15', premium: 'Unlimited', deluxe: 'Unlimited' },
    { name: 'Advanced RSVP system', free: false, premium: true, deluxe: true },
    { name: 'Activity tracking', free: 'Last 10', premium: '1 week', deluxe: 'Unlimited' },
  ]},
  { category: 'Registry & Payments', features: [
    { name: 'Bespoke registry with secure payouts', free: false, premium: true, deluxe: true },
    { name: 'No personal account sharing', free: false, premium: true, deluxe: true },
    { name: 'Registry commission', free: '—', premium: '20 MXN', deluxe: '10 MXN' },
  ]},
  { category: 'Invitations & Communication', features: [
    { name: 'Personalized digital invitations', free: false, premium: true, deluxe: true },
    { name: 'Invitation activity tracking', free: false, premium: true, deluxe: true },
    { name: 'WhatsApp automation (extra cost)', free: false, premium: false, deluxe: true },
    { name: 'Curated message templates', free: false, premium: true, deluxe: true },
  ]},
  { category: 'Customization & Design', features: [
    { name: 'Personalized subdomain', free: false, premium: true, deluxe: true },
    { name: 'Bespoke domain support', free: false, premium: true, deluxe: true },
    { name: 'Activity reports', free: false, premium: 'Weekly', deluxe: 'Daily' },
    { name: 'Bespoke section components', free: false, premium: false, deluxe: true },
    { name: 'Completely personalized page design', free: false, premium: false, deluxe: true },
    { name: 'Interactive seating chart', free: false, premium: false, deluxe: true },
  ]},
  { category: 'Experience & Support', features: [
    { name: 'Email support', free: true, premium: true, deluxe: true },
    { name: 'Expert guidance & advice', free: false, premium: true, deluxe: true },
    { name: 'Dedicated personal support agent', free: false, premium: false, deluxe: true },
    { name: 'We design & build your page', free: false, premium: false, deluxe: true },
  ]},
] as const

// Default features for each plan
export function getDefaultFeatures(planType: PlanType): WeddingFeatures {
  if (planType === 'deluxe') {
    return {
      rsvp_enabled: true,
      invitations_panel_enabled: true,
      gallery_enabled: true,
      registry_enabled: true,
      schedule_enabled: true,
      seating_enabled: true,
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
      seating_enabled: false,
      plan: 'premium',
    }
  }
  
  return {
    rsvp_enabled: false,
    invitations_panel_enabled: false,
    gallery_enabled: true,
    registry_enabled: true,
    schedule_enabled: true,
    seating_enabled: false,
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
