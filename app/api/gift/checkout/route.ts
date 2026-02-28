import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { PRICING } from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

const VALID_PLANS = ['premium', 'deluxe'] as const
type ValidPlan = typeof VALID_PLANS[number]

// POST /api/gift/checkout - Create Stripe checkout for a gift purchase
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { planType } = await request.json()

    // Validate plan
    if (!VALID_PLANS.includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const validatedPlan = planType as ValidPlan
    const stripe = getStripe()
    const pricing = PRICING[validatedPlan]

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    let customerId: string
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Get the base URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://ohmy.wedding'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Gift - ${pricing.name} Plan`,
              description: `Gift a ${pricing.name} wedding plan to a loved one`,
            },
            unit_amount: pricing.price_mxn,
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
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Gift checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
