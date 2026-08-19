import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { INVITATION_PRICING, MANAGEMENT_PRICING } from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

const VALID_PLANS = ['invitation_basic', 'premium', 'deluxe', 'management_basic', 'management_pro', 'management_agency'] as const
type ValidPlan = typeof VALID_PLANS[number]

type PlanMeta = { name: string; price_mxn: number }

const PLAN_META: Record<ValidPlan, PlanMeta> = {
  invitation_basic: { name: INVITATION_PRICING.basic.name,        price_mxn: INVITATION_PRICING.basic.price_mxn        },
  premium:          { name: INVITATION_PRICING.personalized.name, price_mxn: INVITATION_PRICING.personalized.price_mxn },
  deluxe:           { name: INVITATION_PRICING.bespoke.name,      price_mxn: INVITATION_PRICING.bespoke.price_mxn      },
  management_basic: { name: MANAGEMENT_PRICING.basic.name,        price_mxn: MANAGEMENT_PRICING.basic.price_mxn        },
  management_pro:   { name: MANAGEMENT_PRICING.pro.name,          price_mxn: MANAGEMENT_PRICING.pro.price_mxn          },
  management_agency:{ name: MANAGEMENT_PRICING.agency.name,       price_mxn: MANAGEMENT_PRICING.agency.price_mxn       },
}

// POST /api/gift/checkout - Create Stripe checkout for a gift purchase
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { planType } = await request.json()

    if (!VALID_PLANS.includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const validatedPlan = planType as ValidPlan
    const stripe = getStripe()
    const planMeta = PLAN_META[validatedPlan]

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch active global discount coupon
    let globalStripeCouponId: string | null = null
    const { data: activeDiscount } = await supabaseAdmin
      .from('global_discounts')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .limit(1)
      .maybeSingle()

    if (activeDiscount) {
      const planApplies = !activeDiscount.applies_to_plans?.length ||
        activeDiscount.applies_to_plans.includes(validatedPlan)
      if (planApplies) {
        // Gift is always card payment — use premium card coupon as fallback for management plans
        if (validatedPlan === 'premium') {
          globalStripeCouponId = activeDiscount.premium_card_stripe_coupon_id || null
        } else if (validatedPlan === 'deluxe') {
          globalStripeCouponId = activeDiscount.deluxe_card_stripe_coupon_id || null
        }
        // Management plans: no dedicated coupon fields yet — allow promotion codes instead
      }
    }

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 })
    let customerId: string
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://ohmy.wedding'

    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Gift - ${planMeta.name} Plan`,
              description: `Gift a ${planMeta.name} wedding plan to a loved one`,
            },
            unit_amount: planMeta.price_mxn,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gift`,
      metadata: {
        gift: 'true',
        plan_type: validatedPlan,
        purchaser_user_id: user.id,
        purchaser_email: user.email || '',
      },
      payment_intent_data: {
        metadata: {
          gift: 'true',
          plan_type: validatedPlan,
          purchaser_user_id: user.id,
        },
      },
    }

    if (globalStripeCouponId) {
      sessionParams.discounts = [{ coupon: globalStripeCouponId }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (error) {
    console.error('Gift checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
