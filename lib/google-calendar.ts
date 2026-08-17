// Google Calendar API client — service account auth via native Node.js crypto (no extra deps).
// Required env vars:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL — the service account email
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY — PEM private key (use \\n for newlines in .env.local)
//   GOOGLE_CALENDAR_ID — calendar to create events in (default: "primary")
//
// Setup: create a Google Cloud service account → enable Calendar API → download JSON key →
// share your target calendar with the service account email (or use "primary" to use its own).

import { createSign } from 'crypto'

function toBase64Url(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !rawKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be set')
  }

  const privateKey = rawKey.replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)

  const header  = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = toBase64Url(JSON.stringify({
    iss:   email,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }))

  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const signature = toBase64Url(signer.sign(privateKey))

  const jwt = `${header}.${payload}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google OAuth2 token exchange failed: ${body}`)
  }

  const { access_token } = await res.json() as { access_token: string }
  return access_token
}

export interface CalendarEventResult {
  eventId: string
  meetUrl: string | null
  calendarLink: string
}

export async function createMeetEvent(opts: {
  summary: string
  description?: string
  startTime: Date
  durationMinutes: number
  attendeeEmails: string[]
}): Promise<CalendarEventResult> {
  const { summary, description, startTime, durationMinutes, attendeeEmails } = opts

  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000)
  const token = await getAccessToken()
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary')

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startTime.toISOString() },
        end:   { dateTime: endTime.toISOString() },
        attendees: attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId:            `omw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar API error (${res.status}): ${body}`)
  }

  const event = await res.json() as {
    id: string
    htmlLink: string
    conferenceData?: {
      entryPoints?: Array<{ entryPointType: string; uri: string }>
    }
  }

  const meetUrl =
    event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ?? null

  return { eventId: event.id, meetUrl, calendarLink: event.htmlLink }
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
}
