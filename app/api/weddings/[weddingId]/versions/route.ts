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
    .select('id')
    .eq(isUUID ? 'id' : 'wedding_name_id', raw)
    .single()
  return data?.id ?? null
}

// GET /api/weddings/[weddingId]/versions
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
    const wId = await resolveWeddingId(adminClient, decoded)
    if (!wId) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const { data, error } = await adminClient
      .from('wedding_versions')
      .select('id, version_number, label, is_active, created_at, notes')
      .eq('wedding_id', wId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return NextResponse.json({ versions: data ?? [] })
  } catch (err) {
    console.error('[versions GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/weddings/[weddingId]/versions
// Superadmin-only: snapshot the current wedding_websites.page_config.
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

    const body = await req.json() as { label: string; notes?: string }
    if (!body.label?.trim()) return NextResponse.json({ error: 'label is required' }, { status: 400 })

    const wId = await resolveWeddingId(adminClient, decoded)
    if (!wId) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    // Fetch current config from wedding_websites
    const { data: websiteRow } = await adminClient
      .from('wedding_websites')
      .select('page_config')
      .eq('wedding_id', wId)
      .maybeSingle()

    const snapshot = websiteRow?.page_config ?? {}

    // Determine next version number
    const { data: lastVersion } = await adminClient
      .from('wedding_versions')
      .select('version_number')
      .eq('wedding_id', wId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNumber = (lastVersion?.version_number ?? 0) + 1

    // Mark previous active version as inactive
    await adminClient
      .from('wedding_versions')
      .update({ is_active: false })
      .eq('wedding_id', wId)
      .eq('is_active', true)

    const { data: newVersion, error: insertErr } = await adminClient
      .from('wedding_versions')
      .insert({
        wedding_id: wId,
        version_number: nextNumber,
        label: body.label.trim(),
        config_snapshot: snapshot,
        is_active: true,
        created_by: user.id,
        notes: body.notes ?? null,
      })
      .select()
      .single()

    if (insertErr) throw insertErr
    return NextResponse.json({ success: true, version: newVersion })
  } catch (err) {
    console.error('[versions POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
