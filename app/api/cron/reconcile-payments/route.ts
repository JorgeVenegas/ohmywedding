import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { STRIPE_API_VERSION } from "@/lib/stripe-config"
import { getRegistryCommission } from "@/lib/subscription"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Cron job: Reconcile partially funded SPEI contributions
 * Runs daily at 18:30 UTC (configured in vercel.json)
 *
 * Phase A — Partial payments:
 * For contributions stuck in "partially_funded" for over WAIT_HOURS:
 * 1. Cancel the original payment intent (releases the partial hold)
 * 2. Create a new payment intent for the amount actually received
 * 3. Confirm the new PI using the customer's cash balance
 * 4. Update the contribution with the new PI and adjusted amount
 *
 * Phase B — Excess balance sweep:
 * For customers on connected accounts who have overpaid:
 * 1. Detect negative cash_balance (credit = overpayment)
 * 2. Create a new PI + contribution for the excess amount
 * 3. Confirm it using the customer's cash balance
 *
 * Note: Stripe cash_balance uses NEGATIVE values for credit (available funds).
 * A balance of -5000 means the customer has 50 MXN available.
 */

const WAIT_HOURS = Number(process.env.PARTIAL_PAYMENT_WAIT_HOURS || 24)
const STRIPE_FEE_CENTAVOS = 812 // 8.12 MXN (Stripe fees + IVA) - constant

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

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
    console.error("Reconcile: Error calculating total contributions:", sumError)
    return
  }

  const totalAmount = (totalData || []).reduce((sum, c) => sum + Number(c.amount || 0), 0)

  await supabase
    .from("custom_registry_items")
    .update({
      current_amount: totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
}

// Helper to log activity for a contribution
async function logContributionActivity(
  supabase: SupabaseClient,
  contribution: { wedding_id: string; contributor_name: string | null; amount: number; custom_registry_item_id: string },
  itemTitle: string | null
) {
  const contributionAmount = Number(contribution.amount || 0)
  const descriptionParts = [
    contribution.contributor_name || "Someone",
    `contributed $${contributionAmount.toFixed(2)}`,
  ]
  if (itemTitle) {
    descriptionParts.push(`to ${itemTitle}`)
  }

  await supabase.rpc("log_activity", {
    p_wedding_id: contribution.wedding_id,
    p_activity_type: "registry_contribution",
    p_description: descriptionParts.join(" "),
    p_metadata: {
      amount: contributionAmount,
      itemId: contribution.custom_registry_item_id,
      contributorName: contribution.contributor_name,
      paymentStatus: "completed",
      reconciled: true,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Reconcile: Unauthorized attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stripe = getStripe()
    const supabase = createServiceClient()

    const results = {
      phaseA: { processed: 0, reconciled: 0, errors: [] as string[] },
      phaseB: { processed: 0, swept: 0, errors: [] as string[] },
    }

    // ================================================================
    // PHASE A: Reconcile partially funded contributions
    // ================================================================
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - WAIT_HOURS)
    const cutoffISO = cutoffDate.toISOString()

    console.log(`Reconcile: Phase A — Looking for partially_funded contributions older than ${WAIT_HOURS}h (before ${cutoffISO})`)

    const { data: partialContributions, error: fetchErr } = await supabase
      .from("registry_contributions")
      .select("*")
      .eq("payment_status", "partially_funded")
      .lt("created_at", cutoffISO)

    if (fetchErr) {
      console.error("Reconcile: Error fetching partially funded contributions:", fetchErr)
      return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 })
    }

    console.log(`Reconcile: Found ${partialContributions?.length || 0} partially funded contribution(s) to process`)

    for (const contribution of partialContributions || []) {
      results.phaseA.processed++
      const contribLabel = `${contribution.id} (PI: ${contribution.stripe_payment_intent_id})`

      try {
        if (!contribution.stripe_payment_intent_id) {
          console.warn(`Reconcile: Contribution ${contribution.id} has no PI — skipping`)
          results.phaseA.errors.push(`${contribution.id}: no payment intent`)
          continue
        }

        // Get the connected account from the wedding
        const { data: wedding } = await supabase
          .from("weddings")
          .select("stripe_account_id")
          .eq("id", contribution.wedding_id)
          .single()

        if (!wedding?.stripe_account_id) {
          console.warn(`Reconcile: Wedding ${contribution.wedding_id} has no Stripe account — skipping`)
          results.phaseA.errors.push(`${contribution.id}: wedding has no stripe account`)
          continue
        }

        const connectedAccountId = wedding.stripe_account_id

        // Retrieve the original PI to get actual received amount
        const originalPI = await stripe.paymentIntents.retrieve(
          contribution.stripe_payment_intent_id,
          {},
          { stripeAccount: connectedAccountId }
        )

        const amountReceived = originalPI.amount_received
        const amountRequested = originalPI.amount

        if (amountReceived <= 0) {
          console.log(`Reconcile: ${contribLabel} has $0 received — marking as incomplete`)
          await supabase
            .from("registry_contributions")
            .update({ payment_status: "incomplete" })
            .eq("id", contribution.id)
          continue
        }

        if (amountReceived >= amountRequested) {
          // Already fully funded — this shouldn't happen but handle it
          console.log(`Reconcile: ${contribLabel} is already fully funded — skipping`)
          continue
        }

        console.log(`Reconcile: ${contribLabel} — received ${amountReceived}/${amountRequested} centavos`)

        // Step 1: Cancel the original PI
        try {
          await stripe.paymentIntents.cancel(
            contribution.stripe_payment_intent_id,
            {},
            { stripeAccount: connectedAccountId }
          )
          console.log(`Reconcile: Cancelled original PI ${contribution.stripe_payment_intent_id}`)
        } catch (cancelErr: any) {
          // If already canceled, that's fine
          if (cancelErr?.code !== "payment_intent_unexpected_state") {
            throw cancelErr
          }
          console.log(`Reconcile: Original PI was already cancelled`)
        }

        // Step 2: Calculate the commission for the received amount
        const commissionCentavos = await getRegistryCommission(contribution.wedding_id)
        const platformCommission = Math.max(0, commissionCentavos - STRIPE_FEE_CENTAVOS)

        // The received amount is what the customer actually transferred.
        // We need to deduct the commission to get what the couple receives.
        const coupleReceivesCentavos = Math.max(0, amountReceived - commissionCentavos)

        if (coupleReceivesCentavos <= 0) {
          console.warn(`Reconcile: ${contribLabel} — received amount (${amountReceived}) doesn't cover commission (${commissionCentavos}) — marking as incomplete`)
          await supabase
            .from("registry_contributions")
            .update({ payment_status: "incomplete" })
            .eq("id", contribution.id)
          continue
        }

        // Step 3: Create a new PI for the received amount
        const customerId = contribution.stripe_customer_id || (typeof originalPI.customer === 'string' ? originalPI.customer : null)

        if (!customerId) {
          console.warn(`Reconcile: ${contribLabel} has no customer ID — skipping`)
          results.phaseA.errors.push(`${contribution.id}: no customer ID`)
          continue
        }

        // Verify the customer actually has enough cash balance to cover the new PI
        const customerForBalance = await stripe.customers.retrieve(
          customerId,
          { expand: ["cash_balance"] },
          { stripeAccount: connectedAccountId }
        ) as Stripe.Customer
        const availableBalance = customerForBalance.cash_balance?.available?.mxn || 0
        if (availableBalance < amountReceived) {
          console.warn(`Reconcile: ${contribLabel} — customer balance (${availableBalance}) insufficient for new PI (${amountReceived}) — skipping`)
          results.phaseA.errors.push(`${contribution.id}: insufficient customer balance`)
          continue
        }

        const newPI = await stripe.paymentIntents.create(
          {
            amount: amountReceived,
            currency: "mxn",
            customer: customerId,
            payment_method_types: ["customer_balance"],
            payment_method_data: {
              type: "customer_balance",
            },
            application_fee_amount: Math.min(platformCommission, amountReceived),
            confirm: true,
            description: `Reconciled partial payment for contribution ${contribution.id}`,
            metadata: {
              originalPaymentIntentId: contribution.stripe_payment_intent_id,
              contributionId: contribution.id,
              reconciled: "true",
              weddingId: contribution.wedding_id,
            },
          },
          { stripeAccount: connectedAccountId }
        )

        console.log(`Reconcile: Created new PI ${newPI.id} for ${amountReceived} centavos (status: ${newPI.status})`)

        // Step 4: Update the contribution
        const updateData: Record<string, unknown> = {
          stripe_payment_intent_id: newPI.id,
          amount: coupleReceivesCentavos / 100,
          original_requested_amount: contribution.original_requested_amount || (amountRequested / 100),
        }

        if (newPI.status === "succeeded") {
          updateData.payment_status = "completed"
          if (newPI.latest_charge) {
            updateData.stripe_charge_id = typeof newPI.latest_charge === 'string' ? newPI.latest_charge : null
          }
        } else {
          updateData.payment_status = "processing"
        }

        const { error: updateErr } = await supabase
          .from("registry_contributions")
          .update(updateData)
          .eq("id", contribution.id)

        if (updateErr) {
          console.error(`Reconcile: Error updating contribution ${contribution.id}:`, updateErr)
          results.phaseA.errors.push(`${contribution.id}: update error — ${updateErr.message}`)
          continue
        }

        // If payment succeeded immediately, update the registry item totals
        if (newPI.status === "succeeded") {
          await updateRegistryItemAmount(supabase, contribution.custom_registry_item_id)
          const { data: item } = await supabase
            .from("custom_registry_items")
            .select("title")
            .eq("id", contribution.custom_registry_item_id)
            .single()
          await logContributionActivity(
            supabase,
            { ...contribution, amount: coupleReceivesCentavos / 100 },
            item?.title || null
          )
        }

        results.phaseA.reconciled++
        console.log(`Reconcile: Successfully reconciled ${contribLabel} — couple receives $${(coupleReceivesCentavos / 100).toFixed(2)}`)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error"
        console.error(`Reconcile: Error processing ${contribLabel}:`, errMsg)
        results.phaseA.errors.push(`${contribution.id}: ${errMsg}`)
      }
    }

    // ================================================================
    // PHASE B: Sweep excess customer balances
    // ================================================================
    console.log("Reconcile: Phase B — Sweeping excess customer balances")

    // Find completed contributions with a stripe_customer_id from the last 7 days
    // (excess balance is typically swept quickly; very old contributions are unlikely to have remaining balance)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: completedWithCustomer, error: customerFetchErr } = await supabase
      .from("registry_contributions")
      .select("stripe_customer_id, wedding_id, custom_registry_item_id, contributor_name")
      .eq("payment_status", "completed")
      .not("stripe_customer_id", "is", null)
      .gte("created_at", sevenDaysAgo.toISOString())

    if (customerFetchErr) {
      console.error("Reconcile: Error fetching completed contributions for sweep:", customerFetchErr)
    }

    // Deduplicate by wedding_id + customer_id
    const customerMap = new Map<string, {
      customerId: string
      weddingId: string
      itemId: string
      contributorName: string | null
    }>()

    for (const c of completedWithCustomer || []) {
      const key = `${c.wedding_id}::${c.stripe_customer_id}`
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: c.stripe_customer_id,
          weddingId: c.wedding_id,
          itemId: c.custom_registry_item_id,
          contributorName: c.contributor_name,
        })
      }
    }

    console.log(`Reconcile: Checking ${customerMap.size} unique customer-wedding pair(s)`)

    for (const [key, info] of customerMap) {
      results.phaseB.processed++

      try {
        const { data: wedding } = await supabase
          .from("weddings")
          .select("stripe_account_id")
          .eq("id", info.weddingId)
          .single()

        if (!wedding?.stripe_account_id) continue

        const connectedAccountId = wedding.stripe_account_id

        // Check customer cash balance on the connected account
        const customer = await stripe.customers.retrieve(
          info.customerId,
          { expand: ["cash_balance"] },
          { stripeAccount: connectedAccountId }
        ) as Stripe.Customer

        const mxnBalance = customer.cash_balance?.available?.mxn || 0

        // Positive available balance = customer has funds sitting (overpayment)
        if (mxnBalance <= 0) continue

        const excessCentavos = mxnBalance

        // Only sweep if the excess is meaningful (more than 1 MXN)
        if (excessCentavos < 100) {
          console.log(`Reconcile: Customer ${info.customerId} has trivial excess (${excessCentavos} centavos) — skipping`)
          continue
        }

        console.log(`Reconcile: Customer ${info.customerId} has excess of ${excessCentavos} centavos on ${connectedAccountId}`)

        // Calculate commission for the excess
        const commissionCentavos = await getRegistryCommission(info.weddingId)
        const platformCommission = Math.max(0, commissionCentavos - STRIPE_FEE_CENTAVOS)

        // Only deduct commission if excess is larger than commission
        const effectiveCommission = excessCentavos > commissionCentavos ? platformCommission : 0
        const coupleReceives = excessCentavos - (excessCentavos > commissionCentavos ? commissionCentavos : 0)

        if (coupleReceives <= 0) {
          console.log(`Reconcile: Excess (${excessCentavos}) doesn't cover commission — skipping`)
          continue
        }

        // Create a PI to sweep the excess
        const sweepPI = await stripe.paymentIntents.create(
          {
            amount: excessCentavos,
            currency: "mxn",
            customer: info.customerId,
            payment_method_types: ["customer_balance"],
            payment_method_data: {
              type: "customer_balance",
            },
            application_fee_amount: effectiveCommission,
            confirm: true,
            description: `Excess balance sweep for customer ${info.customerId}`,
            metadata: {
              sweep: "true",
              weddingId: info.weddingId,
            },
          },
          { stripeAccount: connectedAccountId }
        )

        console.log(`Reconcile: Sweep PI ${sweepPI.id} created (status: ${sweepPI.status})`)

        // Find the most recent completed contribution for this customer to get the item
        const { data: recentContrib } = await supabase
          .from("registry_contributions")
          .select("id, custom_registry_item_id")
          .eq("wedding_id", info.weddingId)
          .eq("stripe_customer_id", info.customerId)
          .eq("payment_status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const parentContributionId = recentContrib?.id || null
        const registryItemId = recentContrib?.custom_registry_item_id || info.itemId

        // Create a new contribution for the swept amount
        const { error: insertErr, data: newContrib } = await supabase
          .from("registry_contributions")
          .insert({
            custom_registry_item_id: registryItemId,
            wedding_id: info.weddingId,
            contributor_name: info.contributorName,
            amount: coupleReceives / 100,
            stripe_payment_intent_id: sweepPI.id,
            stripe_customer_id: info.customerId,
            stripe_charge_id: typeof sweepPI.latest_charge === 'string' ? sweepPI.latest_charge : null,
            payment_status: sweepPI.status === "succeeded" ? "completed" : "processing",
            parent_contribution_id: parentContributionId,
            original_requested_amount: excessCentavos / 100,
          })
          .select()
          .single()

        if (insertErr) {
          console.error(`Reconcile: Error creating sweep contribution:`, insertErr)
          results.phaseB.errors.push(`${key}: insert error — ${insertErr.message}`)
          continue
        }

        // Update registry item total if payment succeeded
        if (sweepPI.status === "succeeded" && newContrib) {
          await updateRegistryItemAmount(supabase, registryItemId)
          const { data: item } = await supabase
            .from("custom_registry_items")
            .select("title")
            .eq("id", registryItemId)
            .single()
          await logContributionActivity(
            supabase,
            { ...newContrib, amount: coupleReceives / 100 },
            item?.title || null
          )
        }

        results.phaseB.swept++
        console.log(`Reconcile: Swept ${excessCentavos} centavos for customer ${info.customerId} — couple receives $${(coupleReceives / 100).toFixed(2)}`)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error"
        console.error(`Reconcile: Error sweeping ${key}:`, errMsg)
        results.phaseB.errors.push(`${key}: ${errMsg}`)
      }
    }

    // ================================================================
    // Summary
    // ================================================================
    console.log("Reconcile: === SUMMARY ===")
    console.log(`Reconcile: Phase A — ${results.phaseA.reconciled}/${results.phaseA.processed} reconciled`)
    console.log(`Reconcile: Phase B — ${results.phaseB.swept}/${results.phaseB.processed} swept`)
    if (results.phaseA.errors.length > 0) console.log("Reconcile: Phase A errors:", results.phaseA.errors)
    if (results.phaseB.errors.length > 0) console.log("Reconcile: Phase B errors:", results.phaseB.errors)

    return NextResponse.json({
      success: true,
      phaseA: {
        processed: results.phaseA.processed,
        reconciled: results.phaseA.reconciled,
        errors: results.phaseA.errors.length,
      },
      phaseB: {
        processed: results.phaseB.processed,
        swept: results.phaseB.swept,
        errors: results.phaseB.errors.length,
      },
    })
  } catch (error) {
    console.error("Reconcile: Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
