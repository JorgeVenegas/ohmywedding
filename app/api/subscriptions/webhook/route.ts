import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { type InvitationTier, type ManagementTier } from '@/lib/subscription-shared'

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

type OrderRow = { id: string; wedding_id: string; user_id: string; to_plan: string; axis: string | null; tier: string | null; source: string | null; metadata: Record<string, string> | null }

// Find all order rows by checkout session ID or payment intent ID.
// Bundles create multiple rows per session; returns all of them.
async function findOrders(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  checkoutSessionId: string | null,
  paymentIntentId: string | null
): Promise<OrderRow[]> {
  if (checkoutSessionId) {
    const { data } = await supabase
      .from('subscription_orders')
      .select('id, wedding_id, user_id, to_plan, axis, tier, source, metadata')
      .eq('stripe_checkout_session_id', checkoutSessionId)
    if (data && data.length > 0) return data
  }
  if (paymentIntentId) {
    const { data } = await supabase
      .from('subscription_orders')
      .select('id, wedding_id, user_id, to_plan, axis, tier, source, metadata')
      .eq('stripe_payment_intent_id', paymentIntentId)
    if (data && data.length > 0) return data
  }
  return []
}

// Convenience wrapper for single-order callers that haven't changed yet
async function findOrder(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  checkoutSessionId: string | null,
  paymentIntentId: string | null
): Promise<OrderRow | null> {
  const orders = await findOrders(supabase, checkoutSessionId, paymentIntentId)
  return orders[0] ?? null
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
      // Backfill the Stripe PI ID on ALL orders for this session (a two-axis
      // quote creates two rows with the same stripe_checkout_session_id).
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentIntentId = session.payment_intent as string | null

        console.log(`[webhook] checkout.session.completed — session=${session.id}, pi=${paymentIntentId}`)

        const orders = await findOrders(supabaseAdmin, session.id, paymentIntentId)
        if (orders.length > 0) {
          for (const order of orders) {
            const { error } = await supabaseAdmin
              .from('subscription_orders')
              .update({
                stripe_payment_intent_id: paymentIntentId,
                stripe_customer_id: session.customer,
                // Do NOT overwrite amount_cents here — it was set correctly per-axis at checkout.
                // session.amount_total is the full session total, not the per-order amount.
              })
              .eq('id', order.id)
            console.log(`[webhook] Updated order ${order.id} with PI ID. Error: ${error?.message || 'none'}`)
          }

          // Coupon discount tracking (only applicable for non-quote checkouts that pass
          // coupon_id in session metadata — quote checkouts track via coupon_redemptions).
          const totalDiscount = session.total_details?.amount_discount || 0
          if (totalDiscount > 0 && session.metadata) {
            const couponId = session.metadata.coupon_id
            if (couponId) {
              const firstOrder = orders[0]
              const { error: redemptionError } = await supabaseAdmin
                .from('coupon_redemptions')
                .update({
                  discount_amount_cents: totalDiscount,
                  original_amount_cents: (session.amount_total || 0) + totalDiscount,
                  final_amount_cents: session.amount_total || 0,
                  subscription_order_id: firstOrder.id,
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
              console.log(`[webhook] Discount found ($${totalDiscount / 100}) but no coupon_id in metadata — likely applied on Stripe checkout`)
            }
          }
        } else {
          console.warn(`[webhook] No orders found for session=${session.id}`)
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

        const orders = await findOrders(supabaseAdmin, checkoutSessionId, pi.id)
        if (!orders.length) {
          console.error(`[webhook] No orders found for succeeded pi=${pi.id}, session=${checkoutSessionId}`)
          break
        }

        console.log(`[webhook] Found ${orders.length} order(s) for session ${checkoutSessionId}`)

        // Detect payment method once (shared across all orders in the session)
        let detectedPaymentMethod: string | null = null
        try {
          const piDetails = await stripe.paymentIntents.retrieve(pi.id, { expand: ['latest_charge'] })
          const charge = piDetails.latest_charge as Stripe.Charge | null
          if (charge?.payment_method_details) {
            const pmType = charge.payment_method_details.type
            if (pmType === 'customer_balance') {
              detectedPaymentMethod = 'transfer'
            } else if (pmType === 'card') {
              const installmentPlan = (charge.payment_method_details.card as any)?.installments?.plan
              detectedPaymentMethod = installmentPlan ? 'msi' : 'card'
            }
          }
        } catch (pmErr) {
          console.error('[webhook] Could not detect payment method:', pmErr)
        }

        let lastSubscriptionId: string | undefined

        // Process each order — sequential upserts so later ones see earlier writes
        for (const order of orders) {
          const { wedding_id: weddingId, user_id: userId, to_plan: planType, axis, tier } = order
          console.log(`[webhook] Processing order ${order.id}: wedding=${weddingId}, plan=${planType}, axis=${axis}, tier=${tier}`)

          if (!userId || !weddingId || !planType) {
            console.error('[webhook] Missing required data in order:', { userId, weddingId, planType })
            continue
          }

          const subscriptionUpdate: Record<string, unknown> = {
            wedding_id: weddingId,
            updated_at: new Date().toISOString(),
          }

          if (axis && tier) {
            subscriptionUpdate[axis === 'invitation' ? 'invitation_tier' : 'management_tier'] = tier
          }

          const { data: subscription, error: subscriptionError } = await supabaseAdmin
            .from('wedding_subscriptions')
            .upsert(subscriptionUpdate, { onConflict: 'wedding_id' })
            .select('id')
            .single()

          if (subscriptionError) {
            console.error(`[webhook] Failed to upsert subscription for order ${order.id}:`, subscriptionError)
            throw subscriptionError
          }

          lastSubscriptionId = subscription?.id
          console.log(`[webhook] Subscription upserted: ${subscription?.id}`)

          const orderUpdateData: Record<string, unknown> = {
            status: 'completed',
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: pi.id,
            wedding_subscription_id: subscription?.id || null,
          }
          if (detectedPaymentMethod) {
            orderUpdateData.payment_method = detectedPaymentMethod
          }

          const { error } = await supabaseAdmin
            .from('subscription_orders')
            .update(orderUpdateData)
            .eq('id', order.id)

          console.log(`[webhook] Updated order ${order.id} → completed. Error: ${error?.message || 'none'}`)
          console.log(`[webhook] ✅ Axis activated: wedding=${weddingId}, axis=${axis}, tier=${tier}`)

          // Coupon redemption — only increment counters if we're the one
          // transitioning applied→completed (guards against double-count when
          // the fulfill endpoint already ran on the success page).
          const { data: justCompleted, error: redemptionError } = await supabaseAdmin
            .from('coupon_redemptions')
            .update({
              status: 'completed',
              stripe_payment_intent_id: pi.id,
              subscription_order_id: order.id,
            })
            .eq('subscription_order_id', order.id)
            .eq('status', 'applied')
            .select('coupon_id, promotion_code_id')

          if (redemptionError) {
            console.error('[webhook] Error completing coupon redemption:', redemptionError)
          }

          if (justCompleted && justCompleted.length > 0) {
            for (const redemption of justCompleted) {
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
            console.log(`[webhook] Incremented coupon redemption counters for order ${order.id}`)
          } else {
            console.log(`[webhook] Coupon redemption for order ${order.id} already completed (by fulfill endpoint or previous webhook)`)
          }
        }

        // If this was a quote checkout, mark the quote as paid and link the wedding
        const quoteOrder = orders.find(o => o.source === 'quote' && o.metadata?.quote_id)
        if (quoteOrder) {
          const quoteId = quoteOrder.metadata!.quote_id
          const { error: quoteError } = await supabaseAdmin
            .from('quotes')
            .update({ status: 'paid', wedding_id: quoteOrder.wedding_id })
            .eq('id', quoteId)
            .neq('status', 'paid')
          if (quoteError) {
            console.error(`[webhook] Failed to mark quote ${quoteId} as paid:`, quoteError)
          } else {
            console.log(`[webhook] ✅ Quote ${quoteId} marked as paid, linked to wedding ${quoteOrder.wedding_id}`)
          }
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