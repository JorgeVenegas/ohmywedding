import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import {
  INVITATION_PRICING,
  MANAGEMENT_PRICING,
  getTierLocaleCopy,
  type InvitationTier,
  type ManagementTier,
  type PricingAxis,
} from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

const INVITATION_TIER_LEVELS: Record<InvitationTier, number> = { basic: 0, personalized: 1, bespoke: 2 }
const MANAGEMENT_TIER_LEVELS: Record<ManagementTier, number> = { basic: 0, pro: 1, agency: 2 }

// Buys a single axis+tier independently (Invitation or Management), instead of
// the legacy single free/premium/deluxe ladder. See app/api/weddings/[weddingId]/subscription/checkout/route.ts
// for the original — this intentionally skips global-discount/coupon support and
// subscription_orders funnel logging for now (both are keyed to the old plan
// shape); full price only, real Stripe checkout, until that's revisited.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { axis, tier, source, paymentMethod, bundleDiscount, cancelUrl, locale } = await request.json()
    const stripeLocale = locale === 'es' ? 'es-419' : 'en'
    const { weddingId } = await params

    if (axis !== 'invitation' && axis !== 'management') {
      return NextResponse.json({ error: 'Invalid axis' }, { status: 400 })
    }
    const selectedAxis = axis as PricingAxis

    const validTiers = selectedAxis === 'invitation' ? ['basic', 'personalized', 'bespoke'] : ['basic', 'pro', 'agency']
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const validPaymentMethods = ['card', 'msi'] as const
    const selectedPaymentMethod: typeof validPaymentMethods[number] =
      validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'card'
    const leadSource = typeof source === 'string' ? source : 'direct'

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
    const weddingQuery = supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails, wedding_name_id, partner1_first_name, partner2_first_name')

    const { data: wedding, error: weddingError } = isUUID
      ? await weddingQuery.eq('id', weddingId).single()
      : await weddingQuery.eq('wedding_name_id', weddingId).single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const resolvedWeddingId = wedding.id
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email || '')

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'You do not have permission to upgrade this wedding' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: currentSub } = await supabaseAdmin
      .from('wedding_subscriptions')
      .select('invitation_tier, management_tier')
      .eq('wedding_id', resolvedWeddingId)
      .maybeSingle()

    const currentInvitationTier: InvitationTier = (currentSub?.invitation_tier as InvitationTier) || 'basic'
    const currentManagementTier: ManagementTier = (currentSub?.management_tier as ManagementTier) || 'basic'

    // Block same-or-lower tier purchases on the selected axis — except 'basic'
    // itself, which every wedding defaults to before any purchase (there's no
    // free tier anymore, so buying 'basic' is the entry-level paid purchase,
    // not an upgrade).
    if (selectedAxis === 'invitation') {
      if (tier !== 'basic' && INVITATION_TIER_LEVELS[tier as InvitationTier] <= INVITATION_TIER_LEVELS[currentInvitationTier]) {
        return NextResponse.json(
          { error: `This wedding's invitation is already on the ${currentInvitationTier} tier. You can only upgrade to a higher tier.` },
          { status: 400 }
        )
      }
    } else {
      if (tier !== 'basic' && MANAGEMENT_TIER_LEVELS[tier as ManagementTier] <= MANAGEMENT_TIER_LEVELS[currentManagementTier]) {
        return NextResponse.json(
          { error: `This wedding's management is already on the ${currentManagementTier} tier. You can only upgrade to a higher tier.` },
          { status: 400 }
        )
      }
    }

    const tierInfo = selectedAxis === 'invitation'
      ? INVITATION_PRICING[tier as InvitationTier]
      : MANAGEMENT_PRICING[tier as ManagementTier]

    // Couples always get 50% off their Management plan when they're buying it
    // alongside an Invitation plan — the landing pricing quiz pairs the two by
    // design, so this only ever applies to the Management axis.
    const isBundleDiscount = selectedAxis === 'management' && bundleDiscount === true
    const fullPriceInCents = tierInfo.price_mxn
    const priceInCents = isBundleDiscount ? Math.round(fullPriceInCents / 2) : fullPriceInCents

    const stripe = getStripe()

    let customerId: string
    const existingCustomers = await stripe.customers.list({ email: user.email!, limit: 1 })
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email!,
        metadata: { source: 'tier_upgrade', user_id: user.id },
      })
      customerId = newCustomer.id
    }

    const coupleDisplay = wedding.partner1_first_name && wedding.partner2_first_name
      ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
      : wedding.wedding_name_id

    const localeCopy = getTierLocaleCopy(selectedAxis, tier, locale || 'en')
    const axisLabel = locale === 'es'
      ? (selectedAxis === 'invitation' ? 'Invitación' : 'Gestión')
      : (selectedAxis === 'invitation' ? 'Invitation' : 'Management')
    const productName = `OhMyWedding ${axisLabel} — ${localeCopy.name}`
    const forCouple = locale === 'es' ? `Para ${coupleDisplay}.` : `For ${coupleDisplay}.`
    const bundleSuffix = locale === 'es'
      ? '50% de descuento, incluido con plan de Invitación.'
      : '50% off, bundled with an Invitation plan.'

    const paymentMethodConfig: any = selectedPaymentMethod === 'msi'
      ? {
          payment_method_types: ['card'],
          payment_method_options: { card: { installments: { enabled: true } } },
        }
      : { payment_method_types: ['card'] }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      currency: 'mxn',
      locale: stripeLocale,
      ...paymentMethodConfig,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: selectedPaymentMethod === 'msi' ? `${productName} — Meses sin Intereses` : productName,
              description: isBundleDiscount
                ? `${localeCopy.description} ${forCouple} ${bundleSuffix}`
                : `${localeCopy.description} ${forCouple}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        wedding_id: resolvedWeddingId,
        axis: selectedAxis,
        tier,
        wedding_name_id: wedding.wedding_name_id,
        source: leadSource,
        payment_method: selectedPaymentMethod,
        ...(isBundleDiscount ? { discount: 'bundle_50' } : {}),
      },
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}${typeof cancelUrl === 'string' && cancelUrl.startsWith('/') && !cancelUrl.startsWith('//') ? cancelUrl : '/upgrade'}`,
      allow_promotion_codes: true,
    })

    // The webhook activates purchases by reading wedding_id/axis/tier back off
    // this row (Stripe doesn't reliably carry session metadata to the PaymentIntent
    // event the webhook actually handles) — from_plan/to_plan are also populated
    // (derived) so this stays visible in the existing plan-funnel reporting.
    const { error: orderInsertError } = await supabaseAdmin.from('subscription_orders').insert({
      wedding_id: resolvedWeddingId,
      user_id: user.id,
      source: leadSource,
      axis: selectedAxis,
      tier,
      from_plan: `${currentInvitationTier}+${currentManagementTier}`,
      to_plan: selectedAxis === 'invitation'
        ? `${tier}+${currentManagementTier}`
        : `${currentInvitationTier}+${tier}`,
      stripe_checkout_session_id: checkoutSession.id,
      stripe_payment_intent_id: checkoutSession.payment_intent as string | null,
      stripe_customer_id: customerId,
      amount_cents: priceInCents,
      original_amount_cents: fullPriceInCents,
      currency: 'mxn',
      status: 'checkout_started',
      checkout_started_at: new Date().toISOString(),
      visited_at: new Date().toISOString(),
      payment_method: selectedPaymentMethod,
      metadata: {
        wedding_name_id: wedding.wedding_name_id,
        couple: coupleDisplay,
        ...(isBundleDiscount ? { discount: 'bundle_50' } : {}),
      },
    })

    if (orderInsertError) {
      console.error('[checkout-tier] Failed to insert subscription_orders:', orderInsertError)
      // Non-blocking — Stripe session is already created; log and continue so payment can proceed.
      // The webhook will still fire but won't find an order, so also store in session metadata.
    }

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Tier checkout session creation failed:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
