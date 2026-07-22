import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MEETING_TYPES = ['kickoff', 'review', 'final', 'other'] as const
const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'] as const

// PATCH /api/weddings/[weddingId]/meetings/[meetingId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; meetingId: string }> },
) {
  try {
    const { meetingId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    if (!isSuperuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) updates.title = String(body.title).trim()
    if (body.meeting_type !== undefined) {
      if (!MEETING_TYPES.includes(body.meeting_type as (typeof MEETING_TYPES)[number])) {
        return NextResponse.json({ error: 'Invalid meeting_type' }, { status: 400 })
      }
      updates.meeting_type = body.meeting_type
    }
    if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at ?? null
    if (body.meeting_url !== undefined) updates.meeting_url = body.meeting_url ?? null
    if (body.notes !== undefined) updates.notes = body.notes ?? null
    if (body.status !== undefined) {
      if (!MEETING_STATUSES.includes(body.status as (typeof MEETING_STATUSES)[number])) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('design_meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, meeting: data })
  } catch (err) {
    console.error('[meetings PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/weddings/[weddingId]/meetings/[meetingId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; meetingId: string }> },
) {
  try {
    const { meetingId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    if (!isSuperuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminClient.from('design_meetings').delete().eq('id', meetingId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[meetings DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
