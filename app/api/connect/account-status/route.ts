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

export async function GET(request: NextRequest) {
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

    const weddingId = request.nextUrl.searchParams.get("weddingId")

    if (!weddingId) {
      return NextResponse.json(
        { error: "Wedding ID is required" },
        { status: 400 }
      )
    }

    // Check user owns or collaborates on this wedding
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, owner_id, collaborator_emails, stripe_account_id, stripe_onboarding_completed, payouts_enabled")
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
        { error: "You don't have permission to view this account" },
        { status: 403 }
      )
    }

    // If no account exists, return basic status
    if (!wedding.stripe_account_id) {
      return NextResponse.json({
        stripeAccountId: null,
        onboardingCompleted: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        verificationStatus: 'unverified',
      })
    }

    // Fetch account details from Stripe
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(wedding.stripe_account_id)

    // IMPORTANT: Sync database if Stripe status differs from stored values
    // This ensures the DB stays up-to-date without relying solely on webhooks
    const stripePayoutsEnabled = account.payouts_enabled && account.charges_enabled
    const stripeOnboardingCompleted = account.details_submitted || false
    
    if (wedding.payouts_enabled !== stripePayoutsEnabled || 
        wedding.stripe_onboarding_completed !== stripeOnboardingCompleted) {
      console.log(`Syncing Stripe status for wedding ${weddingId}: payouts=${stripePayoutsEnabled}, onboarding=${stripeOnboardingCompleted}`)
      
      const { error: updateError } = await supabase
        .from("weddings")
        .update({
          stripe_onboarding_completed: stripeOnboardingCompleted,
          payouts_enabled: stripePayoutsEnabled,
        })
        .eq("id", weddingId)
      
      if (updateError) {
        console.error("Failed to sync wedding Stripe status:", updateError)
      }
    }

    return NextResponse.json({
      stripeAccountId: account.id,
      onboardingCompleted: stripeOnboardingCompleted,
      payoutsEnabled: stripePayoutsEnabled,
      chargesEnabled: account.charges_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      verificationStatus: getVerificationStatus(account),
      businessType: account.business_type,
      country: account.country,
      email: account.email,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
      },
    })
  } catch (error) {
    console.error("Error fetching account status:", error)
    return NextResponse.json(
      { error: "Failed to fetch account status" },
      { status: 500 }
    )
  }
}

function getVerificationStatus(account: Stripe.Account): 'unverified' | 'pending' | 'verified' | 'restricted' {
  if (account.payouts_enabled && account.charges_enabled) {
    return 'verified'
  }
  
  if (account.details_submitted && !account.payouts_enabled) {
    return 'pending'
  }

  return 'unverified'
}
