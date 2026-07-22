import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import {
  INVITATION_PRICING,
  MANAGEMENT_PRICING,
  getTierLocaleCopy,
  type InvitationTier,
  type ManagementTier,
} from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params

    // Require auth — the client redirects to /login on 401
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { scenarioIndex, weddingId: requestedWeddingId, locale } = await request.json()

    if (typeof scenarioIndex !== 'number') {
      return NextResponse.json({ error: 'scenarioIndex is required' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Fetch quote (admin client — quote is public-accessible by design)
    const { data: quote, error: quoteErr } = await admin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteErr || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (['paid', 'expired', 'cancelled'].includes(quote.status)) {
      return NextResponse.json({ error: `Quote is ${quote.status}` }, { status: 400 })
    }

    const scenario = quote.scenarios[scenarioIndex]
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 400 })
    }

    if (!scenario.invitation_tier && !scenario.management_tier) {
      return NextResponse.json({ error: 'Scenario has no tiers' }, { status: 400 })
    }

    // Get the user's weddings (to validate the requested weddingId belongs to them)
    const { data: weddings, error: weddingsErr } = await supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails, wedding_name_id, partner1_first_name, partner2_first_name')

    if (weddingsErr || !weddings || weddings.length === 0) {
      return NextResponse.json({
        error: 'no_wedding',
        redirectUrl: '/admin',
      }, { status: 422 })
    }

    // Use the caller-specified wedding; verify they actually own/collaborate on it
    const wedding = requestedWeddingId
      ? weddings.find(w => w.id === requestedWeddingId)
      : weddings[0]

    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found or access denied' }, { status: 403 })
    }

    const weddingId = wedding.id

    // Fetch the coupon + promotion code rows (need both for regeneration on expiry)
    if (!quote.coupon_id) {
      return NextResponse.json({ error: 'Quote has no coupon attached' }, { status: 400 })
    }

    const [{ data: couponRow }, { data: promoCode }] = await Promise.all([
      admin
        .from('coupons')
        .select('id, stripe_coupon_id, discount_type, discount_value')
        .eq('id', quote.coupon_id)
        .single(),
      admin
        .from('coupon_promotion_codes')
        .select('id, code, stripe_promotion_code_id')
        .eq('coupon_id', quote.coupon_id)
        .maybeSingle(),
    ])

    if (!couponRow || !promoCode?.stripe_promotion_code_id) {
      return NextResponse.json({ error: 'Promo code not found for this quote' }, { status: 500 })
    }

    let stripePromoCodeId: string = promoCode.stripe_promotion_code_id

    const stripe = getStripe()
    const stripeLocale = (locale || quote.language) === 'es' ? 'es-419' : 'en'

    // Get or create Stripe customer
    let customerId: string
    const existingCustomers = await stripe.customers.list({ email: user.email!, limit: 1 })
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email!,
        metadata: { source: 'quote_checkout', user_id: user.id },
      })
      customerId = newCustomer.id
    }

    const lang = (locale || quote.language) as 'en' | 'es'
    const axisLabelInvitation = lang === 'es' ? 'Invitación' : 'Invitation'
    const axisLabelManagement = lang === 'es' ? 'Gestión' : 'Management'
    const forCouple = lang === 'es' ? `Para ${quote.recipient_name}.` : `For ${quote.recipient_name}.`

    // Build line items (1 or 2 depending on the scenario)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    if (scenario.invitation_tier) {
      const tierInfo = INVITATION_PRICING[scenario.invitation_tier as InvitationTier]
      const tierCopy = getTierLocaleCopy('invitation', scenario.invitation_tier, lang)
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `OhMyWedding ${axisLabelInvitation} — ${tierCopy.name}`,
            description: `${tierCopy.description} ${forCouple}`,
          },
          unit_amount: tierInfo.price_mxn,
        },
        quantity: 1,
      })
    }

    if (scenario.management_tier) {
      const tierInfo = MANAGEMENT_PRICING[scenario.management_tier as ManagementTier]
      const tierCopy = getTierLocaleCopy('management', scenario.management_tier, lang)
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `OhMyWedding ${axisLabelManagement} — ${tierCopy.name}`,
            description: `${tierCopy.description} ${forCouple}`,
          },
          unit_amount: tierInfo.price_mxn,
        },
        quantity: 1,
      })
    }

    const origin = request.headers.get('origin') || ''

    const buildSessionParams = (promoId: string): Stripe.Checkout.SessionCreateParams => ({
      customer: customerId,
      currency: 'mxn',
      locale: stripeLocale,
      payment_method_types: ['card'],
      line_items: lineItems,
      discounts: [{ promotion_code: promoId }],
      metadata: {
        user_id: user.id,
        wedding_id: weddingId,
        quote_id: quoteId,
        quote_number: quote.quote_number,
        source: 'quote',
      },
      mode: 'payment',
      success_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/quotes/${quoteId}`,
    })

    let checkoutSession: Stripe.Checkout.Session
    try {
      checkoutSession = await stripe.checkout.sessions.create(buildSessionParams(stripePromoCodeId))
    } catch (stripeErr: any) {
      // If the Stripe coupon is expired (redeem_by in the past), regenerate it
      // transparently so the user can still complete checkout.
      const isExpired =
        stripeErr?.type === 'StripeInvalidRequestError' &&
        (stripeErr?.message?.toLowerCase().includes('expired') ||
          stripeErr?.code === 'coupon_expired')

      if (!isExpired) throw stripeErr

      // Before regenerating: check if the coupon was already redeemed on Stripe.
      // If so, don't delete it — it carries redemption history and cannot be reused.
      try {
        const existingCoupon = await stripe.coupons.retrieve(couponRow.stripe_coupon_id)
        if (existingCoupon.times_redeemed > 0) {
          // Sync local count and bail — this coupon is spent
          await admin
            .from('coupons')
            .update({ times_redeemed: existingCoupon.times_redeemed })
            .eq('id', couponRow.id)
          return NextResponse.json(
            { error: 'This coupon has already been redeemed and cannot be applied again.' },
            { status: 400 }
          )
        }
      } catch {
        // If we can't retrieve it, fall through to regenerate
      }

      console.warn(`[quote checkout] Stripe coupon expired — regenerating for quote ${quoteId}`)

      // Delete old Stripe coupon (cascades to all its promotion codes in Stripe)
      try { await stripe.coupons.del(couponRow.stripe_coupon_id) } catch {}

      // Create fresh Stripe coupon with same discount but no redeem_by
      const newStripeCoupon = await stripe.coupons.create({
        name: `Quote ${quote.quote_number} — ${quote.recipient_name} (renewed)`,
        ...(couponRow.discount_type === 'percent'
          ? { percent_off: couponRow.discount_value }
          : { amount_off: couponRow.discount_value, currency: 'mxn' }),
        max_redemptions: 1,
      })

      // Create fresh Stripe promotion code with the same visible code
      const newStripePromo = await stripe.promotionCodes.create({
        promotion: { coupon: newStripeCoupon.id, type: 'coupon' },
        code: promoCode.code,
        max_redemptions: 1,
      })

      // Update local DB so future lookups get the new IDs
      await Promise.all([
        admin.from('coupons')
          .update({ stripe_coupon_id: newStripeCoupon.id })
          .eq('id', couponRow.id),
        admin.from('coupon_promotion_codes')
          .update({ stripe_promotion_code_id: newStripePromo.id })
          .eq('id', promoCode.id),
      ])

      stripePromoCodeId = newStripePromo.id
      checkoutSession = await stripe.checkout.sessions.create(buildSessionParams(stripePromoCodeId))
    }

    // Get current subscription state for to_plan calculation
    const { data: currentSub } = await admin
      .from('wedding_subscriptions')
      .select('invitation_tier, management_tier')
      .eq('wedding_id', weddingId)
      .maybeSingle()

    const currentInvitationTier: InvitationTier = (currentSub?.invitation_tier as InvitationTier) || 'basic'
    const currentManagementTier: ManagementTier = (currentSub?.management_tier as ManagementTier) || 'basic'

    const nowIso = new Date().toISOString()

    // Create one subscription_order row per axis being purchased
    const orderInserts = []

    if (scenario.invitation_tier) {
      const axis = 'invitation'
      const tier = scenario.invitation_tier as InvitationTier
      const targetManagement = scenario.management_tier
        ? (scenario.management_tier as ManagementTier)
        : currentManagementTier

      orderInserts.push({
        wedding_id: weddingId,
        user_id: user.id,
        source: 'quote',
        axis,
        tier,
        from_plan: `${currentInvitationTier}+${currentManagementTier}`,
        to_plan: `${tier}+${targetManagement}`,
        stripe_checkout_session_id: checkoutSession.id,
        stripe_payment_intent_id: checkoutSession.payment_intent as string | null,
        stripe_customer_id: customerId,
        amount_cents: scenario.invitation_price_cents,
        original_amount_cents: scenario.invitation_price_cents,
        currency: 'mxn',
        status: 'checkout_started',
        checkout_started_at: nowIso,
        visited_at: nowIso,
        payment_method: 'card',
        metadata: { quote_id: quoteId, quote_number: quote.quote_number, recipient: quote.recipient_name },
      })
    }

    if (scenario.management_tier) {
      const axis = 'management'
      const tier = scenario.management_tier as ManagementTier
      const targetInvitation = scenario.invitation_tier
        ? (scenario.invitation_tier as InvitationTier)
        : currentInvitationTier

      orderInserts.push({
        wedding_id: weddingId,
        user_id: user.id,
        source: 'quote',
        axis,
        tier,
        from_plan: `${currentInvitationTier}+${currentManagementTier}`,
        to_plan: `${targetInvitation}+${tier}`,
        stripe_checkout_session_id: checkoutSession.id,
        stripe_payment_intent_id: checkoutSession.payment_intent as string | null,
        stripe_customer_id: customerId,
        amount_cents: scenario.management_price_cents,
        original_amount_cents: scenario.management_price_cents,
        currency: 'mxn',
        status: 'checkout_started',
        checkout_started_at: nowIso,
        visited_at: nowIso,
        payment_method: 'card',
        metadata: { quote_id: quoteId, quote_number: quote.quote_number, recipient: quote.recipient_name },
      })
    }

    const { data: createdOrders, error: ordersInsertError } = await admin
      .from('subscription_orders')
      .insert(orderInserts)
      .select('id, to_plan')

    if (ordersInsertError) {
      console.error('[quote checkout] Failed to insert subscription_orders:', ordersInsertError)
      return NextResponse.json({ error: 'Failed to record order' }, { status: 500 })
    }

    // Create a coupon redemption record so the superadmin dashboard tracks usage
    // and the webhook can increment times_redeemed when payment completes.
    const firstOrder = createdOrders?.[0]
    if (firstOrder) {
      try {
        await admin.from('coupon_redemptions').insert({
          coupon_id: couponRow.id,
          promotion_code_id: promoCode.id,
          wedding_id: weddingId,
          user_id: user.id,
          stripe_checkout_session_id: checkoutSession.id,
          subscription_order_id: firstOrder.id,
          original_amount_cents: scenario.total_price_cents,
          plan_type: firstOrder.to_plan,
          status: 'applied',
        })
      } catch (err) {
        console.error('[quote checkout] Failed to create coupon redemption record:', err)
        // Non-blocking — don't fail the checkout
      }
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('POST /api/quotes/[quoteId]/checkout:', err)
    if (err?.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
