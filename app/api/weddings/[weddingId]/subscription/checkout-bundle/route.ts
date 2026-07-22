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

// Creates a single Stripe checkout session with TWO line items:
//   - mainAxis/mainTier at full price
//   - companionAxis/companionTier at 50% off (bundle discount)
// Inserts two subscription_orders rows so the webhook activates both plans.
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

    const { mainAxis, mainTier, companionAxis, companionTier, paymentMethod, source, cancelUrl, locale } = await request.json()
    const stripeLocale = locale === 'es' ? 'es-419' : 'en'
    const { weddingId } = await params

    const validInvTiers = ['basic', 'personalized', 'bespoke']
    const validMgmtTiers = ['basic', 'pro', 'agency']

    if (!['invitation', 'management'].includes(mainAxis) || !['invitation', 'management'].includes(companionAxis)) {
      return NextResponse.json({ error: 'Invalid axis' }, { status: 400 })
    }
    if (mainAxis === companionAxis) {
      return NextResponse.json({ error: 'Bundle axes must differ' }, { status: 400 })
    }
    const mainValid = mainAxis === 'invitation' ? validInvTiers : validMgmtTiers
    const companionValid = companionAxis === 'invitation' ? validInvTiers : validMgmtTiers
    if (!mainValid.includes(mainTier) || !companionValid.includes(companionTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
    const weddingQuery = supabase
      .from('weddings')
      .select('id, owner_id, wedding_name_id, partner1_first_name, partner2_first_name')
    const { data: wedding, error: weddingError } = isUUID
      ? await weddingQuery.eq('id', weddingId).single()
      : await weddingQuery.eq('wedding_name_id', weddingId).single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const resolvedWeddingId = wedding.id
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: currentSub } = await supabaseAdmin
      .from('wedding_subscriptions')
      .select('invitation_tier, management_tier')
      .eq('wedding_id', resolvedWeddingId)
      .maybeSingle()

    const currentInvTier: InvitationTier = (currentSub?.invitation_tier as InvitationTier) || 'basic'
    const currentMgmtTier: ManagementTier = (currentSub?.management_tier as ManagementTier) || 'basic'

    const coupleDisplay = wedding.partner1_first_name && wedding.partner2_first_name
      ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
      : wedding.wedding_name_id

    const mainPricing = mainAxis === 'invitation'
      ? INVITATION_PRICING[mainTier as InvitationTier]
      : MANAGEMENT_PRICING[mainTier as ManagementTier]
    const companionPricing = companionAxis === 'invitation'
      ? INVITATION_PRICING[companionTier as InvitationTier]
      : MANAGEMENT_PRICING[companionTier as ManagementTier]

    const mainPriceCents = mainPricing.price_mxn
    const companionFullCents = companionPricing.price_mxn
    const companionDiscountedCents = Math.round(companionFullCents / 2)

    const selectedPaymentMethod = paymentMethod === 'msi' ? 'msi' : 'card'
    const leadSource = typeof source === 'string' ? source : 'bundle'

    const stripe = getStripe()
    let customerId: string
    const existingCustomers = await stripe.customers.list({ email: user.email!, limit: 1 })
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email!,
        metadata: { source: 'bundle_upgrade', user_id: user.id },
      })
      customerId = newCustomer.id
    }

    const paymentMethodConfig: any = selectedPaymentMethod === 'msi'
      ? { payment_method_types: ['card'], payment_method_options: { card: { installments: { enabled: true } } } }
      : { payment_method_types: ['card'] }

    const mainLocaleCopy = getTierLocaleCopy(mainAxis as PricingAxis, mainTier, locale || 'en')
    const companionLocaleCopy = getTierLocaleCopy(companionAxis as PricingAxis, companionTier, locale || 'en')

    const axisLabel = (axis: string) => {
      if (locale === 'es') return axis === 'invitation' ? 'Invitación' : 'Gestión'
      return axis === 'invitation' ? 'Invitation' : 'Management'
    }
    const mainLabel = `OhMyWedding ${axisLabel(mainAxis)} — ${mainLocaleCopy.name}`
    const companionLabel = `OhMyWedding ${axisLabel(companionAxis)} — ${companionLocaleCopy.name}`

    const forCouple = locale === 'es' ? `Para ${coupleDisplay}.` : `For ${coupleDisplay}.`
    const bundleSuffix = locale === 'es' ? '50% de descuento en paquete.' : '50% bundle discount.'

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
              name: mainLabel,
              description: `${mainLocaleCopy.description} ${forCouple}`,
            },
            unit_amount: mainPriceCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: locale === 'es' ? `${companionLabel} — Paquete (50% off)` : `${companionLabel} — Bundle (50% off)`,
              description: `${companionLocaleCopy.description} ${forCouple} ${bundleSuffix}`,
            },
            unit_amount: companionDiscountedCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        wedding_id: resolvedWeddingId,
        wedding_name_id: wedding.wedding_name_id,
        source: leadSource,
        payment_method: selectedPaymentMethod,
        bundle: 'true',
        main_axis: mainAxis,
        main_tier: mainTier,
        companion_axis: companionAxis,
        companion_tier: companionTier,
      },
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}${typeof cancelUrl === 'string' && cancelUrl.startsWith('/') && !cancelUrl.startsWith('//') ? cancelUrl : '/upgrade'}`,
      allow_promotion_codes: true,
    })

    // Final plan after both axes are applied
    const targetInvTier: InvitationTier =
      mainAxis === 'invitation' ? (mainTier as InvitationTier)
      : companionAxis === 'invitation' ? (companionTier as InvitationTier)
      : currentInvTier
    const targetMgmtTier: ManagementTier =
      mainAxis === 'management' ? (mainTier as ManagementTier)
      : companionAxis === 'management' ? (companionTier as ManagementTier)
      : currentMgmtTier
    const targetPlan = `${targetInvTier}+${targetMgmtTier}`
    const fromPlan = `${currentInvTier}+${currentMgmtTier}`

    // Two orders — same session ID so the webhook activates both axes on payment
    await supabaseAdmin.from('subscription_orders').insert([
      {
        wedding_id: resolvedWeddingId,
        user_id: user.id,
        source: leadSource,
        axis: mainAxis,
        tier: mainTier,
        from_plan: fromPlan,
        to_plan: targetPlan,
        stripe_checkout_session_id: checkoutSession.id,
        stripe_customer_id: customerId,
        amount_cents: mainPriceCents,
        original_amount_cents: mainPriceCents,
        currency: 'mxn',
        status: 'checkout_started',
        checkout_started_at: new Date().toISOString(),
        visited_at: new Date().toISOString(),
        payment_method: selectedPaymentMethod,
        metadata: { wedding_name_id: wedding.wedding_name_id, couple: coupleDisplay, bundle: true, role: 'main' },
      },
      {
        wedding_id: resolvedWeddingId,
        user_id: user.id,
        source: leadSource,
        axis: companionAxis,
        tier: companionTier,
        from_plan: fromPlan,
        to_plan: targetPlan,
        stripe_checkout_session_id: checkoutSession.id,
        stripe_customer_id: customerId,
        amount_cents: companionDiscountedCents,
        original_amount_cents: companionFullCents,
        currency: 'mxn',
        status: 'checkout_started',
        checkout_started_at: new Date().toISOString(),
        visited_at: new Date().toISOString(),
        payment_method: selectedPaymentMethod,
        metadata: { wedding_name_id: wedding.wedding_name_id, couple: coupleDisplay, bundle: true, role: 'companion', discount: 'bundle_50' },
      },
    ])

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Bundle checkout failed:', error)
    return NextResponse.json({ error: 'Failed to create bundle checkout session' }, { status: 500 })
  }
}
