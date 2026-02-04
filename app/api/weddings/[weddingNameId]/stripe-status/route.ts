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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const { weddingNameId } = await params
    const supabase = await createServerSupabaseClient()

    // Get wedding by name ID (public endpoint - no auth required)
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, stripe_account_id, stripe_onboarding_completed, payouts_enabled")
      .eq("wedding_name_id", weddingNameId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json(
        { payoutsEnabled: false },
        { status: 200 } // Return false instead of 404 for public endpoint
      )
    }

    // If no account exists, return false
    if (!wedding.stripe_account_id) {
      return NextResponse.json({
        payoutsEnabled: false,
      })
    }

    // Fetch account details from Stripe to get live status
    const stripe = getStripe()
    try {
      const account = await stripe.accounts.retrieve(wedding.stripe_account_id)
      
      return NextResponse.json({
        payoutsEnabled: account.payouts_enabled || false,
      })
    } catch (stripeError) {
      console.error("Error fetching Stripe account:", stripeError)
      // If Stripe API fails, return database value
      return NextResponse.json({
        payoutsEnabled: wedding.payouts_enabled || false,
      })
    }
  } catch (error) {
    console.error("Error fetching Stripe status:", error)
    return NextResponse.json(
      { payoutsEnabled: false },
      { status: 200 }
    )
  }
}
