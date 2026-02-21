import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

async function verifySuperadmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: superuser } = await supabase
    .from('superusers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!superuser) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

// PATCH /api/superadmin/coupons/[couponId]/codes/[codeId] - Toggle promotion code active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string; codeId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { user, error: authError } = await verifySuperadmin(supabase)
    if (authError || !user) return authError!

    const { couponId, codeId } = await params
    const { isActive } = await request.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
    }

    // Get the promo code
    const { data: promoCode, error: fetchError } = await supabase
      .from('coupon_promotion_codes')
      .select('*, coupons:coupon_id(name)')
      .eq('id', codeId)
      .eq('coupon_id', couponId)
      .single()

    if (fetchError || !promoCode) {
      return NextResponse.json({ error: 'Promotion code not found' }, { status: 404 })
    }

    // Update on Stripe
    const stripe = getStripe()
    await stripe.promotionCodes.update(promoCode.stripe_promotion_code_id, { active: isActive })

    // Update locally
    await supabase
      .from('coupon_promotion_codes')
      .update({ is_active: isActive })
      .eq('id', codeId)

    // Log
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('superuser_activity_logs').insert({
      superuser_id: user.id,
      action_type: 'promotion_code_toggled',
      target_type: 'promotion_code',
      target_id: codeId,
      target_name: promoCode.code,
      old_value: { is_active: !isActive },
      new_value: { is_active: isActive },
      reason: `${isActive ? 'Activated' : 'Deactivated'} code "${promoCode.code}"`,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in PATCH code:', err)
    if (err?.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
