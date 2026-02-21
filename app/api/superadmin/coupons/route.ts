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

// GET /api/superadmin/coupons - List all coupons with codes and redemption stats
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error: authError } = await verifySuperadmin(supabase)
    if (authError) return authError

    const { data: coupons, error } = await supabase
      .from('coupons')
      .select(`
        *,
        coupon_promotion_codes(*),
        coupon_redemptions(id, status, discount_amount_cents, redeemed_at)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    return NextResponse.json({ coupons: coupons || [] })
  } catch (err) {
    console.error('Error in GET /api/superadmin/coupons:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/superadmin/coupons - Create a new coupon + promotion code via Stripe
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { user, error: authError } = await verifySuperadmin(supabase)
    if (authError || !user) return authError!

    const body = await request.json()
    const {
      name,
      discountType,
      discountValue,
      maxRedemptions,
      expiresAt,
      appliesToPlans,
      code, // promotion code string
      codeMaxRedemptions,
    } = body

    // Validate required fields
    if (!name || !discountType || !discountValue || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, discountType, discountValue, code' },
        { status: 400 }
      )
    }

    if (!['percent', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'discountType must be "percent" or "fixed"' }, { status: 400 })
    }

    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage discount must be between 1 and 100' }, { status: 400 })
    }

    if (discountType === 'fixed' && discountValue < 100) {
      return NextResponse.json({ error: 'Fixed discount must be at least 100 centavos ($1 MXN)' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim().replace(/\s+/g, '')
    if (!/^[A-Z0-9]{3,30}$/.test(normalizedCode)) {
      return NextResponse.json(
        { error: 'Code must be 3-30 alphanumeric characters' },
        { status: 400 }
      )
    }

    // Check code uniqueness locally
    const { data: existingCode } = await supabase
      .from('coupon_promotion_codes')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (existingCode) {
      return NextResponse.json({ error: 'A promotion code with this code already exists' }, { status: 409 })
    }

    const stripe = getStripe()

    // 1. Create Stripe Coupon
    const stripeCouponParams: Stripe.CouponCreateParams = {
      name,
      ...(discountType === 'percent'
        ? { percent_off: discountValue }
        : { amount_off: discountValue, currency: 'mxn' }),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(expiresAt ? { redeem_by: Math.floor(new Date(expiresAt).getTime() / 1000) } : {}),
    }

    const stripeCoupon = await stripe.coupons.create(stripeCouponParams)

    // 2. Insert coupon into local DB
    const plans = appliesToPlans && appliesToPlans.length > 0 ? appliesToPlans : ['premium', 'deluxe']

    const { data: coupon, error: couponInsertError } = await supabase
      .from('coupons')
      .insert({
        stripe_coupon_id: stripeCoupon.id,
        name,
        discount_type: discountType,
        discount_value: discountValue,
        currency: 'mxn',
        max_redemptions: maxRedemptions || null,
        expires_at: expiresAt || null,
        is_active: true,
        applies_to_plans: plans,
        created_by: user.id,
      })
      .select()
      .single()

    if (couponInsertError || !coupon) {
      console.error('Error inserting coupon:', couponInsertError)
      // Try to clean up: delete the Stripe coupon
      try { await stripe.coupons.del(stripeCoupon.id) } catch {}
      return NextResponse.json({ error: 'Failed to save coupon' }, { status: 500 })
    }

    // 3. Create Stripe Promotion Code
    const stripePromoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { coupon: stripeCoupon.id, type: 'coupon' },
      code: normalizedCode,
      ...(codeMaxRedemptions ? { max_redemptions: codeMaxRedemptions } : {}),
      ...(expiresAt ? { expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) } : {}),
    }

    const stripePromo = await stripe.promotionCodes.create(stripePromoParams)

    // 4. Insert promotion code into local DB
    const { error: promoInsertError } = await supabase
      .from('coupon_promotion_codes')
      .insert({
        coupon_id: coupon.id,
        stripe_promotion_code_id: stripePromo.id,
        code: normalizedCode,
        is_active: true,
        max_redemptions: codeMaxRedemptions || null,
        expires_at: expiresAt || null,
      })

    if (promoInsertError) {
      console.error('Error inserting promotion code:', promoInsertError)
    }

    // 5. Log activity
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('superuser_activity_logs').insert({
      superuser_id: user.id,
      action_type: 'coupon_created',
      target_type: 'coupon',
      target_id: coupon.id,
      target_name: `${name} (${normalizedCode})`,
      new_value: {
        discount_type: discountType,
        discount_value: discountValue,
        max_redemptions: maxRedemptions,
        expires_at: expiresAt,
        plans,
        code: normalizedCode,
      },
      reason: `Created coupon "${name}" with code ${normalizedCode}`,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true, coupon })
  } catch (err: any) {
    console.error('Error in POST /api/superadmin/coupons:', err)
    if (err?.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
