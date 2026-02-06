import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { getRegistryCommission } from "@/lib/subscription"

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

// Create a service role client to bypass RLS for inserting contributions
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { itemId, amount, contributorName, contributorEmail, message, coverCommission } = await request.json()

    const normalizedAmount = Number.parseInt(String(amount), 10)
    const normalizedName = typeof contributorName === "string" ? contributorName.trim() : ""
    const guestCoversFee = typeof coverCommission === "boolean" ? coverCommission : false

    if (!itemId || Number.isNaN(normalizedAmount)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!normalizedName) {
      return NextResponse.json(
        { error: "Contributor name is required" },
        { status: 400 }
      )
    }

    if (!Number.isInteger(normalizedAmount) || normalizedAmount < 20) {
      return NextResponse.json(
        { error: "Amount must be a whole number of at least 20 (to cover the platform fee)" },
        { status: 400 }
      )
    }

    // Check Stripe key
    const stripe = getStripe()

    // Get the registry item details
    const supabase = await createServerSupabaseClient()
    
    const { data: item, error } = await supabase
      .from("custom_registry_items")
      .select("*")
      .eq("id", itemId)
      .single()

    if (error || !item) {
      return NextResponse.json(
        { error: "Registry item not found" },
        { status: 404 }
      )
    }

    // Get the current wedding_name_id from the weddings table
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("wedding_name_id, stripe_account_id, payouts_enabled")
      .eq("id", item.wedding_id)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json(
        { error: "Wedding not found" },
        { status: 404 }
      )
    }

    // CRITICAL: Only allow payments to connected Stripe accounts, never to main account
    // Check if the couple has a connected Stripe account
    if (!wedding.stripe_account_id || wedding.stripe_account_id.trim() === "") {
      return NextResponse.json(
        { 
          error: "This couple has not yet set up payment processing. Please ask them to complete their Stripe setup in the registry settings.",
          code: "NO_STRIPE_ACCOUNT"
        },
        { status: 400 }
      )
    }

    // Verify the connected account has payouts enabled
    let stripeAccount
    try {
      stripeAccount = await stripe.accounts.retrieve(wedding.stripe_account_id)
      
      if (!stripeAccount.payouts_enabled) {
        console.warn(`Payouts disabled for account ${wedding.stripe_account_id}`)
        return NextResponse.json(
          { 
            error: "This couple's payment account is not yet fully set up. Please ask them to complete their verification.",
            code: "PAYOUTS_NOT_ENABLED"
          },
          { status: 400 }
        )
      }

      // Double-check account is in good standing
      if (stripeAccount.charges_enabled === false) {
        console.warn(`Charges disabled for account ${wedding.stripe_account_id}`)
        return NextResponse.json(
          { 
            error: "This couple's payment account is restricted and cannot receive payments.",
            code: "CHARGES_DISABLED"
          },
          { status: 400 }
        )
      }
    } catch (stripeError) {
      console.error("Error verifying Stripe account:", stripeError)
      return NextResponse.json(
        { 
          error: "Unable to verify payment account. Please try again.",
          code: "STRIPE_VERIFICATION_ERROR"
        },
        { status: 400 }
      )
    }

    // Get base URL from request headers (works in all environments)
    const host = request.headers.get('host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'http'

    // Detect subdomain to avoid duplicating the wedding id in the path
    const hostnameOnly = host.split(':')[0]
    const isSubdomain = hostnameOnly.endsWith('.ohmy.local') || hostnameOnly.endsWith('.ohmy.wedding')
    const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
    const pathPrefix = isSubdomain ? '' : `/${encodeURIComponent(wedding.wedding_name_id)}`
    const baseUrl = `${protocol}://${hostnameOnly}${port}`
    
    const successUrl = `${baseUrl}${pathPrefix}/registry?success=true`
    const cancelUrl = `${baseUrl}${pathPrefix}/registry?canceled=true`

    // ====================================================================
    // FEE CALCULATION (Dynamic based on wedding plan)
    // ====================================================================
    // Total deduction from couple = Commission from plan_features table
    // Premium: 20 MXN, Deluxe: 10 MXN
    // 
    // Stripe cuts 8.12 MXN (Stripe fees + IVA) - constant
    // Platform keeps the rest (commission - Stripe fees)
    // ====================================================================
    
    // Get commission from plan_features table based on wedding's plan
    const COMMISSION_CENTAVOS = await getRegistryCommission(item.wedding_id)
    const STRIPE_FEE_CENTAVOS = 812 // 8.12 MXN (Stripe fees + IVA) - constant
    const PLATFORM_COMMISSION_CENTAVOS = Math.max(0, COMMISSION_CENTAVOS - STRIPE_FEE_CENTAVOS)
    
    const amountInCentavos = normalizedAmount * 100

    // Calculate total amount the guest pays and what couple receives
    let totalAmountCentavos: number
    let coupleReceivesCentavos: number

    if (guestCoversFee) {
      // Guest covers fee: guest pays amount + fee, couple gets full amount
      totalAmountCentavos = amountInCentavos + COMMISSION_CENTAVOS
      coupleReceivesCentavos = amountInCentavos
    } else {
      // Fee deducted from gift: guest pays amount, couple gets amount - fee
      totalAmountCentavos = amountInCentavos
      coupleReceivesCentavos = amountInCentavos - COMMISSION_CENTAVOS
    }
    
    console.log(`Checkout: Fee breakdown - Total commission: ${COMMISSION_CENTAVOS/100} MXN, Stripe+IVA: 8.12 MXN, Platform: ${PLATFORM_COMMISSION_CENTAVOS/100} MXN`)

    // ====================================================================
    // DIRECT CHARGES ON CONNECTED ACCOUNT
    // ====================================================================
    // Create the checkout session directly on the connected account.
    // The payment goes DIRECTLY to the couple's Stripe account.
    // Platform collects the fee via application_fee_amount.
    // 
    // This approach:
    // - Payment lands directly in couple's account (no transfer needed)
    // - Platform automatically receives the application fee
    // - Works with bank transfers (SPEI/customer_balance)
    // ====================================================================

    // Create customer on the CONNECTED account (not platform)
    let customerId: string
    
    // Search for existing customer on connected account or create new one
    if (contributorEmail) {
      const existingCustomers = await stripe.customers.list(
        { email: contributorEmail, limit: 1 },
        { stripeAccount: wedding.stripe_account_id }
      )
      
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const newCustomer = await stripe.customers.create(
          {
            email: contributorEmail,
            name: normalizedName || undefined,
            metadata: {
              source: "registry_contribution",
              weddingNameId: wedding.wedding_name_id,
            },
          },
          { stripeAccount: wedding.stripe_account_id }
        )
        customerId = newCustomer.id
      }
    } else {
      // Create anonymous customer on connected account
      const newCustomer = await stripe.customers.create(
        {
          name: normalizedName || "Anonymous Contributor",
          metadata: {
            source: "registry_contribution",
            weddingNameId: wedding.wedding_name_id,
            anonymous: "true",
          },
        },
        { stripeAccount: wedding.stripe_account_id }
      )
      customerId = newCustomer.id
    }

    // Create checkout session on the CONNECTED ACCOUNT
    // Payment goes directly to couple, platform gets application_fee_amount
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        payment_method_types: ["customer_balance"],
        payment_method_options: {
          customer_balance: {
            funding_type: "bank_transfer",
            bank_transfer: {
              type: "mx_bank_transfer", // SPEI for Mexico
            },
          },
        },
        line_items: [
          {
            price_data: {
              currency: "mxn",
              product_data: {
                name: `${item.title} - Gift Contribution`,
                description: item.description || undefined,
              },
              unit_amount: totalAmountCentavos,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        // Platform takes our commission (after Stripe fees are deducted by Stripe)
        // This ensures total deduction from couple = exactly 20 MXN
        payment_intent_data: {
          application_fee_amount: PLATFORM_COMMISSION_CENTAVOS,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          itemId,
          contributorName: normalizedName,
          contributorEmail: contributorEmail || "",
          message: message || "",
          weddingNameId: wedding.wedding_name_id,
          weddingId: item.wedding_id,
          connectedAccountId: wedding.stripe_account_id,
          totalFee: String(COMMISSION_CENTAVOS),
          stripeFee: String(STRIPE_FEE_CENTAVOS),
          ourCommission: String(PLATFORM_COMMISSION_CENTAVOS),
          coupleReceives: String(coupleReceivesCentavos),
          guestCoversFee: String(guestCoversFee),
          totalAmount: String(totalAmountCentavos),
        },
      },
      // THIS IS THE KEY: Create session on the connected account
      { stripeAccount: wedding.stripe_account_id }
    )
    
    console.log(`Checkout: Created session ${session.id} on connected account ${wedding.stripe_account_id}`)
    console.log(`Checkout: Total paid: ${totalAmountCentavos}, Couple receives: ${coupleReceivesCentavos}, Stripe+IVA: ${STRIPE_FEE_CENTAVOS}, Our commission: ${PLATFORM_COMMISSION_CENTAVOS}`)
    
    // Use service role client to insert contribution (bypasses RLS for public contributions)
    const serviceSupabase = createServiceClient()
    
    const { error: contributionError, data: contribution } = await serviceSupabase
      .from("registry_contributions")
      .insert({
        custom_registry_item_id: itemId,
        wedding_id: item.wedding_id,
        contributor_name: contributorName || null,
        contributor_email: contributorEmail || null,
        amount: coupleReceivesCentavos / 100, // Store what the couple actually receives
        message: message || null,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null,
        payment_status: "pending",
        guest_covers_fee: guestCoversFee,
      })
      .select()
      .single()

    if (contributionError) {
      console.error("Checkout: Error creating contribution:", contributionError)
      console.error("Checkout: Insert details:", {
        itemId,
        wedding_id: item.wedding_id,
        session_id: session.id,
        payment_intent: session.payment_intent,
      })
      // Continue anyway, as the payment session was created
    } else {
      console.log(`Checkout: Created contribution ${contribution?.id} for session ${session.id}`)
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    )
  }
}
