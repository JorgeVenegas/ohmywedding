import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/weddings/[weddingId]/versions/[versionId]/restore
// Restores a version snapshot to the active wedding_websites.page_config.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; versionId: string }> },
) {
  try {
    const { versionId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    if (!isSuperuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: version, error: versionErr } = await adminClient
      .from('wedding_versions')
      .select('id, wedding_id, config_snapshot')
      .eq('id', versionId)
      .single()

    if (versionErr || !version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

    // Restore snapshot to wedding_websites
    const { error: restoreErr } = await adminClient
      .from('wedding_websites')
      .update({ page_config: version.config_snapshot })
      .eq('wedding_id', version.wedding_id)

    if (restoreErr) throw restoreErr

    // Mark this version as active, deactivate others
    await adminClient
      .from('wedding_versions')
      .update({ is_active: false })
      .eq('wedding_id', version.wedding_id)

    await adminClient
      .from('wedding_versions')
      .update({ is_active: true })
      .eq('id', versionId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[versions restore]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
