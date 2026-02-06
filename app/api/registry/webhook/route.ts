import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  })
}

// Create a service role client to bypass RLS for webhook updates
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Helper to update registry item's current_amount based on completed contributions
async function updateRegistryItemAmount(supabase: SupabaseClient, itemId: string) {
  const { data: totalData, error: sumError } = await supabase
    .from("registry_contributions")
    .select("amount")
    .eq("custom_registry_item_id", itemId)
    .eq("payment_status", "completed")

  if (sumError) {
    console.error('Webhook: Error calculating total contributions:', sumError)
    return
  }

  const totalAmount = (totalData || []).reduce((sum, c) => sum + Number(c.amount || 0), 0)

  const { error: itemUpdateError } = await supabase
    .from("custom_registry_items")
    .update({
      current_amount: totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)

  if (itemUpdateError) {
    console.error('Webhook: Error updating registry item amount:', itemUpdateError)
  } else {
    console.log(`Webhook: Updated registry item ${itemId} current_amount to ${totalAmount}`)
  }
}

// Helper to log activity for a contribution
async function logContributionActivity(
  supabase: SupabaseClient,
  contribution: { wedding_id: string; contributor_name: string | null; amount: number; custom_registry_item_id: string },
  itemTitle: string | null
) {
  const contributionAmount = Number(contribution.amount || 0)
  const descriptionParts = [
    contribution.contributor_name || 'Someone',
    `contributed $${contributionAmount.toFixed(2)}`,
  ]

  if (itemTitle) {
    descriptionParts.push(`to ${itemTitle}`)
  }

  const { error: activityError } = await supabase.rpc('log_activity', {
    p_wedding_id: contribution.wedding_id,
    p_activity_type: 'registry_contribution',
    p_description: descriptionParts.join(' '),
    p_metadata: {
      amount: contributionAmount,
      itemId: contribution.custom_registry_item_id,
      contributorName: contribution.contributor_name,
      paymentStatus: 'completed',
    },
  })

  if (activityError) {
    console.error('Webhook: Error logging contribution activity:', activityError)
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook: Invalid signature')
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // ====================================================================
    // DIRECT CHARGES WEBHOOK HANDLING
    // ====================================================================
    // With direct charges, the payment goes directly to the connected account.
    // No transfers are needed - the couple receives the money directly.
    // Platform fee is automatically collected via application_fee_amount.
    //
    // Events we handle:
    // 1. application_fee.created - Fee collected when connected account receives payment
    //    (This means the charge succeeded on the connected account)
    // 2. checkout.session.completed - Customer saw bank transfer instructions
    // 3. payment_intent.succeeded - Payment actually received (bank transfer complete)
    // 4. payment_intent.payment_failed - Payment failed
    // ====================================================================

    // Handle application_fee.created - Direct charge succeeded on connected account!
    if (event.type === "application_fee.created") {
      const fee = event.data.object as Stripe.ApplicationFee
      const chargeId = fee.charge as string

      console.log('Webhook: application_fee.created for charge:', chargeId)
      console.log('Webhook: Fee amount:', fee.amount)
      console.log('Webhook: Connected account:', fee.account)

      // Find contribution by charge ID
      const { data: contribution, error: fetchError } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("stripe_charge_id", chargeId)
        .single()

      if (fetchError || !contribution) {
        console.warn('Webhook: Contribution not found for charge:', chargeId)
        // This might be a test charge or other fee, just acknowledge
        return NextResponse.json({ received: true })
      }

      if (contribution.payment_status === "completed") {
        console.log('Webhook: Contribution already completed, skipping for charge:', chargeId)
        return NextResponse.json({ received: true })
      }

      // Mark as completed - payment is now in the couple's connected account!
      await markContributionCompleted(supabase, contribution, chargeId, chargeId)

      console.log('Webhook: SUCCESS - Payment completed and in connected account!')
    }
    // Handle checkout.session.completed - Customer saw bank transfer instructions
    else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('Webhook: checkout.session.completed for session:', session.id)
      console.log('Webhook: Payment status:', session.payment_status)
      console.log('Webhook: Metadata:', session.metadata)
      
      // Find contribution by checkout session ID
      const { data: contribution, error: fetchError } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("stripe_checkout_session_id", session.id)
        .single()

      if (fetchError || !contribution) {
        console.error('Webhook: Contribution not found for session:', session.id)
        return NextResponse.json({ received: true })
      }

      // For bank transfers, payment_status will be "unpaid" at this point
      // The customer has seen the bank details but hasn't transferred yet
      if (session.payment_status === "paid") {
        // Instant payment - mark as completed
        console.log('Webhook: Session already paid, marking as completed')
        await markContributionCompleted(supabase, contribution, session.payment_intent as string)
      } else {
        // Bank transfer - customer saw instructions, awaiting actual transfer
        const { error: updateError } = await supabase
          .from("registry_contributions")
          .update({
            payment_status: "awaiting_transfer",
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", contribution.id)

        if (updateError) {
          console.error('Webhook: Error updating contribution to awaiting_transfer:', updateError)
        } else {
          console.log('Webhook: Updated contribution to awaiting_transfer for session:', session.id)
        }
      }
    }
    
    // Handle payment_intent.succeeded - Actual funds received!
    // This is when the bank transfer is actually completed
    else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('Webhook: payment_intent.succeeded for PI:', paymentIntent.id)
      console.log('Webhook: Amount received:', paymentIntent.amount_received)
      console.log('Webhook: Application fee:', (paymentIntent as any).application_fee_amount)
      
      // Find the contribution by payment intent ID
      let contribution = await findContribution(supabase, stripe, paymentIntent.id)

      if (!contribution) {
        console.error('Webhook: Contribution not found for payment intent:', paymentIntent.id)
        return NextResponse.json({ received: true })
      }

      if (contribution.payment_status === "completed") {
        console.log('Webhook: Contribution already completed, skipping for PI:', paymentIntent.id)
        return NextResponse.json({ received: true })
      }

      // Mark as completed - payment is now in the couple's connected account!
      await markContributionCompleted(supabase, contribution, paymentIntent.id)
      
      console.log('Webhook: SUCCESS - Payment completed and in connected account!')
    }
    
    // Handle payment_intent.payment_failed - Bank transfer failed or expired
    else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('Webhook: payment_intent.payment_failed for PI:', paymentIntent.id)
      
      const { error: updateError } = await supabase
        .from("registry_contributions")
        .update({
          payment_status: "failed",
        })
        .eq("stripe_payment_intent_id", paymentIntent.id)

      if (updateError) {
        console.error('Webhook: Error updating contribution to failed:', updateError)
      } else {
        console.log('Webhook: Updated contribution to failed for PI:', paymentIntent.id)
      }
    }
    
    else {
      console.log('Webhook: Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook: Handler error:', error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

// Find contribution by payment intent ID, with fallback to checkout session lookup
async function findContribution(
  supabase: SupabaseClient,
  stripe: Stripe,
  paymentIntentId: string
) {
  // Try finding by payment intent ID first
  const { data: contributionByPI } = await supabase
    .from("registry_contributions")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single()
  
  if (contributionByPI) {
    return contributionByPI
  }

  // Fallback: look up the checkout session
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    })
    
    if (sessions.data.length > 0) {
      const checkoutSession = sessions.data[0]
      console.log('Webhook: Found checkout session:', checkoutSession.id)
      
      const { data: contributionBySession } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("stripe_checkout_session_id", checkoutSession.id)
        .single()
      
      if (contributionBySession) {
        console.log('Webhook: Found contribution by checkout session:', contributionBySession.id)
        return contributionBySession
      }
    }
  } catch (err) {
    console.warn('Webhook: Error looking up checkout session:', err)
  }

  return null
}

// Mark a contribution as completed and update related records
async function markContributionCompleted(
  supabase: SupabaseClient,
  contribution: {
    id: string
    wedding_id: string
    contributor_name: string | null
    amount: number
    custom_registry_item_id: string
  },
  paymentIntentId: string,
  chargeId?: string
) {
  console.log('Webhook: Marking contribution as completed:', contribution.id)
  
  // Get item title for activity log
  const { data: item } = await supabase
    .from("custom_registry_items")
    .select("title")
    .eq("id", contribution.custom_registry_item_id)
    .single()

  // Update contribution status to completed
  const updateData: any = {
    payment_status: "completed",
    stripe_payment_intent_id: paymentIntentId,
  }

  // Store charge ID if provided (for direct charges)
  if (chargeId) {
    updateData.stripe_charge_id = chargeId
  }

  const { error: updateError } = await supabase
    .from("registry_contributions")
    .update(updateData)
    .eq("id", contribution.id)

  if (updateError) {
    console.error('Webhook: Error updating contribution to completed:', updateError)
    return
  }
  
  console.log('Webhook: Successfully updated contribution to completed')
  
  // Update registry item's current_amount
  await updateRegistryItemAmount(supabase, contribution.custom_registry_item_id)
  
  // Log activity
  await logContributionActivity(supabase, contribution, item?.title || null)
}
