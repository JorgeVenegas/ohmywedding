import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase-server"

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

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables")
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      console.error("No stripe-signature header found")
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    console.log("Webhook received - Event type:", event.type, "Event ID:", event.id)

    // Handle the checkout session completed event
    if (event.type === "checkout.session.completed") {
      console.log("=== PROCESSING CHECKOUT SESSION COMPLETED ===")
      const session = event.data.object as Stripe.Checkout.Session
      console.log("Session ID:", session.id)
      console.log("Session metadata:", JSON.stringify(session.metadata, null, 2))

      const supabase = await createServerSupabaseClient()

      // Update the contribution record
      console.log("Looking for contribution with session ID:", session.id)
      const { data: contribution, error: fetchError } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("stripe_checkout_session_id", session.id)
        .single()

      console.log("Contribution lookup result:", { contribution, fetchError })

      if (fetchError) {
        console.error("Error fetching contribution:", JSON.stringify(fetchError, null, 2))
        return NextResponse.json({ received: true, error: "Contribution fetch error" })
      }
      
      if (!contribution) {
        console.error("No contribution found for session:", session.id)
        console.log("Session metadata:", session.metadata)
        return NextResponse.json({ received: true, error: "Contribution not found" })
      }

      console.log("Found contribution:", contribution.id, "Amount:", contribution.amount)

      // Update contribution status
      const { error: updateError } = await supabase
        .from("registry_contributions")
        .update({
          payment_status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", contribution.id)

      if (updateError) {
        console.error("Error updating contribution status:", updateError)
      } else {
        console.log("Successfully updated contribution status to completed")
      }

      // Update the registry item's current amount using the database function
      console.log("Updating registry item amount for item:", contribution.custom_registry_item_id)
      console.log("Adding amount:", contribution.amount)
      
      const { error: rpcError } = await supabase.rpc('update_registry_item_amount', {
        p_item_id: contribution.custom_registry_item_id,
        p_amount_to_add: contribution.amount
      })

      if (rpcError) {
        console.error("Error calling update_registry_item_amount:", rpcError)
      } else {
        console.log("Successfully updated registry item amount via RPC function")
      }
    } else {
      console.log("Received event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
