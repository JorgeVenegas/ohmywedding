/**
 * Upsert all OhMyWedding Cal.com event types.
 * Run with: npx tsx scripts/setup-calcom.ts
 *
 * Creates each event type if it doesn't exist yet; updates it if it does.
 * Safe to re-run any time you change titles, descriptions, durations, or fields.
 *
 * Requires:
 *   CALCOM_API_KEY  — Cal.com Settings → Developer → API Keys
 *   CALCOM_USERNAME — your Cal.com username (used in the booking URL printout)
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const API_BASE = 'https://api.cal.com/v2'
const API_KEY  = process.env.CALCOM_API_KEY
const USERNAME = process.env.CALCOM_USERNAME

if (!API_KEY) {
  console.error('Missing CALCOM_API_KEY — add it to .env.local and retry.')
  process.exit(1)
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const HEADERS = {
  Authorization:     `Bearer ${API_KEY}`,
  'Content-Type':    'application/json',
  'cal-api-version': '2024-06-14',
}

type EventTypeData = { id: number; slug: string; title: string }

async function apiCall(method: string, path: string, body?: object): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: HEADERS,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json() as { status: string; data?: unknown; error?: string }
  if (!res.ok || json.status !== 'success') {
    throw new Error(`Cal.com API error (${res.status}): ${JSON.stringify(json)}`)
  }
  return json.data
}

async function listEventTypes(): Promise<EventTypeData[]> {
  const data = await apiCall('GET', '/event-types?take=100')
  if (Array.isArray(data)) return data as EventTypeData[]
  const nested = (data as { eventTypes?: EventTypeData[] })?.eventTypes
  return Array.isArray(nested) ? nested : []
}

async function createEventType(body: object): Promise<EventTypeData> {
  return apiCall('POST', '/event-types', body) as Promise<EventTypeData>
}

async function deleteEventType(id: number): Promise<void> {
  await apiCall('DELETE', `/event-types/${id}`)
}

// ─── Booking form fields ──────────────────────────────────────────────────────

const CLIENT_FIELDS = [
  { name: 'name',  type: 'name',     required: true,  label: 'Your Name' },
  { name: 'email', type: 'email',    required: true,  label: 'Email Address' },
  { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: "Anything you'd like us to know beforehand?" },
]

const CLIENT_FIELDS_ES = [
  { name: 'name',  type: 'name',     required: true,  label: 'Tu Nombre' },
  { name: 'email', type: 'email',    required: true,  label: 'Correo Electrónico' },
  { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: '¿Algo que quieras que sepamos de antemano?' },
]

// ─── Event type definitions ───────────────────────────────────────────────────

const GOOGLE_MEET = [{ type: 'integration', integration: 'google-meet' }]

const EVENT_TYPES = [
  // ── English ──────────────────────────────────────────────────────────────
  {
    title:           'Discovery Meeting',
    slug:            'discovery-meeting',
    description:     'An introductory meeting to define the moodboard, brief, and vision for your invitation.',
    lengthInMinutes: 45,
    locations:       GOOGLE_MEET,
    bookingFields:   CLIENT_FIELDS,
  },
  {
    title:           'Design Review',
    slug:            'design-review',
    description:     'A walkthrough of your invitation design so you can share feedback directly.',
    lengthInMinutes: 30,
    locations:       GOOGLE_MEET,
    bookingFields:   CLIENT_FIELDS,
  },
  {
    title:           'Delivery Meeting',
    slug:            'delivery-meeting',
    description:     'The grand reveal — we present your final invitation and hand it over.',
    lengthInMinutes: 45,
    locations:       GOOGLE_MEET,
    bookingFields:   CLIENT_FIELDS,
  },
  {
    title:           'Couples Intro Call',
    slug:            'couples-intro',
    description:     'A free 30-minute intro call for couples. We walk you through the invitation design process, RSVP system, your wedding website features, and answer any questions — no commitment needed.',
    lengthInMinutes: 30,
    locations:       GOOGLE_MEET,
    bookingFields:   [
      { name: 'name',  type: 'name',     required: true,  label: 'Your Names' },
      { name: 'email', type: 'email',    required: true,  label: 'Email Address' },
      { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: 'Tell us about your wedding — date, guest count, style in mind?' },
    ],
  },
  {
    title:           'Planners Demo',
    slug:            'planners-demo',
    description:     'A 45-minute live demo tailored to wedding planners. Covers the planner dashboard, client invitation workflow, RSVP tracking, guest management, and white-label options.',
    lengthInMinutes: 45,
    locations:       GOOGLE_MEET,
    bookingFields:   [
      { name: 'name',  type: 'name',     required: true,  label: 'Your Name' },
      { name: 'email', type: 'email',    required: true,  label: 'Work Email' },
      { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: 'How many weddings do you manage per year? Any specific features you want to see?' },
    ],
  },
  {
    title:           'Product Demo',
    slug:            'demo',
    description:     'A 30-minute walkthrough of OhMyWedding — see how we craft your invitation and what the platform looks like for your guests.',
    lengthInMinutes: 30,
    locations:       GOOGLE_MEET,
    bookingFields:   [
      { name: 'name',  type: 'name',     required: true,  label: 'Your Name' },
      { name: 'email', type: 'email',    required: true,  label: 'Email Address' },
      { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: 'Tell us a bit about your wedding plans' },
    ],
  },

  // ── Español ───────────────────────────────────────────────────────────────
  {
    title:           'Reunión de Descubrimiento',
    slug:            'discovery-meeting-es',
    description:     'Una reunión introductoria para definir el moodboard, el brief y la visión de tu invitación.',
    lengthInMinutes: 45,
    locations:       GOOGLE_MEET,
    bookingFields:   CLIENT_FIELDS_ES,
  },
  {
    title:           'Revisión de Diseño',
    slug:            'design-review-es',
    description:     'Un recorrido por el diseño de tu invitación para que puedas compartir tu feedback directamente.',
    lengthInMinutes: 30,
    locations:       GOOGLE_MEET,
    bookingFields:   CLIENT_FIELDS_ES,
  },
  {
    title:           'Entrega de Invitaciones',
    slug:            'delivery-meeting-es',
    description:     'El gran momento — te presentamos tu invitación final y te la entregamos.',
    lengthInMinutes: 45,
    locations:       GOOGLE_MEET,
    bookingFields:   CLIENT_FIELDS_ES,
  },
  {
    title:           'Llamada Introductoria para Parejas',
    slug:            'couples-intro-es',
    description:     'Una llamada gratuita de 30 minutos para parejas. Te guiamos a través del proceso de diseño de invitaciones, el sistema de RSVP, tu sitio web de boda y respondemos todas tus preguntas — sin compromiso.',
    lengthInMinutes: 30,
    locations:       GOOGLE_MEET,
    bookingFields:   [
      { name: 'name',  type: 'name',     required: true,  label: 'Sus Nombres' },
      { name: 'email', type: 'email',    required: true,  label: 'Correo Electrónico' },
      { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: '¿Cuéntanos sobre su boda — fecha, número de invitados, estilo?' },
    ],
  },
  {
    title:           'Demo para Planificadores',
    slug:            'planners-demo-es',
    description:     'Una demo en vivo de 45 minutos para planificadores de bodas. Cubre el panel de control, el flujo de invitaciones, seguimiento de RSVP, gestión de invitados y opciones de marca blanca.',
    lengthInMinutes: 45,
    locations:       GOOGLE_MEET,
    bookingFields:   [
      { name: 'name',  type: 'name',     required: true,  label: 'Tu Nombre' },
      { name: 'email', type: 'email',    required: true,  label: 'Correo de Trabajo' },
      { name: 'notes', slug: 'notes', type: 'textarea', required: false, label: '¿Cuántas bodas manejas por año? ¿Alguna función específica que quieras ver?' },
    ],
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching existing Cal.com event types…\n')

  let existing: EventTypeData[] = []
  try {
    existing = await listEventTypes()
  } catch (err) {
    console.error('Could not list event types:', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const targetSlugs = new Set(EVENT_TYPES.map(e => e.slug))
  const toDelete = existing.filter(e => targetSlugs.has(e.slug))

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} existing event type(s)…`)
    for (const e of toDelete) {
      await deleteEventType(e.id)
      console.log(`  ✗  Deleted  "${e.title}"  (id: ${e.id})`)
    }
    console.log()
  }

  for (const evt of EVENT_TYPES) {
    const { slug, ...payload } = evt
    try {
      const data = await createEventType({ slug, ...payload })
      const url = USERNAME ? `cal.com/${USERNAME}/${slug}` : `id: ${(data as EventTypeData).id}`
      console.log(`✓  Created  "${evt.title}"  →  ${url}`)
    } catch (err) {
      console.error(`✗  Failed   "${evt.title}"  →  ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('\n─────────────────────────────────────────────')
  console.log('Add / verify these in your .env.local:\n')
  console.log(`  CALCOM_API_KEY=<your-key>`)
  console.log(`  CALCOM_USERNAME=${USERNAME ?? '<your-calcom-username>'}`)
  console.log(`  CALCOM_DISCOVERY_EVENT_SLUG=discovery-meeting`)
  console.log(`  CALCOM_REVIEW_EVENT_SLUG=design-review`)
  console.log(`  CALCOM_DELIVERY_EVENT_SLUG=delivery-meeting`)
  console.log(`  CALCOM_DEMO_EVENT_SLUG=demo`)
  console.log(`\n  # Public vars for the landing page demo embed:`)
  console.log(`  NEXT_PUBLIC_CALCOM_USERNAME=${USERNAME ?? '<your-calcom-username>'}`)
  console.log(`  NEXT_PUBLIC_CALCOM_DEMO_EVENT_SLUG=demo`)
  console.log(`  NEXT_PUBLIC_CALCOM_COUPLES_SLUG=couples-intro`)
  console.log(`  NEXT_PUBLIC_CALCOM_PLANNERS_SLUG=planners-demo`)
}

main()
