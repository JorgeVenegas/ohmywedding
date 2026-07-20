// Shared subscription types and utilities (safe for client and server)

export type PlanType = 'free' | 'premium' | 'deluxe'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'

// Feature keys used in plan_features table
export type FeatureKey = 
  | 'guests_limit'
  | 'guest_groups_limit'
  | 'activity_tracking_limit'
  | 'suppliers_limit'
  | 'menus_limit'
  | 'itinerary_limit'
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
    description: 'Up to 100 guests (Lovers), 250 (Premium), Unlimited (Deluxe)',
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
    name: 'Lovers',
    tagline: 'Start planning your wedding',
    price_usd: 2500, // $25 USD in cents
    price_mxn: 50000, // $500 MXN in centavos
    priceDisplay: '$25 USD',
    priceDisplayMXN: '$500 MXN',
    period: 'one-time',
    description: 'Create your wedding website and start organizing your celebration.',
  },
  premium: {
    name: 'Premium',
    tagline: 'We plan it together',
    price_usd: 35000, // $350 USD in cents
    price_mxn: 700000, // $7,000 MXN in centavos
    priceDisplay: '$350 USD',
    priceDisplayMXN: '$7,000 MXN',
    period: 'one-time',
    description: 'We accompany you from day one — intuitive planning tools, expert guidance, and everything you need to organize your wedding.',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    msiMonths: [3] as const,
  },
  deluxe: {
    name: 'Deluxe',
    tagline: 'Bespoke design, full control',
    price_usd: 75000, // $750 USD in cents
    price_mxn: 1500000, // $15,000 MXN in centavos
    priceDisplay: '$750 USD',
    priceDisplayMXN: '$15,000 MXN',
    period: 'one-time',
    description: 'We design your complete wedding page from scratch. You and your team manage everything with the full planning suite — or invite your wedding planner to co-manage.',
    stripePriceId: process.env.STRIPE_DELUXE_PRICE_ID || '',
    msiMonths: [3, 6] as const,
  },
}

// --- Centralized plan card definitions (for upgrade + landing pages) ---

