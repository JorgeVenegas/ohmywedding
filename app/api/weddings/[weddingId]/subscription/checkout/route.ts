import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { PRICING, type PlanType } from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

const VALID_PLANS = ['premium', 'deluxe'] as const
type ValidPlan = typeof VALID_PLANS[number]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { planType, source, leadId, promotionCodeId, couponId, promoCodeDbId } = await request.json()
    const { weddingId } = await params

    // Validate plan
    if (!VALID_PLANS.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    const validatedPlanType = planType as ValidPlan
    const leadSource = typeof source === 'string' ? source : 'direct'

    // Verify user owns or collaborates on this wedding
    // Support both UUID and wedding_name_id (slug) lookups
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
    const weddingQuery = supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails, wedding_name_id, partner1_first_name, partner2_first_name, wedding_date')

    const { data: wedding, error: weddingError } = isUUID
      ? await weddingQuery.eq('id', weddingId).single()
      : await weddingQuery.eq('wedding_name_id', weddingId).single()

    if (weddingError || !wedding) {
      return NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      )
    }

    // Always use the resolved UUID for downstream operations
    const resolvedWeddingId = wedding.id

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email || '')

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: 'You do not have permission to upgrade this wedding' },
        { status: 403 }
      )
    }

    // Validate plan upgrade - block same or lower plan upgrades
    const PLAN_LEVELS: Record<PlanType, number> = { free: 0, premium: 1, deluxe: 2 }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: currentSub } = await supabaseAdmin
      .from('wedding_subscriptions')
      .select('plan')
      .eq('wedding_id', resolvedWeddingId)
      .maybeSingle()
    
    const currentPlan: PlanType = (currentSub?.plan as PlanType) || 'free'
    const targetPlan: PlanType = validatedPlanType
    
    if (PLAN_LEVELS[targetPlan] <= PLAN_LEVELS[currentPlan]) {
      return NextResponse.json(
        { error: `This wedding is already on the ${currentPlan} plan. You can only upgrade to a higher plan.` },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const stripe = getStripe()
    
    const priceInCents = planType === 'premium' 
      ? PRICING.premium.price_mxn 
      : PRICING.deluxe.price_mxn

    // Create or retrieve Stripe customer (required for customer_balance payment method)
    let customerId: string
    const existingCustomers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          source: 'subscription_upgrade',
          user_id: user.id,
        },
      })
      customerId = newCustomer.id
    }

    // Build couple name display
    const coupleDisplay = wedding.partner1_first_name && wedding.partner2_first_name
      ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
      : wedding.wedding_name_id

    // Build plan details based on plan type
    const planDetails: Record<ValidPlan, { name: string; description: string }> = {
      premium: {
        name: 'OhMyWedding Premium — We do it together',
        description: `Premium wedding website for ${coupleDisplay}. We accompany you from day one with expert guidance. Features: Up to 250 guests, unlimited groups, 1-week activity retention, personalized invitations, registry with secure payouts, and custom domain option.`,
      },
      deluxe: {
        name: 'OhMyWedding Deluxe — We take care of everything',
        description: `Deluxe bespoke wedding website for ${coupleDisplay}. We design and build your entire page with completely personalized, custom-made components and exceptional attention to detail. Includes all Premium features plus unlimited guests, activity retention, dedicated support, and more.`,
      },
    }

    const planInfo = planDetails[validatedPlanType]

    // Build checkout session params
    const checkoutParams: any = {
      customer: customerId,
      payment_method_types: ["customer_balance"],
      payment_method_options: {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: {
            type: "mx_bank_transfer",
          },
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: planInfo.name,
              description: planInfo.description,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        wedding_id: resolvedWeddingId,
        plan_type: validatedPlanType,
        wedding_name_id: wedding.wedding_name_id,
        source: leadSource,
        from_plan: currentPlan,
        ...(couponId ? { coupon_id: couponId } : {}),
        ...(promoCodeDbId ? { promotion_code_id: promoCodeDbId } : {}),
      },
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/upgrade`,
      // Allow users to enter promo codes on Stripe's checkout page as well
      allow_promotion_codes: true,
    }

    // If a specific promotion code was provided (from upgrade page), apply it as a discount
    if (promotionCodeId) {
      checkoutParams.discounts = [{ promotion_code: promotionCodeId }]
      // When using discounts, allow_promotion_codes must be removed
      delete checkoutParams.allow_promotion_codes
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)

    // Update existing order or create a new one (checkout_started stage)
    const paymentIntentId = checkoutSession.payment_intent as string | null

    const orderUpdate = {
      wedding_id: resolvedWeddingId,
      user_id: user.id,
      source: leadSource,
      from_plan: currentPlan,
      to_plan: validatedPlanType,
      stripe_checkout_session_id: checkoutSession.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      amount_cents: priceInCents,
      currency: 'mxn',
      status: 'checkout_started',
      checkout_started_at: new Date().toISOString(),
      metadata: {
        wedding_name_id: wedding.wedding_name_id,
        couple: coupleDisplay,
        ...(couponId ? { coupon_id: couponId } : {}),
        ...(promoCodeDbId ? { promotion_code_id: promoCodeDbId } : {}),
      },
    }

    // If a coupon was applied from the upgrade page, create a redemption record
    if (couponId && promoCodeDbId) {
      try {
        await supabaseAdmin.from('coupon_redemptions').insert({
          coupon_id: couponId,
          promotion_code_id: promoCodeDbId,
          wedding_id: resolvedWeddingId,
          user_id: user.id,
          stripe_checkout_session_id: checkoutSession.id,
          original_amount_cents: priceInCents,
          plan_type: validatedPlanType,
          status: 'applied',
        })
      } catch (redemptionErr) {
        console.error('Error creating coupon redemption record:', redemptionErr)
        // Non-blocking — don't fail the checkout
      }
    }

    if (leadId) {
      // Update the existing order created on page visit
      await supabaseAdmin
        .from('subscription_orders')
        .update(orderUpdate)
        .eq('id', leadId)
        .eq('user_id', user.id)
    } else {
      // Fallback: create a new order if none was passed (direct API call)
      await supabaseAdmin
        .from('subscription_orders')
        .insert({
          ...orderUpdate,
          visited_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
