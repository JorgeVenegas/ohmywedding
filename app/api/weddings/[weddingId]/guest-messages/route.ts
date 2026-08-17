import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { weddingId } = await params
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const query = adminClient.from('weddings').select('id, owner_id, collaborator_emails')
    const { data: wedding, error: fetchError } = isUUID
      ? await query.eq('id', weddingId).single()
      : await query.eq('wedding_name_id', weddingId).single()

    if (fetchError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = Array.isArray(wedding.collaborator_emails) &&
      wedding.collaborator_emails.includes(user.email)

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: groups, error: groupsError } = await adminClient
      .from('guest_groups')
      .select('id, name, message, rsvp_submitted_at')
      .eq('wedding_id', wedding.id)
      .not('message', 'is', null)
      .neq('message', '')
      .order('rsvp_submitted_at', { ascending: false })

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 400 })
    }

    return NextResponse.json({ messages: groups || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
