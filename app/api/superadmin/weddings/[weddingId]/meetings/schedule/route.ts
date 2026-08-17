// POST /api/superadmin/weddings/[weddingId]/meetings/schedule
// Creates a Google Calendar event with a Meet link, saves it to design_meetings,
// and (optionally) advances the wedding's design status — all in one request.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { createMeetEvent, isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { canTransition, type DesignStatus } from '@/lib/invitation-workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveWedding(adminClient: ReturnType<typeof createAdminSupabaseClient>, raw: string) {
  const isUUID = UUID_REGEX.test(raw)
  const { data } = await adminClient
    .from('weddings')
    .select('id, owner_id, invitation_design_status, partner1_first_name, partner2_first_name, wedding_name_id')
    .eq(isUUID ? 'id' : 'wedding_name_id', raw)
    .single()
  return data
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> },
) {
  try {
    const { weddingId } = await params
    const decoded = decodeURIComponent(weddingId)

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    if (!(await isSuperUser(adminClient, { email: user.email }))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json() as {
      title: string
      scheduled_at: string          // ISO datetime string
      duration_minutes: number
      attendee_emails: string[]
      notes?: string
      meeting_type?: string
      transition_to_status?: string // if set, also advances the design status
    }

    if (!body.title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
    if (!body.scheduled_at) return NextResponse.json({ error: 'scheduled_at is required' }, { status: 400 })
    if (!body.duration_minutes || body.duration_minutes < 1) {
      return NextResponse.json({ error: 'duration_minutes must be positive' }, { status: 400 })
    }

    const wedding = await resolveWedding(adminClient, decoded)
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    // Validate status transition before creating the meet (fail fast)
    const toStatus = body.transition_to_status as DesignStatus | undefined
    const fromStatus = (wedding.invitation_design_status ?? 'not_started') as DesignStatus
    if (toStatus && !canTransition(fromStatus, toStatus, 'superadmin')) {
      return NextResponse.json(
        { error: `Transition ${fromStatus} → ${toStatus} is not allowed for superadmin` },
        { status: 422 },
      )
    }

    const startTime = new Date(body.scheduled_at)
    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled_at' }, { status: 400 })
    }

    // ── Create Google Calendar event with Meet link ────────────
    let meetUrl: string | null = null
    let googleEventId: string | null = null

    if (isGoogleCalendarConfigured()) {
      const { meetUrl: url, eventId } = await createMeetEvent({
        summary:         body.title.trim(),
        description:     body.notes?.trim() || undefined,
        startTime,
        durationMinutes: body.duration_minutes,
        attendeeEmails:  body.attendee_emails ?? [],
      })
      meetUrl      = url
      googleEventId = eventId
    }

    // ── Save meeting row ───────────────────────────────────────
    // google_event_id is intentionally omitted here until PostgREST schema
    // cache refreshes (the column was added in migration 20260723000001).
    // The meet_url (which is what users actually need) is stored in meeting_url.
    const meetingType = body.meeting_type ?? 'other'
    const { data: meeting, error: meetingErr } = await adminClient
      .from('design_meetings')
      .insert({
        wedding_id:   wedding.id,
        meeting_type: meetingType,
        title:        body.title.trim(),
        scheduled_at: startTime.toISOString(),
        meeting_url:  meetUrl ?? null,
        notes:        body.notes?.trim() ?? null,
        status:       'scheduled',
        created_by:   user.id,
      })
      .select()
      .single()

    if (meetingErr) throw meetingErr

    // ── Advance status if requested ───────────────────────────
    if (toStatus) {
      const { error: statusErr } = await adminClient.rpc('set_wedding_design_status', {
        p_wedding_id:  wedding.id,
        p_status:      toStatus,
        p_changed_by:  user.id,
        p_notes:       `Meeting scheduled: ${body.title.trim()}`,
      })
      if (statusErr) throw statusErr
    }

    return NextResponse.json({
      success:        true,
      meeting,
      meet_url:       meetUrl,
      google_configured: isGoogleCalendarConfigured(),
    })
  } catch (err) {
    console.error('[meetings/schedule POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
