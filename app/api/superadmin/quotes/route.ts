import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import type { QuoteScenario, DiscountType } from '@/lib/quote-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getStripe = () =>
  new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

// Convert a date/datetime-local string to a Unix timestamp at end-of-day UTC.
// datetime-local sends "2026-07-21T00:00" which parses as midnight UTC — already
// expired for anyone in Mexico. We always use 23:59:59Z so the coupon is valid
// for the full calendar day the superadmin chose.
function toEndOfDayUnix(dateStr: string): number {
  const dateOnly = dateStr.split('T')[0]
  return Math.floor(new Date(dateOnly + 'T23:59:59Z').getTime() / 1000)
}

async function verifySuperadmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await isSuperUser(supabase, { userId: user.id })))
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

// GET /api/superadmin/quotes
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error: authError } = await verifySuperadmin(supabase)
    if (authError) return authError

    const admin = createAdminSupabaseClient()
    const { data: quotes, error } = await admin
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/superadmin/quotes DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
    }
    return NextResponse.json({ quotes: quotes ?? [] })
  } catch (err) {
    console.error('GET /api/superadmin/quotes:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/superadmin/quotes
// Creates the quote, a Stripe coupon, and a Stripe promotion code atomically.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { user, error: authError } = await verifySuperadmin(supabase)
    if (authError || !user) return authError!

    const body = await request.json()
    const {
      recipientName,
      recipientEmail,
      recipientWhatsapp,
      notes,
      scenarios,
      discountType,
      discountValue,
      couponCode,
      couponExpiresAt,
      language,
    }: {
      recipientName: string
      recipientEmail?: string
      recipientWhatsapp?: string
      notes?: string
      scenarios: QuoteScenario[]
      discountType: DiscountType
      discountValue: number
      couponCode: string
      couponExpiresAt?: string
      language?: 'en' | 'es'
    } = body

    // Validate
    if (!recipientName?.trim()) {
      return NextResponse.json({ error: 'recipientName is required' }, { status: 400 })
    }
    if (!scenarios?.length) {
      return NextResponse.json({ error: 'At least one scenario is required' }, { status: 400 })
    }
    if (!['percent', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'discountType must be percent or fixed' }, { status: 400 })
    }
    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage must be 1-100' }, { status: 400 })
    }
    if (discountType === 'fixed' && discountValue < 100) {
      return NextResponse.json({ error: 'Fixed discount must be at least 100 centavos' }, { status: 400 })
    }

    const normalizedCode = couponCode.toUpperCase().trim().replace(/[^A-Z0-9]/g, '')
    if (!/^[A-Z0-9]{3,30}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Code must be 3-30 alphanumeric characters' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Check code uniqueness
    const { data: existingCode } = await admin
      .from('coupon_promotion_codes')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (existingCode) {
      return NextResponse.json({ error: 'Promotion code already exists' }, { status: 409 })
    }

    // Generate quote number
    const { count } = await admin
      .from('quotes')
      .select('*', { count: 'exact', head: true })
    const quoteNumber = `Q-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const stripe = getStripe()

    // Create Stripe coupon
    const stripeCouponParams: Stripe.CouponCreateParams = {
      name: `Quote ${quoteNumber} — ${recipientName.trim()}`,
      ...(discountType === 'percent'
        ? { percent_off: discountValue }
        : { amount_off: discountValue, currency: 'mxn' }),
      max_redemptions: 1,
      ...(couponExpiresAt ? { redeem_by: toEndOfDayUnix(couponExpiresAt) } : {}),
    }

    const stripeCoupon = await stripe.coupons.create(stripeCouponParams)

    // Insert coupon into local DB
    const { data: coupon, error: couponErr } = await admin
      .from('coupons')
      .insert({
        stripe_coupon_id: stripeCoupon.id,
        name: stripeCoupon.name,
        discount_type: discountType,
        discount_value: discountValue,
        currency: 'mxn',
        max_redemptions: 1,
        expires_at: couponExpiresAt || null,
        is_active: true,
        applies_to_plans: ['free', 'premium', 'deluxe'],
        metadata: { source: 'quote', quote_number: quoteNumber },
        created_by: user.id,
      })
      .select()
      .single()

    if (couponErr || !coupon) {
      try { await stripe.coupons.del(stripeCoupon.id) } catch {}
      return NextResponse.json({ error: 'Failed to save coupon' }, { status: 500 })
    }

    // Create Stripe promotion code
    const stripePromoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { coupon: stripeCoupon.id, type: 'coupon' },
      code: normalizedCode,
      max_redemptions: 1,
      ...(couponExpiresAt ? { expires_at: toEndOfDayUnix(couponExpiresAt) } : {}),
    }

    const stripePromo = await stripe.promotionCodes.create(stripePromoParams)

    // Insert promotion code into local DB
    await admin.from('coupon_promotion_codes').insert({
      coupon_id: coupon.id,
      stripe_promotion_code_id: stripePromo.id,
      code: normalizedCode,
      is_active: true,
      max_redemptions: 1,
      expires_at: couponExpiresAt || null,
    })

    // Create the quote
    const { data: quote, error: quoteErr } = await admin
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        recipient_name: recipientName.trim(),
        recipient_email: recipientEmail?.trim() || null,
        recipient_whatsapp: recipientWhatsapp?.trim() || null,
        notes: notes?.trim() || null,
        scenarios,
        discount_type: discountType,
        discount_value: discountValue,
        coupon_id: coupon.id,
        coupon_code: normalizedCode,
        coupon_expires_at: couponExpiresAt || null,
        language: language && ['en', 'es'].includes(language) ? language : 'es',
        status: 'sent',
        created_by: user.id,
      })
      .select()
      .single()

    if (quoteErr || !quote) {
      return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 })
    }

    // Activity log
    await admin.from('superuser_activity_logs').insert({
      superuser_id: user.id,
      action_type: 'quote_created',
      target_type: 'quote',
      target_id: quote.id,
      target_name: `${quoteNumber} — ${recipientName.trim()}`,
      new_value: { code: normalizedCode, discount_type: discountType, discount_value: discountValue },
      reason: `Created quote ${quoteNumber} for ${recipientName.trim()}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    })

    return NextResponse.json({ success: true, quote })
  } catch (err: any) {
    console.error('POST /api/superadmin/quotes:', err)
    if (err?.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
