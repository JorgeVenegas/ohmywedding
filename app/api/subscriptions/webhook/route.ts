import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Resolve the checkout session ID for a payment intent via Stripe API.
// For bank transfers, the PI object has no metadata linking back to the session,
// so we query Stripe to bridge PI → session → our DB record.
async function resolveCheckoutSessionId(
  stripe: Stripe,
  paymentIntentId: string
): Promise<string | null> {
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    })
    return sessions.data[0]?.id ?? null
  } catch (err) {
    console.error('[webhook] Failed to resolve checkout session:', err)
    return null
  }
}

// Find the order row by checkout session ID or payment intent ID.
// Returns the fields needed for subscription activation.
async function findOrder(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  checkoutSessionId: string | null,
  paymentIntentId: string | null
) {
  // Try by checkout session first (most reliable — set at checkout time)
  if (checkoutSessionId) {
    const { data } = await supabase
      .from('subscription_orders')
      .select('id, wedding_id, user_id, to_plan')
      .eq('stripe_checkout_session_id', checkoutSessionId)
      .maybeSingle()
    if (data) return data
  }
  // Fallback: try by payment intent ID
  if (paymentIntentId) {
    const { data } = await supabase
      .from('subscription_orders')
      .select('id, wedding_id, user_id, to_plan')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()
    if (data) return data
  }
  return null
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  console.log(`[webhook] Received event: ${event.type} (${event.id})`)

  try {
    switch (event.type) {
      // ─── checkout.session.completed ───────────────────────────────────
      // User finished the Stripe checkout form. For bank transfers this
      // fires immediately but payment is still pending.
      // Backfill Stripe IDs on the order (PI ID may not have been known).
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentIntentId = session.payment_intent as string | null

        console.log(`[webhook] checkout.session.completed — session=${session.id}, pi=${paymentIntentId}`)

        const order = await findOrder(supabaseAdmin, session.id, paymentIntentId)
        if (order) {
          const { error } = await supabaseAdmin
            .from('subscription_orders')
            .update({
              stripe_payment_intent_id: paymentIntentId,
              stripe_customer_id: session.customer,
              amount_cents: session.amount_total || 0,
            })
            .eq('id', order.id)
          console.log(`[webhook] Updated order ${order.id} with PI ID. Error: ${error?.message || 'none'}`)

          // If a coupon was applied (via Stripe promo code on hosted checkout), track it
          const totalDiscount = session.total_details?.amount_discount || 0
          if (totalDiscount > 0 && session.metadata) {
            const couponId = session.metadata.coupon_id
            const promotionCodeId = session.metadata.promotion_code_id

            if (couponId) {
              // Update existing redemption record with discount amounts
              const { error: redemptionError } = await supabaseAdmin
                .from('coupon_redemptions')
                .update({
                  discount_amount_cents: totalDiscount,
                  original_amount_cents: (session.amount_total || 0) + totalDiscount,
                  final_amount_cents: session.amount_total || 0,
                  subscription_order_id: order.id,
                  stripe_payment_intent_id: paymentIntentId,
                })
                .eq('stripe_checkout_session_id', session.id)
                .eq('coupon_id', couponId)

              if (redemptionError) {
                console.error('[webhook] Error updating coupon redemption:', redemptionError)
              } else {
                console.log(`[webhook] Updated coupon redemption for session ${session.id}`)
              }
            } else {
              // Coupon was applied on Stripe's hosted checkout page (not from upgrade page)
              // Try to find the promo code from Stripe session and track it
              console.log(`[webhook] Discount found ($${totalDiscount / 100}) but no coupon_id in metadata — likely applied on Stripe checkout`)
            }
          }
        } else {
          console.warn(`[webhook] No order found for session=${session.id}`)
        }

        break
      }

      // ─── payment_intent.requires_action ───────────────────────────────
      // Bank transfer instructions sent, awaiting payment.
      case 'payment_intent.requires_action': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.log(`[webhook] payment_intent.requires_action — pi=${pi.id}`)

        const checkoutSessionId = await resolveCheckoutSessionId(stripe, pi.id)
        console.log(`[webhook] Resolved checkout session: ${checkoutSessionId || 'NOT FOUND'}`)

        const order = await findOrder(supabaseAdmin, checkoutSessionId, pi.id)
        if (order) {
          const { error } = await supabaseAdmin
            .from('subscription_orders')
            .update({
              status: 'requires_action',
              action_required_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            })
            .eq('id', order.id)
          console.log(`[webhook] Updated order ${order.id} → requires_action. Error: ${error?.message || 'none'}`)
        } else {
          console.error(`[webhook] No order found for pi=${pi.id}, session=${checkoutSessionId}`)
        }

        break
      }

      // ─── payment_intent.succeeded ─────────────────────────────────────
      // Bank transfer received — activate subscription.
      // Read wedding_id/to_plan from our order record (NOT from PI
      // metadata — Stripe does not copy session metadata to the PI).
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.log(`[webhook] payment_intent.succeeded — pi=${pi.id}`)

        const checkoutSessionId = await resolveCheckoutSessionId(stripe, pi.id)
        console.log(`[webhook] Resolved checkout session: ${checkoutSessionId || 'NOT FOUND'}`)

        const order = await findOrder(supabaseAdmin, checkoutSessionId, pi.id)
        if (!order) {
          console.error(`[webhook] No order found for succeeded pi=${pi.id}, session=${checkoutSessionId}`)
          break
        }

        const { wedding_id: weddingId, user_id: userId, to_plan: planType } = order
        console.log(`[webhook] Order data: wedding=${weddingId}, user=${userId}, plan=${planType}`)

        if (!userId || !weddingId || !planType || !['premium', 'deluxe'].includes(planType)) {
          console.error('[webhook] Missing required data in order:', { userId, weddingId, planType })
          break
        }

        // Activate the subscription
        const { data: subscription, error: subscriptionError } = await supabaseAdmin
          .from('wedding_subscriptions')
          .upsert(
            {
              wedding_id: weddingId,
              plan: planType,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'wedding_id' }
          )
          .select('id')
          .single()

        if (subscriptionError) {
          console.error('[webhook] Failed to upsert wedding subscription:', subscriptionError)
          throw subscriptionError
        }

        console.log(`[webhook] Subscription upserted: ${subscription?.id}`)

        // Update order to completed
        const { error } = await supabaseAdmin
          .from('subscription_orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: pi.id,
            wedding_subscription_id: subscription?.id || null,
          })
          .eq('id', order.id)

        console.log(`[webhook] Updated order ${order.id} → completed. Error: ${error?.message || 'none'}`)
        console.log(`[webhook] ✅ Subscription activated: wedding=${weddingId}, plan=${planType}`)

        // Complete any coupon redemption linked to this order
        const { error: redemptionError } = await supabaseAdmin
          .from('coupon_redemptions')
          .update({
            status: 'completed',
            stripe_payment_intent_id: pi.id,
            subscription_order_id: order.id,
          })
          .eq('subscription_order_id', order.id)
          .eq('status', 'applied')

        if (redemptionError) {
          console.error('[webhook] Error completing coupon redemption:', redemptionError)
        }

        // Increment times_redeemed counters on coupons and promo codes
        const { data: completedRedemptions } = await supabaseAdmin
          .from('coupon_redemptions')
          .select('coupon_id, promotion_code_id')
          .eq('subscription_order_id', order.id)
          .eq('status', 'completed')

        if (completedRedemptions && completedRedemptions.length > 0) {
          for (const redemption of completedRedemptions) {
            // Increment coupon counter
            const { data: couponData } = await supabaseAdmin
              .from('coupons')
              .select('times_redeemed')
              .eq('id', redemption.coupon_id)
              .single()

            if (couponData) {
              await supabaseAdmin
                .from('coupons')
                .update({ times_redeemed: (couponData.times_redeemed || 0) + 1 })
                .eq('id', redemption.coupon_id)
            }

            // Increment promo code counter
            if (redemption.promotion_code_id) {
              const { data: promoData } = await supabaseAdmin
                .from('coupon_promotion_codes')
                .select('times_redeemed')
                .eq('id', redemption.promotion_code_id)
                .single()

              if (promoData) {
                await supabaseAdmin
                  .from('coupon_promotion_codes')
                  .update({ times_redeemed: (promoData.times_redeemed || 0) + 1 })
                  .eq('id', redemption.promotion_code_id)
              }
            }
          }
          console.log(`[webhook] Incremented coupon redemption counters`)
        }

        break
      }

      // ─── payment_intent.payment_failed ────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.log(`[webhook] payment_intent.payment_failed — pi=${pi.id}`)

        const checkoutSessionId = await resolveCheckoutSessionId(stripe, pi.id)
        const order = await findOrder(supabaseAdmin, checkoutSessionId, pi.id)
        if (order) {
          await supabaseAdmin
            .from('subscription_orders')
            .update({
              status: 'failed',
              failed_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            })
            .eq('id', order.id)
          console.log(`[webhook] Updated order ${order.id} → failed`)
        }

        break
      }

      // payment_intent.created — no action needed
      case 'payment_intent.created':
        console.log(`[webhook] payment_intent.created — no action`)
        break

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] Processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}