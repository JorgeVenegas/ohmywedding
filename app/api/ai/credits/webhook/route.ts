import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION as never })
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  const secret    = process.env.STRIPE_AI_CREDITS_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    const { weddingId, amountCents } = session.metadata ?? {}
    if (!weddingId || !amountCents) {
      console.error('[AI credits webhook] Missing metadata on session', session.id)
      return NextResponse.json({ received: true })
    }

    const cents = parseInt(amountCents, 10)

    // Mark purchase completed
    await admin
      .from('ai_credit_purchases')
      .update({
        status:                    'completed',
        stripe_payment_intent_id:  session.payment_intent as string ?? null,
      })
      .eq('stripe_checkout_session_id', session.id)

    // Atomically add credits to the wedding budget
    await admin.rpc('increment_ai_budget', { p_wedding_id: weddingId, p_cents: cents })

    console.log(`[AI credits] Granted ${cents} cents to wedding ${weddingId}`)
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    await admin
      .from('ai_credit_purchases')
      .update({ status: 'failed' })
      .eq('stripe_checkout_session_id', session.id)
      .eq('status', 'pending')
  }

  return NextResponse.json({ received: true })
}
