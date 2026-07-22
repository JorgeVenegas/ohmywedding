import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveWeddingId(adminClient: ReturnType<typeof createAdminSupabaseClient>, raw: string) {
  const isUUID = UUID_REGEX.test(raw)
  const { data } = await adminClient
    .from('weddings')
    .select('id, owner_id, collaborator_emails')
    .eq(isUUID ? 'id' : 'wedding_name_id', raw)
    .single()
  return data
}

// GET /api/weddings/[weddingId]/meetings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> },
) {
  try {
    const { weddingId } = await params
    const decoded = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const wedding = await resolveWeddingId(adminClient, decoded)
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() ?? '') ?? false

    const { data: reviewRow } = await adminClient
      .from('design_review_requests')
      .select('id')
      .eq('wedding_id', wedding.id)
      .eq('reviewer_email', user.email?.toLowerCase() ?? '')
      .neq('status', 'dismissed')
      .maybeSingle()

    if (!isSuperuser && !isOwner && !isCollaborator && !reviewRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await adminClient
      .from('design_meetings')
      .select('id, meeting_type, title, scheduled_at, meeting_url, notes, status, created_at')
      .eq('wedding_id', wedding.id)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ meetings: data ?? [] })
  } catch (err) {
    console.error('[meetings GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const MEETING_TYPES = ['kickoff', 'review', 'final', 'other'] as const
const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'] as const

// POST /api/weddings/[weddingId]/meetings — superadmin only
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
    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    if (!isSuperuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      meeting_type?: string
      title: string
      scheduled_at?: string | null
      meeting_url?: string | null
      notes?: string | null
      status?: string
    }

    if (!body.title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
    if (body.meeting_type && !MEETING_TYPES.includes(body.meeting_type as (typeof MEETING_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid meeting_type' }, { status: 400 })
    }

    const wedding = await resolveWeddingId(adminClient, decoded)
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const { data, error } = await adminClient
      .from('design_meetings')
      .insert({
        wedding_id: wedding.id,
        meeting_type: body.meeting_type ?? 'other',
        title: body.title.trim(),
        scheduled_at: body.scheduled_at ?? null,
        meeting_url: body.meeting_url ?? null,
        notes: body.notes ?? null,
        status: (body.status as (typeof MEETING_STATUSES)[number]) ?? 'scheduled',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, meeting: data })
  } catch (err) {
    console.error('[meetings POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
