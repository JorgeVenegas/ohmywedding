import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
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

    const query = adminClient.from('weddings').select('id, owner_id, wedding_name_id')
    const { data: wedding, error: fetchError } = isUUID
      ? await query.eq('id', weddingId).single()
      : await query.eq('wedding_name_id', weddingId).single()

    if (fetchError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the wedding owner can delete it' }, { status: 403 })
    }

    // Deleting the weddings row cascades to all child tables via FK ON DELETE CASCADE:
    // guests, guest_groups, rsvps, wedding_schedule, wedding_pages, wedding_faqs,
    // gallery_albums, gallery_photos, gift_registries, gift_items, images,
    // suppliers, supplier_payments, conversations, contacts, messages,
    // wedding_subscriptions, subscription_orders, wedding_settings, wedding_features, etc.
    const { error: deleteError } = await adminClient
      .from('weddings')
      .delete()
      .eq('id', wedding.id)

    if (deleteError) {
      console.error('Wedding deletion failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete wedding' }, { status: 500 })
    }

    return NextResponse.json({ success: true, wedding_name_id: wedding.wedding_name_id })
  } catch (error) {
    console.error('Wedding DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
