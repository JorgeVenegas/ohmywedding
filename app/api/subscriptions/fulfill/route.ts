import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { type InvitationTier, type ManagementTier } from '@/lib/subscription-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })
}

// POST /api/subscriptions/fulfill
// Synchronous post-payment activation called from the success page.
// Idempotent — safe to call multiple times (skips already-completed orders).
// The Stripe webhook runs the same logic as redundancy.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Find all orders for this session
    const { data: orders } = await admin
      .from('subscription_orders')
      .select('id, wedding_id, user_id, to_plan, axis, tier, status, source, metadata')
      .eq('stripe_checkout_session_id', sessionId)

    if (!orders || orders.length === 0) {
      // No orders found — could be a legacy or different flow
      return NextResponse.json({ success: true, noOrders: true })
    }

    // Verify caller owns these orders
    if (!orders.every(o => o.user_id === user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const weddingId: string = orders[0].wedding_id
    const paymentIntentId = session.payment_intent as string | null

    // If all already completed, return the wedding info idempotently
    if (orders.every(o => o.status === 'completed')) {
      const { data: wedding } = await admin
        .from('weddings')
        .select('wedding_name_id')
        .eq('id', weddingId)
        .single()
      return NextResponse.json({ success: true, weddingNameId: wedding?.wedding_name_id ?? null, alreadyProcessed: true })
    }

    // Activate subscription for each pending order
    for (const order of orders) {
      if (order.status === 'completed') continue

      const { wedding_id, to_plan: planType, axis, tier } = order
      if (!wedding_id || !planType) continue

      const subscriptionUpdate: Record<string, unknown> = {
        wedding_id,
        updated_at: new Date().toISOString(),
      }

      if (axis && tier) {
        subscriptionUpdate[axis === 'invitation' ? 'invitation_tier' : 'management_tier'] = tier
      }

      await admin
        .from('wedding_subscriptions')
        .upsert(subscriptionUpdate, { onConflict: 'wedding_id' })

      await admin
        .from('subscription_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq('id', order.id)
        .neq('status', 'completed') // idempotency guard
    }

    // Mark quote as paid if this was a quote checkout
    const quoteOrder = orders.find(o => o.source === 'quote' && o.metadata?.quote_id)
    if (quoteOrder) {
      await admin
        .from('quotes')
        .update({ status: 'paid', wedding_id: quoteOrder.wedding_id })
        .eq('id', quoteOrder.metadata!.quote_id)
        .neq('status', 'paid')
    }

    // Update coupon redemption and increment counter (only on first successful call)
    if (paymentIntentId) {
      for (const order of orders) {
        const { data: updated } = await admin
          .from('coupon_redemptions')
          .update({
            status: 'completed',
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq('subscription_order_id', order.id)
          .eq('status', 'applied') // only transition from applied → only runs once
          .select('coupon_id, promotion_code_id')

        if (updated?.length) {
          for (const r of updated) {
            // Increment coupon times_redeemed
            const { data: couponData } = await admin
              .from('coupons')
              .select('times_redeemed')
              .eq('id', r.coupon_id)
              .single()
            if (couponData) {
              await admin
                .from('coupons')
                .update({ times_redeemed: (couponData.times_redeemed || 0) + 1 })
                .eq('id', r.coupon_id)
            }

            if (r.promotion_code_id) {
              const { data: promoData } = await admin
                .from('coupon_promotion_codes')
                .select('times_redeemed')
                .eq('id', r.promotion_code_id)
                .single()
              if (promoData) {
                await admin
                  .from('coupon_promotion_codes')
                  .update({ times_redeemed: (promoData.times_redeemed || 0) + 1 })
                  .eq('id', r.promotion_code_id)
              }
            }
          }
        }
      }
    }

    const { data: wedding } = await admin
      .from('weddings')
      .select('wedding_name_id')
      .eq('id', weddingId)
      .single()

    return NextResponse.json({ success: true, weddingNameId: wedding?.wedding_name_id ?? null })
  } catch (err) {
    console.error('[fulfill] Error:', err)
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 })
  }
}
