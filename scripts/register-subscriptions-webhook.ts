import Stripe from "stripe"

/**
 * Script to register the subscriptions webhook on your main Stripe account
 * 
 * Run with: npx ts-node scripts/register-subscriptions-webhook.ts
 * 
 * This script:
 * 1. Checks if the webhooks endpoint already exists
 * 2. Creates it if it doesn't exist
 * 3. Outputs the signing secret for .env.local
 */

const STRIPE_API_VERSION = '2026-01-28.clover'

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/webhook`
  : "https://ohmy.wedding/api/subscriptions/webhook"

const WEBHOOK_EVENTS = [
  "payment_intent.created",
  "payment_intent.requires_action",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
] as const

async function registerSubscriptionsWebhook() {
  console.log(`🔧 Starting subscriptions webhook registration...`)
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`)
  console.log()

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY is not set")
    process.exit(1)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as any,
  })

  try {
    // Check if webhook already exists
    const webhooks = await stripe.webhookEndpoints.list({
      limit: 100,
    })

    const existingWebhook = webhooks.data.find(
      (wh) => wh.url === WEBHOOK_URL && 
              wh.enabled_events.includes("checkout.session.completed")
    )

    if (existingWebhook) {
      console.log(`✅ Subscriptions webhook already registered`)
      console.log(`   └─ Endpoint ID: ${existingWebhook.id}`)
      console.log()
      console.log(`📝 Your webhook signing secret:`)
      console.log(`   Add this to your .env.local:`)
      console.log()
      console.log(`   STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET=${process.env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET || "YOUR_SECRET_HERE"}`)
      console.log()
      process.exit(0)
    }

    // Register webhook
    console.log(`📝 Creating new subscriptions webhook endpoint...`)
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: WEBHOOK_EVENTS as unknown as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
    })

    console.log(`✅ Subscriptions webhook registered successfully!`)
    console.log()
    console.log(`📋 Details:`)
    console.log(`   └─ Endpoint ID: ${webhook.id}`)
    console.log(`   └─ URL: ${webhook.url}`)
    console.log()
    console.log(`📝 Your webhook signing secret:`)
    console.log(`   Add this to your .env.local:`)
    console.log()
    console.log(`   STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET=${webhook.secret}`)
    console.log()
    console.log(`🎯 Next steps:`)
    console.log(`   1. Copy the secret above`)
    console.log(`   2. Add it to your .env.local file`)
    console.log(`   3. Restart your dev server or webhook listener`)
    console.log()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`❌ Failed to register webhook: ${errorMessage}`)
    process.exit(1)
  }
}

registerSubscriptionsWebhook()
