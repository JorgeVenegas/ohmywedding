// Email templates for Cal.com booking notifications

const BRAND = '#420c14'
const GOLD = '#DDA46F'
const CREAM = '#f5f2eb'
const MUTED = '#7a3a42'

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OhMyWedding</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

        <!-- Logo header -->
        <tr>
          <td style="background:${BRAND};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${GOLD};opacity:0.8;">OhMyWedding</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:36px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(66,12,20,0.08);">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:${MUTED};opacity:0.6;">OhMyWedding · ohmy.wedding</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f0e8e2;">
      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${MUTED};opacity:0.7;">${label}</span><br/>
      <span style="font-size:14px;color:${BRAND};font-weight:500;">${value}</span>
    </td>
  </tr>`
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:${BRAND};color:${CREAM};text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;letter-spacing:0.05em;">${label}</a>`
}

// ─── Wedding meeting: notification to the OhMyWedding team ───────────────────

export interface WeddingMeetingBookedData {
  meetingTitle: string
  coupleNames: string
  weddingId: string
  scheduledAt: string
  meetUrl: string | null
  attendeeEmail: string
  eventTypeSlug: string
  bookingUid: string
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED'
}

export function weddingMeetingTeamEmail(data: WeddingMeetingBookedData): string {
  const actionLabel =
    data.triggerEvent === 'BOOKING_RESCHEDULED' ? 'reagendó'
    : data.triggerEvent === 'BOOKING_CANCELLED' ? 'canceló'
    : 'agendó'

  const statusBadgeColor =
    data.triggerEvent === 'BOOKING_CANCELLED' ? '#dc2626'
    : data.triggerEvent === 'BOOKING_RESCHEDULED' ? '#d97706'
    : '#16a34a'

  const statusLabel =
    data.triggerEvent === 'BOOKING_CANCELLED' ? 'CANCELADA'
    : data.triggerEvent === 'BOOKING_RESCHEDULED' ? 'REAGENDADA'
    : 'CONFIRMADA'

  const meetLink = data.meetUrl
    ? ctaButton('Unirse a Google Meet', data.meetUrl)
    : ''

  return base(`
    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTED};opacity:0.7;">Reunión de diseño</p>
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND};font-weight:300;">${data.coupleNames}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${MUTED};">${data.coupleNames} ${actionLabel} una reunión.</p>

    <span style="display:inline-block;padding:4px 12px;border-radius:100px;background:${statusBadgeColor}20;color:${statusBadgeColor};font-size:11px;font-weight:700;letter-spacing:0.1em;margin-bottom:24px;">${statusLabel}</span>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Reunión', data.meetingTitle)}
      ${detailRow('Fecha y hora', data.scheduledAt)}
      ${detailRow('Email del cliente', data.attendeeEmail)}
      ${detailRow('Booking UID', data.bookingUid)}
    </table>

    ${meetLink}
  `)
}

// ─── Wedding meeting: confirmation to the couple ─────────────────────────────

export interface WeddingMeetingCoupleData {
  meetingTitle: string
  coupleNames: string
  scheduledAt: string
  meetUrl: string | null
  locale: 'en' | 'es'
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED'
}

