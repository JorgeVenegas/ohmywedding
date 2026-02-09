import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
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
    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error("STRIPE_CONNECT_WEBHOOK_SECRET is not configured")
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
      console.error("Invalid webhook signature:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Handle account updated events
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account

      console.log(`Connect webhook: account.updated for ${account.id}`)

      // Check if the account has completed onboarding and can receive payouts
      const chargesEnabled = account.charges_enabled
      const payoutsEnabled = account.payouts_enabled
      const detailsSubmitted = account.details_submitted

      // Update the wedding with the account status
      const { error: updateError } = await supabase
        .from("weddings")
        .update({
          stripe_onboarding_completed: detailsSubmitted,
          payouts_enabled: payoutsEnabled && chargesEnabled,
        })
        .eq("stripe_account_id", account.id)

      if (updateError) {
        console.error("Failed to update wedding Stripe status:", updateError)
      } else {
        console.log(`Updated wedding for account ${account.id}: onboarding=${detailsSubmitted}, payouts=${payoutsEnabled && chargesEnabled}`)
      }
    }

    // Handle account application deauthorized (account disconnected)
    if (event.type === "account.application.deauthorized") {
      const application = event.data.object as Stripe.Application
      const accountId = event.account

      console.log(`Connect webhook: account.application.deauthorized for ${accountId}`)

      if (accountId) {
        // Mark the wedding as no longer having a connected account
        const { error: updateError } = await supabase
          .from("weddings")
          .update({
            stripe_onboarding_completed: false,
            payouts_enabled: false,
          })
          .eq("stripe_account_id", accountId)

        if (updateError) {
          console.error("Failed to update wedding on deauthorization:", updateError)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Connect webhook handler failed:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
