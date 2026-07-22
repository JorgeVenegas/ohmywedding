import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

// Tables queried by wedding_id (UUID FK)
const UUID_TABLES = [
  'guests',
  'guest_groups',
  'rsvps',
  'wedding_schedule',
  'wedding_pages',
  'wedding_faqs',
  'gallery_albums',
  'gallery_photos',
  'gift_registries',
  'gift_items',
  'images',
  'suppliers',
  'supplier_payments',
  'conversations',
  'contacts',
  'wedding_subscriptions',
  'subscription_orders',
  'wedding_settings',
  'whatsapp_accounts',
  'invitation_trackings',
] as const

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !SUPERADMIN_EMAILS.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { weddingId } = await params
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
  const { data: wedding } = isUUID
    ? await adminClient.from('weddings').select('id, wedding_name_id, partner1_first_name, partner2_first_name').eq('id', weddingId).single()
    : await adminClient.from('weddings').select('id, wedding_name_id, partner1_first_name, partner2_first_name').eq('wedding_name_id', weddingId).single()

  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
  }

  // Run all count queries in parallel
  const counts = await Promise.allSettled(
    UUID_TABLES.map(async (table) => {
      const { count, error } = await adminClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id)
      return { table, count: error ? null : (count ?? 0) }
    })
  )

  const breakdown = counts
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean) as { table: string; count: number | null }[]

  const totalRows = breakdown.reduce((s, r) => s + (r.count ?? 0), 0)

  return NextResponse.json({
    wedding_id: wedding.id,
    wedding_name_id: wedding.wedding_name_id,
    couple: [wedding.partner1_first_name, wedding.partner2_first_name].filter(Boolean).join(' & ') || wedding.wedding_name_id,
    breakdown: breakdown.filter(r => (r.count ?? 0) > 0).sort((a, b) => (b.count ?? 0) - (a.count ?? 0)),
    total_rows: totalRows,
  })
}
