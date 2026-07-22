// Shared quote types and helpers — safe for client and server

import {
  INVITATION_PRICING,
  MANAGEMENT_PRICING,
} from '@/lib/subscription-shared'

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'expired' | 'cancelled'
export type DiscountType = 'percent' | 'fixed'

export interface QuoteScenario {
  label: string
  invitation_tier?: 'basic' | 'personalized' | 'bespoke'
  management_tier?: 'basic' | 'pro' | 'agency'
  invitation_price_cents: number
  management_price_cents: number
  total_price_cents: number
}

export interface Quote {
  id: string
  quote_number: string
  recipient_name: string
  recipient_email: string | null
  recipient_whatsapp: string | null
  notes: string | null
  scenarios: QuoteScenario[]
  discount_type: DiscountType
  discount_value: number
  coupon_id: string | null
  coupon_code: string | null
  coupon_expires_at: string | null
  language: 'en' | 'es'
  status: QuoteStatus
  wedding_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export function computeDiscountedPrice(
  total_cents: number,
  type: DiscountType,
  value: number
): number {
  if (type === 'percent') {
    return Math.max(0, Math.round(total_cents * (1 - value / 100)))
  }
  return Math.max(0, total_cents - value)
}

export function getScenarioPrices(invitation_tier?: string, management_tier?: string) {
  const invitation_price_cents = invitation_tier
    ? (INVITATION_PRICING[invitation_tier as keyof typeof INVITATION_PRICING]?.price_mxn ?? 0)
    : 0
  const management_price_cents = management_tier
    ? (MANAGEMENT_PRICING[management_tier as keyof typeof MANAGEMENT_PRICING]?.price_mxn ?? 0)
    : 0
  return {
    invitation_price_cents,
    management_price_cents,
    total_price_cents: invitation_price_cents + management_price_cents,
  }
}

export function formatMXN(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')} MXN`
}

// Self-contained feature lists ordered by relevance.
// Each tier describes only what it includes, no cross-references.
const INVITATION_EXPANDED: Record<string, string[]> = {
  basic: [
    'Your invitation hosted at yourname.ohmy.wedding',
    'Core sections: Hero, Our Story & Event Details',
    'Classic envelope with curated color & font pairings',
    'Mobile-optimized for every device',
    'RSVP system (requires a Management plan)',
  ],
  personalized: [
    'Your own personal domain: yourname.ohmy.wedding',
    'All invitation sections: Hero, Our Story, Details, Dresscode, Hotel Suggestions & Gift Registry',
    'Designed around your style with custom colors, fonts & unlimited photo galleries',
    'Personalized envelope design crafted to match your look',
    'Personalized greeting addressed to each guest by name',
    'Unlimited photos throughout all sections',
  ],
  bespoke: [
    'Fully custom-built from scratch by our design team, no templates ever',
    'Your own branded domain: yourname.ohmy.wedding',
    'Every section you want, designed by hand: Our Story, Details, Dresscode, Hotel, Registry, Our People, Music & more',
    'Any section or feature you can imagine, we build it',
    'Handcrafted typography & a visual identity designed exclusively for you',
    'Unique bespoke envelope designed only for your wedding',
    'Personalized greeting addressed to each guest by name',
    'Unlimited photos & media throughout',
  ],
}

const MANAGEMENT_EXPANDED: Record<string, string[]> = {
  basic: [
    'Guest list management',
    'RSVP tracking & confirmations',
    'Activity feed: see who confirmed or declined (last 3 entries) — invitation opens not tracked',
  ],
  pro: [
    'Unlimited guests & guest groups',
    'Full RSVP system with tracking & confirmations',
    'WhatsApp message templates - send invitations to your guests easily',
    'Activity feed: see in real time who opened your invitation, confirmed or declined',
    'Event timeline to plan and track every wedding milestone',
    'Supplier management: contracts, contacts & payments',
    'Menu & dish management: dietary requirements per guest',
    'Seating chart designer',
    'Gift registry with secure Stripe payouts directly to you',
    'Collaborator access: share your wedding with your planner or team',
  ],
  agency: [
    'Multi-wedding dashboard: manage all your events from one place',
    'Unlimited guests & guest groups per wedding',
    'Full RSVP system with tracking & confirmations',
    'WhatsApp templates and one-click sending to all guests',
    'Activity feed per wedding: see opens, confirmations and declines in real time',
    'Event timeline to plan and track every milestone per wedding',
    'Supplier management: contracts, contacts & payments',
    'Menu & dish management: dietary requirements per guest',
    'Seating chart designer for every event',
    'Gift registry with secure Stripe payouts',
    'Collaborator access: share each wedding with your team & clients',
    'AI chatbot to handle guest FAQs automatically',
    'AI wedding planning assistant for you & your team',
    'White-label branding: your logo & identity throughout',
    'Priority support from our team',
  ],
}

const INVITATION_EXPANDED_ES: Record<string, string[]> = {
  basic: [
    'Invitación en tu propio enlace: tunombre.ohmy.wedding',
    'Secciones esenciales: Hero, Nuestra Historia y Detalles del Evento',
    'Sobre clásico con paletas de color y tipografía curadas',
    'Optimizada para todos los dispositivos',
    'Sistema de RSVP (requiere un plan de Gestión)',
  ],
  personalized: [
    'Tu propio dominio personalizado: tunombre.ohmy.wedding',
    'Todas las secciones: Hero, Nuestra Historia, Detalles, Código de Vestimenta, Sugerencias de Hotel y Mesa de Regalos',
    'Diseñada a tu estilo con colores, tipografías y galerías de fotos ilimitadas',
    'Diseño de sobre personalizado para complementar tu estética',
    'Saludo personalizado dirigido a cada invitado por nombre',
    'Fotos ilimitadas en todas las secciones',
  ],
  bespoke: [
    'Diseñada desde cero por nuestro equipo, sin plantillas',
    'Tu propio dominio con identidad visual personalizada: tunombre.ohmy.wedding',
    'Cada sección que desees, diseñada a mano: Nuestra Historia, Detalles, Código de Vestimenta, Hotel, Mesa de Regalos, Nuestras Personas, Música y más',
    'Cualquier sección o función que imagines, la construimos',
    'Tipografía artesanal e identidad visual diseñada exclusivamente para ti',
    'Sobre único diseñado especialmente para tu boda',
    'Saludo personalizado dirigido a cada invitado por nombre',
    'Fotos y multimedia ilimitadas',
  ],
}

const MANAGEMENT_EXPANDED_ES: Record<string, string[]> = {
  basic: [
    'Gestión de lista de invitados',
    'Seguimiento de RSVP y confirmaciones',
    'Actividad reciente: ve quién confirmó o declinó (últimas 3 entradas) — aperturas de invitación no incluidas',
  ],
  pro: [
    'Invitados y grupos ilimitados',
    'Sistema completo de RSVP con seguimiento y confirmaciones',
    'Plantillas de WhatsApp - envía invitaciones a tus invitados fácilmente',
    'Actividad en tiempo real: ve quién abrió tu invitación, confirmó o declinó',
    'Línea de tiempo del evento para planear y dar seguimiento a cada etapa',
    'Gestión de proveedores: contratos, contactos y pagos',
    'Gestión de menús y platillos: requisitos dietéticos por invitado',
    'Diseñador de plano de mesas',
    'Mesa de regalos con pagos seguros directamente a ti',
    'Acceso para colaboradores: comparte tu boda con tu planner o equipo',
  ],
  agency: [
    'Panel multi-boda: gestiona todos tus eventos desde un solo lugar',
    'Invitados y grupos ilimitados por boda',
    'Sistema completo de RSVP con seguimiento y confirmaciones',
    'Plantillas de WhatsApp y envío masivo con un clic',
    'Actividad en tiempo real por boda: ve aperturas, confirmaciones y declines',
    'Línea de tiempo del evento para planear y dar seguimiento a cada etapa',
    'Gestión de proveedores: contratos, contactos y pagos',
    'Gestión de menús y platillos: requisitos dietéticos por invitado',
    'Diseñador de plano de mesas por evento',
    'Mesa de regalos con pagos seguros',
    'Acceso para colaboradores: comparte cada boda con tu equipo y clientes',
    'Chatbot de IA para responder preguntas de invitados automáticamente',
    'Asistente de planificación con IA para ti y tu equipo',
    'Marca personalizable: tu logo e identidad en todo momento',
    'Soporte prioritario de nuestro equipo',
  ],
}

export function getScenarioFeaturesLocalized(
  scenario: QuoteScenario,
  language: 'en' | 'es'
): { invitation: string[]; management: string[]; isExpanded: boolean } {
  const hasInvitation = !!scenario.invitation_tier
  const hasManagement = !!scenario.management_tier
  const invExp = language === 'es' ? INVITATION_EXPANDED_ES : INVITATION_EXPANDED
  const mgmtExp = language === 'es' ? MANAGEMENT_EXPANDED_ES : MANAGEMENT_EXPANDED

  return {
    invitation: hasInvitation ? (invExp[scenario.invitation_tier!] ?? []) : [],
    management: hasManagement ? (mgmtExp[scenario.management_tier!] ?? []) : [],
    // Single axis: render as a flat merged list; dual axis: two labelled columns
    isExpanded: hasInvitation !== hasManagement,
  }
}

export function getScenarioFeatures(scenario: QuoteScenario): {
  invitation: string[]
  management: string[]
  isExpanded: boolean
} {
  const hasInvitation = !!scenario.invitation_tier
  const hasManagement = !!scenario.management_tier

  // Single axis: expand inheritance explicitly
  if (hasInvitation && !hasManagement) {
    return {
      invitation: INVITATION_EXPANDED[scenario.invitation_tier!] ?? [],
      management: [],
      isExpanded: true,
    }
  }
  if (!hasInvitation && hasManagement) {
    return {
      invitation: [],
      management: MANAGEMENT_EXPANDED[scenario.management_tier!] ?? [],
      isExpanded: true,
    }
  }

  // Both axes: show all features explicitly — no "Everything in X" shorthand
  return {
    invitation: hasInvitation ? INVITATION_EXPANDED[scenario.invitation_tier!] ?? [] : [],
    management: hasManagement ? MANAGEMENT_EXPANDED[scenario.management_tier!] ?? [] : [],
    isExpanded: false,
  }
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-400',
}
