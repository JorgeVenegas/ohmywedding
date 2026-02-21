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

// POST /api/superadmin/coupons/[couponId]/codes - Add a new promotion code to an existing coupon
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { user, error: authError } = await verifySuperadmin(supabase)
    if (authError || !user) return authError!

    const { couponId } = await params
    const { code, maxRedemptions, expiresAt } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim().replace(/\s+/g, '')
    if (!/^[A-Z0-9]{3,30}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Code must be 3-30 alphanumeric characters' }, { status: 400 })
    }

    // Get the coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // Check code uniqueness
    const { data: existingCode } = await supabase
      .from('coupon_promotion_codes')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (existingCode) {
      return NextResponse.json({ error: 'This code is already in use' }, { status: 409 })
    }

    const stripe = getStripe()

    const stripePromo = await stripe.promotionCodes.create({
      promotion: { coupon: coupon.stripe_coupon_id, type: 'coupon' },
      code: normalizedCode,
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(expiresAt ? { expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) } : {}),
    })

    const { error: insertError } = await supabase
      .from('coupon_promotion_codes')
      .insert({
        coupon_id: couponId,
        stripe_promotion_code_id: stripePromo.id,
        code: normalizedCode,
        is_active: true,
        max_redemptions: maxRedemptions || null,
        expires_at: expiresAt || null,
      })

    if (insertError) {
      console.error('Error inserting promo code:', insertError)
      return NextResponse.json({ error: 'Failed to save promotion code' }, { status: 500 })
    }

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('superuser_activity_logs').insert({
      superuser_id: user.id,
      action_type: 'promotion_code_created',
      target_type: 'promotion_code',
      target_id: couponId,
      target_name: `${normalizedCode} (${coupon.name})`,
      new_value: { code: normalizedCode, maxRedemptions, expiresAt },
      reason: `Added promotion code "${normalizedCode}" to coupon "${coupon.name}"`,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in POST codes:', err)
    if (err?.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
