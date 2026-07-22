import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/weddings/[weddingId]/design-status/reviewers
// Superadmin adds one or more reviewer emails to a wedding.
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

    const body = await req.json() as { emails: string[] }
    const emails = (body.emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean)
    if (emails.length === 0) return NextResponse.json({ error: 'No emails provided' }, { status: 400 })

    const isUUID = UUID_REGEX.test(decoded)
    const { data: wedding } = await adminClient
      .from('weddings')
      .select('id')
      .eq(isUUID ? 'id' : 'wedding_name_id', decoded)
      .single()

    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const rows = emails.map((email) => ({
      wedding_id: wedding.id,
      reviewer_email: email,
      requested_by: user.id,
      status: 'pending',
    }))

    const { data, error } = await adminClient
      .from('design_review_requests')
      .upsert(rows, { onConflict: 'wedding_id,reviewer_email', ignoreDuplicates: false })
      .select()

    if (error) throw error

    // Try to resolve reviewer_user_id
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    for (const email of emails) {
      const match = usersData?.users?.find((u) => u.email?.toLowerCase() === email)
      if (match) {
        await adminClient
          .from('design_review_requests')
          .update({ reviewer_user_id: match.id })
          .eq('wedding_id', wedding.id)
          .eq('reviewer_email', email)
      }
    }

    return NextResponse.json({ success: true, added: data })
  } catch (err) {
    console.error('[reviewers POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
