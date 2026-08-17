import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { sendEmail, TEAM_EMAIL } from '@/lib/email'
import {
  weddingMeetingTeamEmail,
  demoBookedTeamEmail,
} from '@/lib/email-booking-templates'
import { logActivity } from '@/lib/invitation-activity-log'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Slugs that belong to the invitation design flow (not landing-page demos)
const WEDDING_MEETING_SLUGS = new Set([
  'discovery-meeting', 'discovery-meeting-es',
  'design-review',     'design-review-es',
  'delivery-meeting',  'delivery-meeting-es',
])

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const computed = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  } catch {
    return false
  }
}

function extractMeetUrl(payload: Record<string, unknown>): string | null {
  const videoCallData = payload.videoCallData as Record<string, unknown> | undefined
  if (videoCallData?.url) return videoCallData.url as string
  const metadata = payload.metadata as Record<string, unknown> | undefined
  if (metadata?.videoCallUrl) return metadata.videoCallUrl as string
  const conferenceData = payload.conferenceData as Record<string, unknown> | undefined
  const entryPoints = conferenceData?.entryPoints as Array<{ entryPointType: string; uri: string }> | undefined
  return entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ?? null
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

function getEventSlug(payload: Record<string, unknown>): string | null {
  const eventType = payload.eventType as Record<string, unknown> | undefined
  return (eventType?.slug ?? payload.eventTypeSlug) as string | null
}

function getAttendee(payload: Record<string, unknown>): { name: string; email: string } {
  const attendees = payload.attendees as Array<{ name: string; email: string }> | undefined
  const first = attendees?.[0]
  return { name: first?.name ?? 'Guest', email: first?.email ?? '' }
}

function getBookingNotes(payload: Record<string, unknown>): string | null {
  const responses = payload.responses as Record<string, unknown> | undefined
  const notes = responses?.notes as { value?: string } | string | undefined
  if (typeof notes === 'string') return notes || null
  return (notes?.value) || null
}

type TriggerEvent = 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED'

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get('X-Cal-Signature-256') ?? ''
    if (!verifySignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { triggerEvent, payload } = body as {
    triggerEvent: string
    payload: Record<string, unknown>
  }

  if (!['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'].includes(triggerEvent)) {
    return NextResponse.json({ received: true })
  }

  const trigger = triggerEvent as TriggerEvent
  const metadata = (payload?.metadata ?? {}) as Record<string, unknown>
  const weddingId = metadata.weddingId as string | undefined
  const eventSlug = getEventSlug(payload)

  const isWeddingMeeting = weddingId || (eventSlug && WEDDING_MEETING_SLUGS.has(eventSlug))

  if (isWeddingMeeting) {
    return handleWeddingMeeting(trigger, payload, weddingId, eventSlug)
  } else {
    return handleDemoBooking(trigger, payload, eventSlug)
  }
}

// ─── Wedding design meetings ──────────────────────────────────────────────────

async function handleWeddingMeeting(
  trigger: TriggerEvent,
  payload: Record<string, unknown>,
  weddingId: string | undefined,
  eventSlug: string | null,
) {
  if (!weddingId) {
    console.warn('[calcom webhook] Wedding meeting without weddingId — skipping')
    return NextResponse.json({ received: true })
  }

  const adminClient = createAdminSupabaseClient()
  const { data: wedding, error: weddingErr } = await adminClient
    .from('weddings')
    .select('id, invitation_design_status, partner1_first_name, partner2_first_name')
    .eq(UUID_REGEX.test(weddingId) ? 'id' : 'wedding_name_id', weddingId)
    .single()

  if (weddingErr) console.error('[calcom webhook] Wedding query error:', weddingErr)

  if (!wedding) {
    console.warn('[calcom webhook] Wedding not found:', weddingId)
    return NextResponse.json({ received: true })
  }

  const uid = payload.uid as string | undefined
  const startTime = payload.startTime as string | undefined
  const meetUrl = extractMeetUrl(payload)
  const attendee = getAttendee(payload)

  const coupleNames = [wedding.partner1_first_name, wedding.partner2_first_name]
    .filter(Boolean).join(' & ')

  const meetingLabel =
    wedding.invitation_design_status === 'review_meeting'   ? 'Revisión de Diseño'
    : wedding.invitation_design_status === 'delivery_meeting' ? 'Entrega de Invitaciones'
    : 'Reunión de Descubrimiento'

  const meetingTitle = coupleNames ? `${meetingLabel} · ${coupleNames}` : meetingLabel

  const meetingType: string =
    wedding.invitation_design_status === 'review_meeting'   ? 'review'
    : wedding.invitation_design_status === 'delivery_meeting' ? 'final'
    : 'kickoff'

  // ── Update DB ──
  if (trigger === 'BOOKING_CANCELLED') {
    if (uid) {
      await adminClient
        .from('design_meetings')
        .update({ status: 'cancelled' })
        .eq('wedding_id', wedding.id)
        .eq('calcom_uid', uid)
      await logActivity({
        weddingId: wedding.id,
        eventType: 'meeting_cancelled',
        title: `${meetingTitle} cancelled`,
        metadata: { calcom_uid: uid, attendee_email: getAttendee(payload).email },
      })
    }
  } else if (trigger === 'BOOKING_RESCHEDULED' && uid) {
    await adminClient
      .from('design_meetings')
      .update({ title: meetingTitle, scheduled_at: startTime ?? null, meeting_url: meetUrl, status: 'scheduled' })
      .eq('wedding_id', wedding.id)
      .eq('calcom_uid', uid)
    await logActivity({
      weddingId: wedding.id,
      eventType: 'meeting_rescheduled',
      title: `${meetingTitle} rescheduled`,
      description: startTime ? `New time: ${formatDate(startTime)}` : undefined,
      metadata: { calcom_uid: uid, attendee_email: getAttendee(payload).email },
    })
  } else {
    const { error: insertErr } = await adminClient.from('design_meetings').insert({
      wedding_id: wedding.id,
      meeting_type: meetingType,
      title: meetingTitle,
      scheduled_at: startTime ?? null,
      meeting_url: meetUrl,
      calcom_uid: uid ?? null,
      calcom_event_type_slug: eventSlug ?? null,
      status: 'scheduled',
    })
    if (insertErr) console.error('[calcom webhook] design_meetings insert error:', insertErr)
    else {
      await logActivity({
        weddingId: wedding.id,
        eventType: 'meeting_scheduled',
        title: `${meetingTitle} scheduled`,
        description: startTime ? formatDate(startTime) : undefined,
        metadata: { calcom_uid: uid, attendee_email: getAttendee(payload).email },
      })
    }
  }

  // ── Send emails ──
  const formattedDate = formatDate(startTime)

  const subjectSuffix =
    trigger === 'BOOKING_CANCELLED' ? '— cancelada'
    : trigger === 'BOOKING_RESCHEDULED' ? '— reagendada'
    : '— confirmada'

  // Cal.com already sends booking confirmation to the couple — only notify the team
  await sendEmail({
    to: TEAM_EMAIL,
    subject: `${meetingTitle} ${subjectSuffix}`,
    html: weddingMeetingTeamEmail({
      meetingTitle,
      coupleNames: coupleNames || attendee.name,
      weddingId,
      scheduledAt: formattedDate,
      meetUrl,
      attendeeEmail: attendee.email,
      eventTypeSlug: eventSlug ?? '',
      bookingUid: uid ?? '—',
      triggerEvent: trigger,
    }),
  })

  return NextResponse.json({ received: true })
}

// ─── Demo / consultation bookings ─────────────────────────────────────────────

async function handleDemoBooking(
  trigger: TriggerEvent,
  payload: Record<string, unknown>,
  eventSlug: string | null,
) {
  const uid = payload.uid as string | undefined
  const startTime = payload.startTime as string | undefined
  const meetUrl = extractMeetUrl(payload)
  const attendee = getAttendee(payload)
  const notes = getBookingNotes(payload)

  const eventType = payload.eventType as Record<string, unknown> | undefined
  const meetingTitle = (eventType?.title ?? payload.title ?? 'Demo Call') as string

  const locale: 'en' | 'es' = eventSlug?.endsWith('-es') ? 'es' : 'en'
  const formattedDate = formatDate(startTime)

  // ── Persist to DB ──
  const adminClient = createAdminSupabaseClient()
  if (uid) {
    if (trigger === 'BOOKING_CANCELLED') {
      await adminClient
        .from('demo_bookings')
        .update({ status: 'cancelled' })
        .eq('calcom_uid', uid)
    } else if (trigger === 'BOOKING_RESCHEDULED') {
      await adminClient
        .from('demo_bookings')
        .update({ scheduled_at: startTime ?? null, meeting_url: meetUrl, status: 'scheduled' })
        .eq('calcom_uid', uid)
    } else {
      await adminClient.from('demo_bookings').insert({
        calcom_uid: uid,
        calcom_event_type_slug: eventSlug,
        title: meetingTitle,
        attendee_name: attendee.name || null,
        attendee_email: attendee.email || null,
        notes: notes || null,
        scheduled_at: startTime ?? null,
        meeting_url: meetUrl,
        status: 'scheduled',
      })
    }
  }

  // ── Notify team ──
  const subjectSuffix =
    trigger === 'BOOKING_CANCELLED' ? '— cancelled'
    : trigger === 'BOOKING_RESCHEDULED' ? '— rescheduled'
    : '— new booking'

  await sendEmail({
    to: TEAM_EMAIL,
    subject: `${meetingTitle} ${subjectSuffix} · ${attendee.name}`,
    html: demoBookedTeamEmail({
      meetingTitle,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      scheduledAt: formattedDate,
      meetUrl,
      eventTypeSlug: eventSlug ?? '',
      bookingUid: uid ?? '—',
      notes,
      triggerEvent: trigger,
    }),
  })

  return NextResponse.json({ received: true })
}
