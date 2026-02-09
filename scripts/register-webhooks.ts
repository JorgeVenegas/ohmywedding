import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { STRIPE_API_VERSION } from "@/lib/stripe-config"

/**
 * Script to register platform webhook on all existing connected Stripe accounts
 * 
 * Run with: npx ts-node scripts/register-webhooks.ts
 * 
 * This script:
 * 1. Fetches all weddings with connected Stripe accounts
 * 2. Checks if the webhook already exists on each account
 * 3. Registers the webhook if it doesn't exist
 * 4. Reports success/failure for each account
 */

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/registry/webhook`
  : "https://ohmy.wedding/api/registry/webhook"

const WEBHOOK_EVENTS = [
  "charge.succeeded",
  "charge.failed",
  "charge.refunded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
] as const

async function registerWebhooksOnExistingAccounts() {
  console.log(`🔧 Starting webhook registration on existing accounts...`)
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`)
  console.log()

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY is not set")
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Supabase environment variables are not set")
    process.exit(1)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as any,
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Fetch all weddings with connected Stripe accounts
  const { data: weddings, error: fetchError } = await supabase
    .from("weddings")
    .select("id, wedding_name_id, stripe_account_id, partner1_first_name, partner2_first_name")
    .not("stripe_account_id", "is", null)

  if (fetchError) {
    console.error("❌ Failed to fetch weddings:", fetchError)
    process.exit(1)
  }

  if (!weddings || weddings.length === 0) {
    console.log("ℹ️  No weddings with connected Stripe accounts found")
    process.exit(0)
  }

  console.log(`📊 Found ${weddings.length} wedding(s) with connected Stripe accounts\n`)

  let successCount = 0
  let alreadyRegisteredCount = 0
  let failureCount = 0

  for (const wedding of weddings) {
    const weddingLabel = `${wedding.partner1_first_name} & ${wedding.partner2_first_name} (${wedding.wedding_name_id})`
    
    try {
      // Check if webhook already exists
      const webhooks = await stripe.webhookEndpoints.list(
        { limit: 100 },
        { stripeAccount: wedding.stripe_account_id }
      )

      const existingWebhook = webhooks.data.find(
        wh => wh.url === WEBHOOK_URL
      )

      if (existingWebhook) {
        console.log(`✅ ${weddingLabel}`)
        console.log(`   └─ Webhook already registered: ${existingWebhook.id}\n`)
        alreadyRegisteredCount++
        continue
      }

      // Register webhook
      const webhook = await stripe.webhookEndpoints.create(
        {
          url: WEBHOOK_URL,
          enabled_events: WEBHOOK_EVENTS as unknown as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
        },
        { stripeAccount: wedding.stripe_account_id }
      )

      console.log(`✅ ${weddingLabel}`)
      console.log(`   └─ Webhook registered: ${webhook.id}\n`)
      successCount++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.log(`❌ ${weddingLabel}`)
      console.log(`   └─ Error: ${errorMessage}\n`)
      failureCount++
    }
  }

  // Summary
  const separator = "=".repeat(60)
  console.log(separator)
  console.log("📋 Summary:")
  console.log(`   ✅ Newly registered: ${successCount}`)
  console.log(`   ℹ️  Already registered: ${alreadyRegisteredCount}`)
  console.log(`   ❌ Failed: ${failureCount}`)
  console.log(`   📊 Total processed: ${successCount + alreadyRegisteredCount + failureCount}`)
  console.log(separator)

  if (failureCount > 0) {
    console.log("\n⚠️  Some accounts failed to register. Please check the errors above.")
    process.exit(1)
  }

  console.log("\n✨ All accounts processed successfully!")
  process.exit(0)
}

registerWebhooksOnExistingAccounts()
