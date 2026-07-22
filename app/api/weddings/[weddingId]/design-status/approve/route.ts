import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { canTransition, type DesignStatus } from '@/lib/invitation-workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/weddings/[weddingId]/design-status/approve
// Allows a designated reviewer to approve the design (ready_for_review → approved).
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
    const isUUID = UUID_REGEX.test(decoded)

    const { data: wedding, error: weddingErr } = await adminClient
      .from('weddings')
      .select('id, invitation_design_status')
      .eq(isUUID ? 'id' : 'wedding_name_id', decoded)
      .single()

    if (weddingErr || !wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const from = (wedding.invitation_design_status ?? 'not_started') as DesignStatus

    if (!canTransition(from, 'approved', 'reviewer')) {
      return NextResponse.json(
        { error: `Cannot approve from status "${from}"` },
        { status: 422 },
      )
    }

    // Verify the caller is an assigned reviewer with a pending request
    const { data: reviewRow } = await adminClient
      .from('design_review_requests')
      .select('id')
      .eq('wedding_id', wedding.id)
      .eq('reviewer_email', user.email?.toLowerCase() ?? '')
      .eq('status', 'pending')
      .maybeSingle()

    if (!reviewRow) {
      return NextResponse.json({ error: 'Not assigned as a reviewer for this wedding' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({})) as { notes?: string }

    // Update wedding status
    const { error: updateErr } = await adminClient
      .from('weddings')
      .update({ invitation_design_status: 'approved' })
      .eq('id', wedding.id)

    if (updateErr) throw updateErr

    // Mark this reviewer's request as approved
    await adminClient
      .from('design_review_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), notes: body.notes ?? null })
      .eq('id', reviewRow.id)

    // Write history
    await adminClient.from('invitation_status_history').insert({
      wedding_id: wedding.id,
      from_status: from,
      to_status: 'approved',
      changed_by: user.id,
      notes: body.notes ?? null,
    })

    return NextResponse.json({ success: true, status: 'approved' })
  } catch (err) {
    console.error('[design-status approve]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
