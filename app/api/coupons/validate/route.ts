import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRICING, type PlanType } from '@/lib/subscription-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/coupons/validate - Validate a promo code for checkout (authenticated users)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { code, planType } = await request.json()

    if (!code || !planType) {
      return NextResponse.json({ error: 'Missing required fields: code, planType' }, { status: 400 })
    }

    if (!['premium', 'deluxe'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    // Look up the promotion code
    const { data: promoCode, error } = await supabase
      .from('coupon_promotion_codes')
      .select(`
        *,
        coupons:coupon_id(*)
      `)
      .eq('code', normalizedCode)
      .maybeSingle()

    if (error || !promoCode) {
      return NextResponse.json({
        valid: false,
        reason: 'Invalid promotion code',
      })
    }

    const coupon = promoCode.coupons as any

    // Check promo code is active
    if (!promoCode.is_active) {
      return NextResponse.json({
        valid: false,
        reason: 'This promotion code is no longer active',
      })
    }

    // Check coupon is active
    if (!coupon.is_active) {
      return NextResponse.json({
        valid: false,
        reason: 'This coupon is no longer active',
      })
    }

    // Check expiration (promo code level)
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: 'This promotion code has expired',
      })
    }

    // Check expiration (coupon level)
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: 'This coupon has expired',
      })
    }

    // Check plan applicability
    if (!coupon.applies_to_plans.includes(planType)) {
      return NextResponse.json({
        valid: false,
        reason: `This coupon is not valid for the ${planType} plan`,
      })
    }

    // Check promo code redemption limits
    if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
      return NextResponse.json({
        valid: false,
        reason: 'This promotion code has reached its maximum number of uses',
      })
    }

    // Check coupon redemption limits
    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      return NextResponse.json({
        valid: false,
        reason: 'This coupon has reached its maximum number of uses',
      })
    }

    // Calculate discount
    const pricing = PRICING[planType as PlanType]
    const originalPrice = pricing.price_mxn

    let discountAmount: number
    if (coupon.discount_type === 'percent') {
      discountAmount = Math.round(originalPrice * (coupon.discount_value / 100))
    } else {
      discountAmount = Math.min(coupon.discount_value, originalPrice)
    }

    const finalPrice = originalPrice - discountAmount

    return NextResponse.json({
      valid: true,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      originalPrice,
      finalPrice,
      currency: 'mxn',
      couponName: coupon.name,
      stripePromotionCodeId: promoCode.stripe_promotion_code_id,
      couponId: coupon.id,
      promotionCodeId: promoCode.id,
    })
  } catch (err) {
    console.error('Error validating coupon:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
