import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/invitation-activity-log'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; meetingId: string }> },
) {
  try {
    const { weddingId, meetingId } = await params
    const decoded = decodeURIComponent(weddingId)

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()

    // Resolve wedding
    const isUUID = UUID_REGEX.test(decoded)
    const { data: wedding } = await adminClient
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq(isUUID ? 'id' : 'wedding_name_id', decoded)
      .single()

    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() ?? '') ?? false

    // Check superadmin separately so we can skip the owner/collaborator check
    const { data: superuserRow } = await adminClient
      .from('superusers')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const isSuperuser = !!superuserRow

    if (!isSuperuser && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch meeting
    const { data: meeting } = await adminClient
      .from('design_meetings')
      .select('id, calcom_uid, title, wedding_id')
      .eq('id', meetingId)
      .eq('wedding_id', wedding.id)
      .single()

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    if (!meeting.calcom_uid) return NextResponse.json({ error: 'Meeting has no Cal.com booking to cancel' }, { status: 400 })

    // Cancel on Cal.com
    const apiKey = process.env.CALCOM_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 })

    const body = await req.json().catch(() => ({})) as { reason?: string }
    const cancellationReason = body.reason?.trim() || undefined

    const calRes = await fetch(`https://api.cal.com/v2/bookings/${meeting.calcom_uid}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancellationReason }),
    })

    if (!calRes.ok) {
      const calErr = await calRes.json().catch(() => ({}))
      console.error('[cancel meeting] Cal.com error:', calErr)
      // Still mark as cancelled in DB if Cal.com says already cancelled
      const alreadyCancelled = calRes.status === 400 && JSON.stringify(calErr).toLowerCase().includes('already')
      if (!alreadyCancelled) {
        return NextResponse.json({ error: 'Failed to cancel on Cal.com', details: calErr }, { status: 502 })
      }
    }

    // Update DB
    await adminClient
      .from('design_meetings')
      .update({ status: 'cancelled' })
      .eq('id', meetingId)

    await logActivity({
      weddingId: wedding.id,
      eventType: 'meeting_cancelled',
      title: `${meeting.title} cancelled`,
      metadata: { meeting_id: meetingId, cancelled_by: user.email, reason: cancellationReason ?? null },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cancel meeting]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
