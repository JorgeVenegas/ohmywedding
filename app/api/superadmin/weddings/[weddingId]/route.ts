import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
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
    if (!(await isSuperUser(adminClient, { email: user.email }))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isUUID = UUID_REGEX.test(decoded)
    const { data: wedding, error: findErr } = await adminClient
      .from('weddings')
      .select('id, wedding_name_id, partner1_first_name, partner2_first_name')
      .eq(isUUID ? 'id' : 'wedding_name_id', decoded)
      .single()

    if (findErr || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const { error: deleteErr } = await adminClient
      .from('weddings')
      .delete()
      .eq('id', wedding.id)

    if (deleteErr) {
      console.error('[wedding DELETE] delete error:', deleteErr)
      return NextResponse.json({ error: deleteErr.message, code: deleteErr.code }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: {
        id: wedding.id,
        wedding_name_id: wedding.wedding_name_id,
      },
    })
  } catch (err) {
    console.error('[wedding DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
