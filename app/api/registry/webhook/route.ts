import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

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
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    // Handle the checkout session completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      // Use service role client to bypass RLS (webhooks have no auth context)
      const supabase = createServiceClient()
      
      const { data: contribution, error: fetchError } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("stripe_checkout_session_id", session.id)
        .single()

      if (fetchError) {
        console.error('Webhook: Error fetching contribution:', fetchError)
        return NextResponse.json({ received: true, error: "Contribution fetch error" })
      }
      
      if (!contribution) {
        console.error('Webhook: Contribution not found for session:', session.id)
        return NextResponse.json({ received: true, error: "Contribution not found" })
      }

      console.log('Webhook: Found contribution:', contribution.id, 'for session:', session.id)

      // Update contribution status
      const { error: updateError } = await supabase
        .from("registry_contributions")
        .update({
          payment_status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", contribution.id)

      if (updateError) {
        console.error('Webhook: Error updating contribution status:', updateError)
      } else {
        console.log('Webhook: Successfully updated contribution status to completed')
      }
      
      const { error: rpcError } = await supabase.rpc('update_registry_item_amount', {
        p_item_id: contribution.custom_registry_item_id,
        p_amount_to_add: contribution.amount
      })

      if (rpcError) {
        console.error('Webhook: Error updating registry item amount:', rpcError)
      } else {
        console.log('Webhook: Successfully updated registry item amount by:', contribution.amount)
      }
    } else {
      console.log('Webhook: Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
