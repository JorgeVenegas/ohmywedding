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
      .select("id, owner_id, collaborator_emails, stripe_account_id, partner1_first_name, partner2_first_name")
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

    // Check if account already exists
    if (wedding.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe account already connected", accountId: wedding.stripe_account_id },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Create Express connected account for Mexico
    const account = await stripe.accounts.create({
      type: "express",
      country: "MX",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        mx_bank_transfer_payments: { requested: true }, // Enable SPEI bank transfers
      },
      business_type: "individual",
      metadata: {
        weddingId,
        weddingName: `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
      },
    })

    // Store the account ID in the weddings table
    const { error: updateError } = await supabase
      .from("weddings")
      .update({ stripe_account_id: account.id })
      .eq("id", weddingId)

    if (updateError) {
      console.error("Failed to store Stripe account ID:", updateError)
      return NextResponse.json(
        { error: "Failed to link Stripe account" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      accountId: account.id,
      message: "Stripe Connect account created successfully",
    })
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error)
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account" },
      { status: 500 }
    )
  }
}
