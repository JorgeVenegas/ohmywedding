import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/superadmin/coupons/[couponId]/redemptions - Get all redemptions for a coupon
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: superuser } = await supabase
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!superuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { couponId } = await params

    const { data: redemptions, error } = await supabase
      .from('coupon_redemptions')
      .select(`
        *,
        coupon_promotion_codes:promotion_code_id(code),
        weddings:wedding_id(id, partner1_first_name, partner2_first_name, wedding_name_id),
        subscription_orders:subscription_order_id(id, amount_cents, status, stripe_payment_intent_id, stripe_checkout_session_id)
      `)
      .eq('coupon_id', couponId)
      .order('redeemed_at', { ascending: false })

    if (error) {
      console.error('Error fetching redemptions:', error)
      return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 })
    }

    return NextResponse.json({ redemptions: redemptions || [] })
  } catch (err) {
    console.error('Error in GET redemptions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