export function weddingMeetingCoupleEmail(data: WeddingMeetingCoupleData): string {
  const isEs = data.locale === 'es'
  const isCancelled = data.triggerEvent === 'BOOKING_CANCELLED'
  const isRescheduled = data.triggerEvent === 'BOOKING_RESCHEDULED'

  const greeting = isEs
    ? `¡Hola, ${data.coupleNames}!`
    : `Hi, ${data.coupleNames}!`

  const bodyText = isEs
    ? isCancelled
      ? 'Tu reunión ha sido cancelada. Si necesitas reagendar, puedes hacerlo desde tu panel.'
      : isRescheduled
      ? 'Tu reunión ha sido reagendada. ¡Te esperamos!'
      : '¡Tu reunión está confirmada! Nos vemos pronto.'
    : isCancelled
    ? 'Your meeting has been cancelled. You can reschedule any time from your dashboard.'
    : isRescheduled
    ? 'Your meeting has been rescheduled. Looking forward to it!'
    : 'Your meeting is confirmed! See you soon.'

  const meetLink = data.meetUrl && !isCancelled
    ? ctaButton(isEs ? 'Unirse a Google Meet' : 'Join Google Meet', data.meetUrl)
    : ''

  return base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND};font-weight:300;">${greeting}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:${MUTED};line-height:1.6;">${bodyText}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${detailRow(isEs ? 'Reunión' : 'Meeting', data.meetingTitle)}
      ${!isCancelled ? detailRow(isEs ? 'Fecha y hora' : 'Date & time', data.scheduledAt) : ''}
    </table>

    ${meetLink}

    <p style="margin:32px 0 0;font-size:13px;color:${MUTED};opacity:0.7;line-height:1.6;">
      ${isEs
        ? 'Si tienes preguntas, responde este correo y te ayudamos con gusto.'
        : 'Have questions? Just reply to this email and we\'ll be happy to help.'}
    </p>
  `)
}

// ─── Demo booking: notification to the OhMyWedding team ─────────────────────

export interface DemoBookedData {
  meetingTitle: string
  attendeeName: string
  attendeeEmail: string
  scheduledAt: string
  meetUrl: string | null
  eventTypeSlug: string
  bookingUid: string
  notes: string | null
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED'
}

export function demoBookedTeamEmail(data: DemoBookedData): string {
  const actionLabel =
    data.triggerEvent === 'BOOKING_RESCHEDULED' ? 'rescheduled'
    : data.triggerEvent === 'BOOKING_CANCELLED' ? 'cancelled'
    : 'booked'

  const statusBadgeColor =
    data.triggerEvent === 'BOOKING_CANCELLED' ? '#dc2626'
    : data.triggerEvent === 'BOOKING_RESCHEDULED' ? '#d97706'
    : '#16a34a'

  const statusLabel = data.triggerEvent === 'BOOKING_CANCELLED' ? 'CANCELLED'
    : data.triggerEvent === 'BOOKING_RESCHEDULED' ? 'RESCHEDULED'
    : 'NEW BOOKING'

  const meetLink = data.meetUrl
    ? ctaButton('Join Google Meet', data.meetUrl)
    : ''

  const notesRow = data.notes
    ? detailRow('Notes', data.notes)
    : ''

  return base(`
    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTED};opacity:0.7;">Demo / Intro call</p>
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND};font-weight:300;">${data.attendeeName}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${MUTED};">A new demo call was ${actionLabel}.</p>

    <span style="display:inline-block;padding:4px 12px;border-radius:100px;background:${statusBadgeColor}20;color:${statusBadgeColor};font-size:11px;font-weight:700;letter-spacing:0.1em;margin-bottom:24px;">${statusLabel}</span>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Meeting type', data.meetingTitle)}
      ${detailRow('Date & time', data.scheduledAt)}
      ${detailRow('Name', data.attendeeName)}
      ${detailRow('Email', data.attendeeEmail)}
      ${notesRow}
      ${detailRow('Booking UID', data.bookingUid)}
    </table>

    ${meetLink}
  `)
}

// ─── Demo booking: confirmation to the booker ────────────────────────────────

export interface DemoConfirmationData {
  meetingTitle: string
  attendeeName: string
  scheduledAt: string
  meetUrl: string | null
  locale: 'en' | 'es'
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED'
}

export function demoConfirmationEmail(data: DemoConfirmationData): string {
  const isEs = data.locale === 'es'
  const isCancelled = data.triggerEvent === 'BOOKING_CANCELLED'
  const isRescheduled = data.triggerEvent === 'BOOKING_RESCHEDULED'

  const greeting = isEs
    ? `¡Hola, ${data.attendeeName}!`
    : `Hi, ${data.attendeeName}!`

  const bodyText = isEs
    ? isCancelled
      ? 'Tu llamada ha sido cancelada. Si quieres reagendar, puedes hacerlo desde nuestro sitio web.'
      : isRescheduled
      ? '¡Tu llamada ha sido reagendada! Te esperamos para contarte todo sobre OhMyWedding.'
      : '¡Tu llamada está confirmada! Estaremos encantados de mostrarte todo lo que OhMyWedding tiene para ti.'
    : isCancelled
    ? 'Your call has been cancelled. You can reschedule any time from our website.'
    : isRescheduled
    ? 'Your call has been rescheduled! Looking forward to showing you everything OhMyWedding can do.'
    : 'Your call is confirmed! We\'re looking forward to showing you everything OhMyWedding can do.'

  const meetLink = data.meetUrl && !isCancelled
    ? ctaButton(isEs ? 'Unirse a Google Meet' : 'Join Google Meet', data.meetUrl)
    : ''

  return base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:${BRAND};font-weight:300;">${greeting}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:${MUTED};line-height:1.6;">${bodyText}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${detailRow(isEs ? 'Llamada' : 'Call', data.meetingTitle)}
      ${!isCancelled ? detailRow(isEs ? 'Fecha y hora' : 'Date & time', data.scheduledAt) : ''}
    </table>

    ${meetLink}

    <p style="margin:32px 0 0;font-size:13px;color:${MUTED};opacity:0.7;line-height:1.6;">
      ${isEs
        ? '¿Tienes preguntas antes de la llamada? Responde este correo y te ayudamos.'
        : 'Questions before the call? Just reply to this email.'}
    </p>
  `)
}