export const PLAN_CARDS = {
  free: {
    name: PRICING.free.name,
    tagline: PRICING.free.tagline,
    price: PRICING.free.priceDisplayMXN,
    period: PRICING.free.period,
    description: 'Start planning your wedding with a beautiful website',
    features: [
      'Beautiful wedding website',
      'Photo gallery',
      'Event schedule',
      'Gift registry links',
      'Up to 100 guests',
      'Up to 3 suppliers',
      '1 menu',
      'Up to 5 itinerary events',
      'Last 3 activities',
    ],
    cta: 'Get Started',
    href: '/create-wedding',
  },
  premium: {
    name: PRICING.premium.name,
    tagline: PRICING.premium.tagline,
    price: PRICING.premium.priceDisplayMXN,
    period: PRICING.premium.period,
    description: 'We accompany you from day one with intuitive tools and expert guidance to plan your wedding',
    features: [
      'Everything in Lovers',
      'Up to 250 guests',
      'Unlimited guest groups',
      '1 week activity retention',
      'Personalized invitations',
      'Bespoke registry with secure payouts',
      'Bespoke domain option',
      'Website stays forever',
      'Expert guidance & advice from our team',
      'Share access with collaborators & wedding planners',
    ],
    cta: 'Upgrade to Premium',
    href: '/upgrade?source=pricing_premium',
  },
  deluxe: {
    name: PRICING.deluxe.name,
    tagline: PRICING.deluxe.tagline,
    price: PRICING.deluxe.priceDisplayMXN,
    period: PRICING.deluxe.period,
    description: 'We design your complete wedding page from scratch. You and your team manage everything with the full planning suite — or invite your wedding planner to co-manage.',
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
      'We design your complete wedding page from scratch',
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
    { name: 'Guest limit', free: '100', premium: '250', deluxe: 'Unlimited' },
    { name: 'Guest groups', free: '15', premium: 'Unlimited', deluxe: 'Unlimited' },
    { name: 'Advanced RSVP system', free: false, premium: true, deluxe: true },
    { name: 'Activity tracking', free: 'Last 3', premium: '1 week', deluxe: 'Unlimited' },
    { name: 'Suppliers', free: '3', premium: 'Unlimited', deluxe: 'Unlimited' },
    { name: 'Menus', free: '1', premium: 'Unlimited', deluxe: 'Unlimited' },
    { name: 'Itinerary events', free: '5', premium: 'Unlimited', deluxe: 'Unlimited' },
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
    { name: 'Share with collaborators & wedding planners', free: false, premium: true, deluxe: true },
    { name: 'Dedicated personal support agent', free: false, premium: false, deluxe: true },
    { name: 'We design your complete wedding page', free: false, premium: false, deluxe: true },
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

// Formats a centavos amount the same way the static priceDisplayMXN strings
// above are written (e.g. 37500 -> "$375 MXN"), for prices computed at runtime
// (discounts, totals) rather than read directly off a pricing constant.
export function formatMXNFromCents(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')} MXN`
}

// --- Two-axis pricing: Invitation and Management are independently purchasable ---
// Final tier pricing: Basic $1,000 MXN, mid tier (Personalized/Pro) $4,000 MXN,
// top tier (Bespoke/Agency) $7,000 MXN — same 20:1 MXN:USD ratio used elsewhere
// in this file. No longer tied to the legacy PRICING.premium/deluxe ladder.

export type InvitationTier = 'basic' | 'personalized' | 'bespoke'
export type ManagementTier = 'basic' | 'pro' | 'agency'
export type PricingAxis = 'invitation' | 'management'

export const INVITATION_PRICING = {
  basic: {
    name: 'Basic',
    tagline: 'A beautiful invitation, ready to send',
    price_usd: 5000, // $50 USD in cents
    price_mxn: 100000, // $1,000 MXN in centavos
    priceDisplay: '$50 USD',
    priceDisplayMXN: '$1,000 MXN',
    period: 'one-time',
    description: 'One template, ready to go — no design decisions required.',
  },
  personalized: {
    name: 'Personalized',
    tagline: 'Your story, your sections, your look',
    price_usd: 20000, // $200 USD in cents
    price_mxn: 400000, // $4,000 MXN in centavos
    priceDisplay: '$200 USD',
    priceDisplayMXN: '$4,000 MXN',
    period: 'one-time',
    description: 'Choose your template, colors, and which sections tell your story.',
  },
  bespoke: {
    name: 'Bespoke',
    tagline: 'Custom-built by our design team',
    price_usd: 35000, // $350 USD in cents
    price_mxn: 700000, // $7,000 MXN in centavos
    priceDisplay: '$350 USD',
    priceDisplayMXN: '$7,000 MXN',
    period: 'one-time',
    description: 'We design your invitation from scratch, on your own custom domain.',
  },
} as const

export const MANAGEMENT_PRICING = {
  basic: {
    name: 'Basic',
    tagline: 'Guests and RSVPs, organized',
    price_usd: 5000, // $50 USD in cents
    price_mxn: 100000, // $1,000 MXN in centavos
    priceDisplay: '$50 USD',
    priceDisplayMXN: '$1,000 MXN',
    period: 'one-time',
    description: 'Guest list and RSVP tracking — the essentials.',
  },
  pro: {
    name: 'Pro',
    tagline: 'The full planning toolkit',
    price_usd: 20000, // $200 USD in cents
    price_mxn: 400000, // $4,000 MXN in centavos
    priceDisplay: '$200 USD',
    priceDisplayMXN: '$4,000 MXN',
    period: 'one-time',
    description: 'Message templates, activity reports, seating chart, and registry.',
  },
  agency: {
    name: 'Agency',
    tagline: 'Built for wedding planners',
    price_usd: 35000, // $350 USD in cents
    price_mxn: 700000, // $7,000 MXN in centavos
    priceDisplay: '$350 USD',
    priceDisplayMXN: '$7,000 MXN',
    period: 'one-time',
    description: 'Manage every wedding you run from one dashboard, with client transparency built in.',
  },
} as const

export const INVITATION_CARDS = {
  basic: {
    ...INVITATION_PRICING.basic,
    features: [
      'Hero, Our Story & Details sections',
      'RSVP* (requires Management plan)',
      'Basic envelope design',
      'Limited color & font variants',
    ],
    cta: 'Get Started',
    href: '/create-wedding?axis=invitation&tier=basic&source=pricing_invitation_basic',
  },
  personalized: {
    ...INVITATION_PRICING.personalized,
    features: [
      'Hero, Our Story & Details sections',
      'RSVP* (requires Management plan)',
      'Dresscode & Hotel suggestions sections',
      'Registry section',
      'Personalized envelope design',
      'Unlimited color & font variants',
      'Guest-personalized greetings',
      'Clean subdomain, no branding',
      'Unlimited photos',
    ],
    cta: 'Upgrade to Personalized',
    href: '/upgrade?axis=invitation&tier=personalized&source=pricing_invitation_personalized',
  },
  bespoke: {
    ...INVITATION_PRICING.bespoke,
    features: [
      'All Personalized sections',
      'RSVP* (requires Management plan)',
      'Our People section',
      'Music & playlist section',
      'Unique envelope design',
      'Unique custom page design',
      'Special & custom fonts',
      'Custom-built by our design team',
      'Your own bespoke domain',
    ],
    cta: 'Go Bespoke',
    href: '/upgrade?axis=invitation&tier=bespoke&source=pricing_invitation_bespoke',
  },
} as const

export const MANAGEMENT_CARDS = {
  basic: {
    ...MANAGEMENT_PRICING.basic,
    features: [
      'Guest list & RSVP tracking',
      'Up to 100 guests',
      'Last 3 activities',
    ],
    cta: 'Get Started',
    href: '/create-wedding?axis=management&tier=basic&source=pricing_management_basic',
  },
  pro: {
    ...MANAGEMENT_PRICING.pro,
    features: [
      'Everything in Basic',
      'Message templates',
      'Activity reports',
      'Seating chart designer',
      'Registry with secure payouts',
      'Unlimited guests & groups',
      'Collaborator access',
    ],
    cta: 'Upgrade to Pro',
    href: '/upgrade?axis=management&tier=pro&source=pricing_management_pro',
  },
  agency: {
    ...MANAGEMENT_PRICING.agency,
    features: [
      'Everything in Pro',
      'Multi-wedding dashboard',
      'Send invitations with one click',
      'AI chatbot answers guest FAQs automatically',
      'AI wedding planning assistant',
      'White-label branding',
      'Priority support',
    ],
    cta: 'Go Agency',
    href: '/upgrade?axis=management&tier=agency&source=pricing_management_agency',
  },
} as const

// Subscription pricing for all management tiers.
// Monthly = 1.5 × per-wedding price, Annual = 10 × per-wedding price.
// At 1.5 weddings/month (18/year) monthly breaks even; at 10/year annual breaks even.
export const MANAGEMENT_SUBSCRIPTION_PRICING = {
  basic: {
    monthly: { price_mxn: 150000, priceDisplayMXN: '$1,500 MXN', period: '/month', periodES: '/mes' },
    annual:  { price_mxn: 1000000, priceDisplayMXN: '$10,000 MXN', period: '/year', periodES: '/año', perMonthDisplayMXN: '$833 MXN', savingsPercent: 44 },
  },
  pro: {
    monthly: { price_mxn: 600000, priceDisplayMXN: '$6,000 MXN', period: '/month', periodES: '/mes' },
    annual:  { price_mxn: 4000000, priceDisplayMXN: '$40,000 MXN', period: '/year', periodES: '/año', perMonthDisplayMXN: '$3,333 MXN', savingsPercent: 44 },
  },
  agency: {
    monthly: { price_mxn: 1050000, priceDisplayMXN: '$10,500 MXN', period: '/month', periodES: '/mes' },
    annual:  { price_mxn: 7000000, priceDisplayMXN: '$70,000 MXN', period: '/year', periodES: '/año', perMonthDisplayMXN: '$5,833 MXN', savingsPercent: 44 },
  },
} as const

// Backward-compatible mapping from the two independent axes to the legacy
// single-ladder PlanType, so the ~30 existing plan-tier checks across the app
// (requireFeature, canAccessFeature, middleware subdomain routing, etc.) keep
// working unchanged while those axes are purchased independently.
export function deriveLegacyPlan(invitationTier: InvitationTier, managementTier: ManagementTier): PlanType {
  if (invitationTier === 'bespoke' || managementTier === 'agency') return 'deluxe'
  if (invitationTier === 'personalized' || managementTier === 'pro') return 'premium'
  return 'free'
}
