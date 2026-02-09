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

    const { weddingId, type = "onboarding" } = await request.json()

    if (!weddingId) {
      return NextResponse.json(
        { error: "Wedding ID is required" },
        { status: 400 }
      )
    }

    // Check user owns or collaborates on this wedding
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, owner_id, collaborator_emails, stripe_account_id, wedding_name_id")
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

    if (!wedding.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account found. Please create one first." },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Get base URL from request headers - always use main domain for admin routes
    const host = request.headers.get('host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    
    // Extract main domain (remove subdomain if present)
    let mainDomain = host
    const hostParts = host.split('.')
    if (hostParts[0] !== 'ohmy' && host.includes('ohmy.')) {
      // Remove wedding subdomain, keep ohmy.local:port
      mainDomain = hostParts.slice(hostParts.indexOf('ohmy')).join('.')
    }
    
    const baseUrl = `${protocol}://${mainDomain}`
    
    const returnUrl = `${baseUrl}/admin/${wedding.wedding_name_id}/registry?connect=success`
    const refreshUrl = `${baseUrl}/admin/${wedding.wedding_name_id}/registry?connect=refresh`

    if (type === "login") {
      // Generate login link for existing connected accounts
      const loginLink = await stripe.accounts.createLoginLink(wedding.stripe_account_id)
      
      return NextResponse.json({
        url: loginLink.url,
        type: "login",
      })
    }

    // Generate onboarding link for new accounts
    const accountLink = await stripe.accountLinks.create({
      account: wedding.stripe_account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })

    return NextResponse.json({
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
      type: "onboarding",
    })
  } catch (error) {
    console.error("Error creating account link:", error)
    return NextResponse.json(
      { error: "Failed to create account link" },
      { status: 500 }
    )
  }
}
