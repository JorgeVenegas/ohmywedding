// Localized name/tagline/description/features/cta for the two-axis pricing cards.
// Price fields (amount, period) live in INVITATION_PRICING/MANAGEMENT_PRICING in
// subscription-shared.ts and aren't language-dependent — this file only covers
// the copy, so it stays in sync with the EN content there by construction.
//
// Feature lists are written out in full per tier — never "Everything in X" —
// since a visitor comparing plans has no idea what a lower tier includes.
// `highlight: true` marks what's specific to (or upgraded at) that tier, so the
// card can visually emphasize it against the carried-over baseline items.

import type { Locale } from './i18n/types'
import type { InvitationTier, ManagementTier } from './subscription-shared'

export interface CardFeature {
  text: string
  highlight?: boolean
}

interface CardCopy {
  name: string
  tagline: string
  description: string
  features: CardFeature[]
  cta: string
}

export const PRICING_CARD_CONTENT: Record<Locale, {
  invitation: Record<InvitationTier, CardCopy>
  management: Record<ManagementTier, CardCopy>
}> = {
  en: {
    invitation: {
      basic: {
        name: 'Basic',
        tagline: 'A beautiful invitation, ready to send',
        description: 'One template, ready to go — no design decisions required.',
        features: [
          { text: 'Hero, Our Story & Details sections' },
          { text: 'RSVP*' },
          { text: 'Basic envelope design' },
          { text: 'Limited color & font variants' },
        ],
        cta: 'Get Started',
      },
      personalized: {
        name: 'Personalized',
        tagline: 'Your story, your sections, your look',
        description: 'Choose your template, colors, and which sections tell your story.',
        features: [
          { text: 'Hero, Our Story & Details sections' },
          { text: 'RSVP*' },
          { text: 'Dresscode & Hotel suggestions sections', highlight: true },
          { text: 'Registry section', highlight: true },
          { text: 'Personalized envelope design', highlight: true },
          { text: 'Unlimited color & font variants', highlight: true },
          { text: 'Guest-personalized greetings', highlight: true },
          { text: 'Clean subdomain, no branding', highlight: true },
          { text: 'Unlimited photos', highlight: true },
        ],
        cta: 'Upgrade to Personalized',
      },
      bespoke: {
        name: 'Bespoke',
        tagline: 'Custom-built by our design team',
        description: 'We design your invitation from scratch, on your own custom domain.',
        features: [
          { text: 'All Personalized sections' },
          { text: 'RSVP*' },
          { text: 'Our People section', highlight: true },
          { text: 'Music & playlist section', highlight: true },
          { text: 'Unique envelope design', highlight: true },
          { text: 'Unique custom page design', highlight: true },
          { text: 'Special & custom fonts', highlight: true },
          { text: 'Custom-built by our design team, start to finish', highlight: true },
          { text: 'Your own bespoke domain', highlight: true },
        ],
        cta: 'Go Bespoke',
      },
    },
    management: {
      basic: {
        name: 'Basic',
        tagline: 'Guests and RSVPs, organized',
        description: 'Guest list and RSVP tracking — the essentials.',
        features: [
          { text: 'Guest list & RSVP tracking' },
          { text: 'Up to 100 guests' },
          { text: 'Last 3 activities' },
        ],
        cta: 'Get Started',
      },
      pro: {
        name: 'Pro',
        tagline: 'The full planning toolkit',
        description: 'Message templates, activity reports, seating chart, and registry.',
        features: [
          { text: 'Guest list & RSVP tracking' },
          { text: 'Unlimited guests & groups', highlight: true },
          { text: 'Message templates', highlight: true },
          { text: 'Activity reports', highlight: true },
          { text: 'Seating chart designer', highlight: true },
          { text: 'Registry with secure payouts', highlight: true },
          { text: 'Collaborator access', highlight: true },
        ],
        cta: 'Upgrade to Pro',
      },
      agency: {
        name: 'Agency',
        tagline: 'Built for wedding planners',
        description: 'Manage every wedding from one dashboard — send invitations with a click and let AI handle guest questions.',
        features: [
          { text: 'Guest list & RSVP tracking' },
          { text: 'Unlimited guests & groups' },
          { text: 'Message templates' },
          { text: 'Activity reports' },
          { text: 'Seating chart designer' },
          { text: 'Registry with secure payouts' },
          { text: 'Collaborator access' },
          { text: 'Multi-wedding dashboard', highlight: true },
          { text: 'Send invitations with one click', highlight: true },
          { text: 'AI chatbot answers guest FAQs automatically', highlight: true },
          { text: 'AI wedding planning assistant', highlight: true },
          { text: 'White-label branding', highlight: true },
          { text: 'Priority support', highlight: true },
        ],
        cta: 'Go Agency',
      },
    },
  },
  es: {
    invitation: {
      basic: {
        name: 'Básica',
        tagline: 'Una invitación hermosa, lista para enviar',
        description: 'Una plantilla lista para usar — sin decisiones de diseño.',
        features: [
          { text: 'Secciones de Portada, Nuestra Historia y Detalles' },
          { text: 'RSVP*' },
          { text: 'Sobre básico de invitación' },
          { text: 'Variantes limitadas de colores y tipografías' },
        ],
        cta: 'Empezar',
      },
      personalized: {
        name: 'Personalizada',
        tagline: 'Tu historia, tus secciones, tu estilo',
        description: 'Elige tu plantilla, colores y qué secciones cuentan tu historia.',
        features: [
          { text: 'Secciones de Portada, Nuestra Historia y Detalles' },
          { text: 'RSVP*' },
          { text: 'Secciones de Código de Vestimenta y Sugerencias de Hotel', highlight: true },
          { text: 'Sección de Mesa de Regalos', highlight: true },
          { text: 'Sobre personalizado', highlight: true },
          { text: 'Variantes ilimitadas de colores y tipografías', highlight: true },
          { text: 'Saludos personalizados por invitado', highlight: true },
          { text: 'Subdominio limpio, sin marca', highlight: true },
          { text: 'Fotos ilimitadas', highlight: true },
        ],
        cta: 'Mejorar a Personalizada',
      },
      bespoke: {
        name: 'A la Medida',
        tagline: 'Diseñada a mano por nuestro equipo',
        description: 'Diseñamos tu invitación desde cero, en tu propio dominio personalizado.',
        features: [
          { text: 'Todas las secciones de Personalizada' },
          { text: 'RSVP*' },
          { text: 'Sección Nuestra Gente', highlight: true },
          { text: 'Música y listas de reproducción', highlight: true },
          { text: 'Sobre único y exclusivo', highlight: true },
          { text: 'Diseño de página único', highlight: true },
          { text: 'Tipografías especiales y personalizadas', highlight: true },
          { text: 'Diseñada por nuestro equipo, de principio a fin', highlight: true },
          { text: 'Tu propio dominio personalizado', highlight: true },
        ],
        cta: 'Ir a A la Medida',
      },
    },
    management: {
      basic: {
        name: 'Básico',
        tagline: 'Invitados y confirmaciones, organizados',
        description: 'Lista de invitados y seguimiento de confirmaciones — lo esencial.',
        features: [
          { text: 'Lista de invitados y confirmaciones' },
          { text: 'Hasta 100 invitados' },
          { text: 'Últimas 3 actividades' },
        ],
        cta: 'Empezar',
      },
      pro: {
        name: 'Pro',
        tagline: 'El kit de planeación completo',
        description: 'Plantillas de mensajes, reportes de actividad, mesa de asientos y mesa de regalos.',
        features: [
          { text: 'Lista de invitados y confirmaciones' },
          { text: 'Invitados y grupos ilimitados', highlight: true },
          { text: 'Plantillas de mensajes', highlight: true },
          { text: 'Reportes de actividad', highlight: true },
          { text: 'Diseñador de mesa de asientos', highlight: true },
          { text: 'Mesa de regalos con pagos seguros', highlight: true },
          { text: 'Acceso para colaboradores', highlight: true },
        ],
        cta: 'Mejorar a Pro',
      },
      agency: {
        name: 'Agencia',
        tagline: 'Hecho para organizadores de bodas',
        description: 'Gestiona cada boda desde un panel — envía invitaciones con un clic y deja que la IA responda las dudas de tus invitados.',
        features: [
          { text: 'Lista de invitados y confirmaciones' },
          { text: 'Invitados y grupos ilimitados' },
          { text: 'Plantillas de mensajes' },
          { text: 'Reportes de actividad' },
          { text: 'Diseñador de mesa de asientos' },
          { text: 'Mesa de regalos con pagos seguros' },
          { text: 'Acceso para colaboradores' },
          { text: 'Panel para múltiples bodas', highlight: true },
          { text: 'Envío de invitaciones con un clic', highlight: true },
          { text: 'Chatbot de IA responde preguntas frecuentes de invitados', highlight: true },
          { text: 'Asistente de IA para planeación de bodas', highlight: true },
          { text: 'Marca blanca', highlight: true },
          { text: 'Soporte prioritario', highlight: true },
        ],
        cta: 'Ir a Agencia',
      },
    },
  },
}
