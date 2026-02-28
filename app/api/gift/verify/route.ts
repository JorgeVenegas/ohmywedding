import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { generateGiftCode } from '../redeem/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

// POST /api/gift/verify - Verify gift payment and return the gift code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify payment is successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify this is a gift purchase
    if (session.metadata?.gift !== 'true') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Verify the purchaser
    if (session.metadata?.purchaser_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if gift code already exists for this session
    const { data: existingGift } = await adminClient
      .from('gift_subscriptions')
      .select('code, plan')
      .eq('stripe_checkout_session_id', sessionId)
      .single()

    if (existingGift) {
      return NextResponse.json({
        success: true,
        code: existingGift.code,
        plan: existingGift.plan,
      })
    }

    // Generate a new gift code and create the record
    const code = generateGiftCode()
    const planType = session.metadata?.plan_type || 'premium'

    const { error: insertError } = await adminClient
      .from('gift_subscriptions')
      .insert({
        code,
        plan: planType,
        purchaser_user_id: user.id,
        purchaser_email: user.email || session.customer_email,
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        amount_cents: session.amount_total || 0,
        currency: session.currency || 'mxn',
        status: 'active',
      })

    if (insertError) {
      console.error('Failed to create gift subscription:', insertError)
      return NextResponse.json({ error: 'Failed to create gift code' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      code,
      plan: planType,
    })

  } catch (error) {
    console.error('Gift verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
