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
    const { itemId, amount, contributorName, contributorEmail, message } = await request.json()

    const normalizedAmount = Number.parseInt(String(amount), 10)
    const normalizedName = typeof contributorName === "string" ? contributorName.trim() : ""

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

    if (!Number.isInteger(normalizedAmount) || normalizedAmount < 10) {
      return NextResponse.json(
        { error: "Amount must be a whole number of at least 10" },
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
      .select("wedding_name_id")
      .eq("id", item.wedding_id)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json(
        { error: "Wedding not found" },
        { status: 404 }
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `${item.title} - Gift Contribution`,
              description: item.description || undefined,
            },
            unit_amount: normalizedAmount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        itemId,
        contributorName: normalizedName,
        contributorEmail: contributorEmail || "",
        message: message || "",
        weddingNameId: wedding.wedding_name_id,
      },
    })
    
    const { error: contributionError } = await supabase
      .from("registry_contributions")
      .insert({
        custom_registry_item_id: itemId,
        wedding_id: item.wedding_id,
        contributor_name: contributorName || null,
        contributor_email: contributorEmail || null,
        amount: normalizedAmount,
        message: message || null,
        stripe_checkout_session_id: session.id,
        payment_status: "pending",
      })

    if (contributionError) {
      // Continue anyway, as the payment session was created
    } else {
    }

    if (contributionError) {
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
