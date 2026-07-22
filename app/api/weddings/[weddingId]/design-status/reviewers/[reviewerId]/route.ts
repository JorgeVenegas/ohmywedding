import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// DELETE /api/weddings/[weddingId]/design-status/reviewers/[reviewerId]
// Superadmin removes a reviewer assignment.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; reviewerId: string }> },
) {
  try {
    const { reviewerId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    if (!isSuperuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminClient
      .from('design_review_requests')
      .delete()
      .eq('id', reviewerId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reviewers DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
