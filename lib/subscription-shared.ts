// Shared subscription types and utilities (safe for client and server)

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

// ─── Two-axis plan: Invitation × Management ────────────────────────────────

export type InvitationTier = 'basic' | 'personalized' | 'bespoke'
export type ManagementTier = 'basic' | 'pro' | 'agency'
export type PricingAxis = 'invitation' | 'management'

// Numeric level — higher means more capable
const INV_LEVEL: Record<InvitationTier, number> = { basic: 0, personalized: 1, bespoke: 2 }
const MGMT_LEVEL: Record<ManagementTier, number> = { basic: 0, pro: 1, agency: 2 }

export function invitationTierLevel(tier: InvitationTier): number {
  return INV_LEVEL[tier]
}
export function managementTierLevel(tier: ManagementTier): number {
  return MGMT_LEVEL[tier]
}
export function hasPaidInvitation(tier: InvitationTier): boolean {
  return tier !== 'basic'
}
export function hasPaidManagement(tier: ManagementTier): boolean {
  return tier !== 'basic'
}
export function hasPaidPlanFromTiers(inv: InvitationTier, mgmt: ManagementTier): boolean {
  return inv !== 'basic' || mgmt !== 'basic'
}

// ─── Feature flags (what access each tier combo unlocks) ───────────────────

export interface WeddingFeatures {
  rsvp_enabled: boolean
  invitations_panel_enabled: boolean
  gallery_enabled: boolean
  registry_enabled: boolean
  schedule_enabled: boolean
  seating_enabled: boolean
}

export function getDefaultFeatures(
  invTier: InvitationTier = 'basic',
  mgmtTier: ManagementTier = 'basic',
): WeddingFeatures {
  return {
    rsvp_enabled: mgmtTier !== 'basic',
    invitations_panel_enabled: invTier !== 'basic',
    gallery_enabled: true,
    registry_enabled: true, // basic registry links available to all
    schedule_enabled: true,
    seating_enabled: mgmtTier === 'pro' || mgmtTier === 'agency',
  }
}

// Features that require a paid invitation tier
export function requiresInvitation(feature: keyof WeddingFeatures): boolean {
  return feature === 'invitations_panel_enabled'
}

// Features that require a paid management tier
export function requiresManagement(feature: keyof WeddingFeatures): boolean {
  return feature === 'rsvp_enabled' || feature === 'seating_enabled'
}

// ─── Pricing constants ─────────────────────────────────────────────────────

export const INVITATION_PRICING = {
  basic: {
    name: 'Basic',
    tagline: 'A beautiful invitation, ready to send',
    price_usd: 5000,
    price_mxn: 100000,
    priceDisplay: '$50 USD',
    priceDisplayMXN: '$1,000 MXN',
    period: 'one-time',
    description: 'One template, ready to go — no design decisions required.',
  },
  personalized: {
    name: 'Personalized',
    tagline: 'Your story, your sections, your look',
    price_usd: 20000,
    price_mxn: 400000,
    priceDisplay: '$200 USD',
    priceDisplayMXN: '$4,000 MXN',
    period: 'one-time',
    description: 'Choose your template, colors, and which sections tell your story.',
  },
  bespoke: {
    name: 'Bespoke',
    tagline: 'Custom-built by our design team',
    price_usd: 35000,
    price_mxn: 700000,
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
    price_usd: 5000,
    price_mxn: 100000,
    priceDisplay: '$50 USD',
    priceDisplayMXN: '$1,000 MXN',
    period: 'one-time',
    description: 'Guest list and RSVP tracking — the essentials.',
  },
  pro: {
    name: 'Pro',
    tagline: 'The full planning toolkit',
    price_usd: 15000,
    price_mxn: 300000,
    priceDisplay: '$150 USD',
    priceDisplayMXN: '$3,000 MXN',
    period: 'one-time',
    description: 'Message templates, activity reports, seating chart, and registry.',
  },
  agency: {
    name: 'Agency',
    tagline: 'Built for wedding planners',
    price_usd: 25000,
    price_mxn: 500000,
    priceDisplay: '$250 USD',
    priceDisplayMXN: '$5,000 MXN',
    period: 'one-time',
    description: 'Manage every wedding you run from one dashboard, with client transparency built in.',
  },
} as const

// ─── Localized copy ────────────────────────────────────────────────────────

export const TIER_LOCALE_COPY: Record<string, Record<PricingAxis, Record<string, { name: string; description: string }>>> = {
  es: {
    invitation: {
      basic:        { name: 'Básico',        description: 'Una plantilla lista para usar — sin decisiones de diseño.' },
      personalized: { name: 'Personalizado', description: 'Elige tu plantilla, colores y las secciones que cuentan tu historia.' },
      bespoke:      { name: 'A Medida',      description: 'Diseñamos tu invitación desde cero en tu propio dominio personalizado.' },
    },
    management: {
      basic:  { name: 'Básico',    description: 'Lista de invitados y seguimiento de confirmaciones — lo esencial.' },
      pro:    { name: 'Pro',       description: 'Plantillas de mensajes, reportes de actividad, mapa de mesas y mesa de regalos.' },
      agency: { name: 'Agencia',   description: 'Gestiona cada boda desde un solo panel, con transparencia hacia el cliente.' },
    },
  },
}

export function getTierLocaleCopy(
  axis: PricingAxis,
  tier: string,
  locale: string,
): { name: string; description: string } {
  const localeCopy = TIER_LOCALE_COPY[locale]?.[axis]?.[tier]
  if (localeCopy) return localeCopy
  const pricing = axis === 'invitation'
    ? INVITATION_PRICING[tier as InvitationTier]
    : MANAGEMENT_PRICING[tier as ManagementTier]
  return { name: pricing.name, description: pricing.description }
}

// Returns a short human-readable label for the combination, e.g.
// "Personalized Invitation + Pro Management" or "Bespoke Invitation"
export function planLabel(inv: InvitationTier, mgmt: ManagementTier, locale = 'en'): string {
  const invName = getTierLocaleCopy('invitation', inv, locale).name
  const mgmtName = getTierLocaleCopy('management', mgmt, locale).name
  const invPaid = inv !== 'basic'
  const mgmtPaid = mgmt !== 'basic'
  if (!invPaid && !mgmtPaid) return locale === 'es' ? 'Prueba gratuita' : 'Free trial'
  if (invPaid && mgmtPaid) return `${invName} + ${mgmtName}`
  if (invPaid) return `${invName} Invitation`
  return `${mgmtName} Management`
}

// ─── Card definitions ──────────────────────────────────────────────────────

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

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatMXNFromCents(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')} MXN`
}
