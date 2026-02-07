import { NextResponse, NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRICING } from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  })
}

const VALID_PLANS = ['premium', 'deluxe'] as const
type ValidPlan = typeof VALID_PLANS[number]

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { planType } = await request.json()

    if (!VALID_PLANS.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be premium or deluxe.' },
        { status: 400 }
      )
    }

    const plan = planType as ValidPlan
    const pricing = PRICING[plan]

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Check if user already has a Stripe customer ID
    let customerId: string | undefined

    const { data: userData } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .single()

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    const planLabel = plan === 'premium' ? 'Premium' : 'Deluxe'

    // Get base URL from request headers (works in all environments)
    const host = request.headers.get('host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    // Create Stripe Checkout Session with card and bank transfer (same as registry)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: {
            type: 'mx_bank_transfer', // SPEI for Mexico
          },
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Oh My Wedding - ${planLabel}`,
              description: `One-time payment for lifetime access to all ${planLabel.toLowerCase()} features`,
            },
            unit_amount: pricing.price_mxn,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/upgrade?cancelled=true`,
      metadata: {
        user_id: user.id,
        plan_type: plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
