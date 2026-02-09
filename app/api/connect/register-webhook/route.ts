import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { STRIPE_API_VERSION } from "@/lib/stripe-config"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { weddingId } = await request.json()

    if (!weddingId) {
      return NextResponse.json(
        { error: "Wedding ID is required" },
        { status: 400 }
      )
    }

    // Check user owns or collaborates on this wedding
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, owner_id, collaborator_emails, stripe_account_id")
      .eq("id", weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json(
        { error: "Wedding not found" },
        { status: 404 }
      )
    }

    // Verify ownership or collaboration
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email || "")
    
    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: "You don't have permission to manage this wedding" },
        { status: 403 }
      )
    }

    // Check if account is connected
    if (!wedding.stripe_account_id || wedding.stripe_account_id.trim() === "") {
      return NextResponse.json(
        { error: "No Stripe account connected" },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const webhookUrl = new URL("/api/registry/webhook", request.url).toString()

    // Check if webhook already exists on this account
    let existingWebhooks: Stripe.WebhookEndpoint[] = []
    try {
      const webhooks = await stripe.webhookEndpoints.list(
        { limit: 100 },
        { stripeAccount: wedding.stripe_account_id }
      )
      existingWebhooks = webhooks.data.filter(
        wh => wh.url === webhookUrl
      )
    } catch (err) {
      console.warn(`Failed to list webhooks for account ${wedding.stripe_account_id}:`, err)
    }

    // If webhook already exists, return success
    if (existingWebhooks.length > 0) {
      console.log(`Webhook already registered on account ${wedding.stripe_account_id}`)
      return NextResponse.json({
        success: true,
        message: "Webhook already registered on this account",
        webhookId: existingWebhooks[0].id,
      })
    }

    // Register webhook on the connected account
    try {
      const webhook = await stripe.webhookEndpoints.create(
        {
          url: webhookUrl,
          enabled_events: [
            "charge.succeeded",
            "charge.failed",
            "charge.refunded",
            "payment_intent.succeeded",
            "payment_intent.payment_failed",
          ],
        },
        { stripeAccount: wedding.stripe_account_id }
      )

      console.log(`Successfully registered webhook ${webhook.id} on account ${wedding.stripe_account_id}`)

      return NextResponse.json({
        success: true,
        message: "Webhook successfully registered",
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.enabled_events,
      })
    } catch (stripeError) {
      console.error(`Failed to register webhook on account ${wedding.stripe_account_id}:`, stripeError)
      
      const errorMessage = stripeError instanceof Error ? stripeError.message : "Unknown error"
      
      return NextResponse.json(
        { 
          error: "Failed to register webhook",
          details: errorMessage
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in register-webhook:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to register webhook: ${errorMessage}` },
      { status: 500 }
    )
  }
}
