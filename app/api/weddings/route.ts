import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { generateWeddingIds } from "@/lib/wedding-id-generator"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Handle GET requests - return user's weddings with plan and website info
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ weddings: [] })
    }
    
    // Get weddings owned by the user - include has_website and join with wedding_subscriptions
    const { data: ownedWeddings, error: ownedError } = await supabase
      .from('weddings')
      .select('id, wedding_name_id, partner1_first_name, partner2_first_name, wedding_date, has_website, wedding_subscriptions(plan)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    
    if (ownedError) {
      return NextResponse.json({ weddings: [] })
    }
    
    // Try to get weddings where user is a collaborator
    let collaboratorWeddings: typeof ownedWeddings = []
    if (user.email) {
      try {
        const { data } = await supabase
          .from('weddings')
          .select('id, wedding_name_id, partner1_first_name, partner2_first_name, wedding_date, has_website, wedding_subscriptions(plan)')
          .contains('collaborator_emails', [user.email.toLowerCase()])
          .order('created_at', { ascending: false })
        
        if (data) {
          collaboratorWeddings = data
        }
      } catch {
        // Column might not exist yet
      }
    }
    
    // Combine and deduplicate
    const allWeddings = [...(ownedWeddings || [])]
    for (const collab of collaboratorWeddings || []) {
      if (!allWeddings.find(w => w.id === collab.id)) {
        allWeddings.push(collab)
      }
    }
    
    // Flatten the joined data
    const weddingsWithPlan = allWeddings.map(w => {
      const sub = Array.isArray(w.wedding_subscriptions) 
        ? w.wedding_subscriptions[0] 
        : w.wedding_subscriptions
      return {
        id: w.id,
        wedding_name_id: w.wedding_name_id,
        partner1_first_name: w.partner1_first_name,
        partner2_first_name: w.partner2_first_name,
        wedding_date: w.wedding_date,
        has_website: w.has_website,
        plan: sub?.plan || 'free',
      }
    })
    
    return NextResponse.json({ weddings: weddingsWithPlan })
  } catch (error) {
    return NextResponse.json({ weddings: [] })
  }
}

// POST - creates a wedding. Works for both authenticated and unauthenticated users.
// For unauthenticated users, an email is required. An invite link is sent to access the dashboard.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check if user is already authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse request body
    let body
    try {
      const text = await request.text()
      if (!text) {
        return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate required fields
    if (!body.partner1FirstName || !body.partner2FirstName) {
      return NextResponse.json({ error: "Partner names are required" }, { status: 400 })
    }

    // For unauthenticated users, an email is required
    if (!user && !body.ownerEmail) {
      return NextResponse.json({ error: "Email is required to create a wedding" }, { status: 400 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate unique wedding IDs first (needed for the invite redirect URL)
    const { dateId, weddingNameId } = await generateWeddingIds(
      body.partner1FirstName,
      body.partner2FirstName,
      body.partner1LastName,
      body.partner2LastName,
      body.weddingDate,
    )

    // Resolve the owner: logged-in user or find/create by email
    let ownerId: string
    let emailSent = false

    if (user) {
      ownerId = user.id
    } else {
      const ownerEmail = body.ownerEmail.trim().toLowerCase()

      // Invite user by email — creates account if new, otherwise resends invite to existing user.
      // Supabase sends the magic link email via its configured email infrastructure.
      const redirectTo = body.redirectOrigin
        ? `${body.redirectOrigin}/auth/callback?redirect=${encodeURIComponent(`/admin/${weddingNameId}/dashboard`)}`
        : undefined

      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        ownerEmail,
        { redirectTo }
      )

      if (inviteError || !inviteData?.user) {
        return NextResponse.json(
          { error: inviteError?.message || "Could not create user account" },
          { status: 500 }
        )
      }

      ownerId = inviteData.user.id
      emailSent = true
    }

    // Create wedding record — use admin client so it works regardless of RLS/auth state
    const weddingData = {
      date_id: dateId,
      wedding_name_id: weddingNameId,
      partner1_first_name: body.partner1FirstName,
      partner1_last_name: body.partner1LastName || null,
      partner2_first_name: body.partner2FirstName,
      partner2_last_name: body.partner2LastName || null,
      wedding_date: body.weddingDate || null,
      ceremony_venue_name: body.location || null,
      owner_id: ownerId,
      has_website: false,
    }

    const { data, error } = await adminClient
      .from("weddings")
      .insert([weddingData])
      .select('id, wedding_name_id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Insert needs_onboarding record so the tutorial shows on first dashboard visit
    await adminClient
      .from('needs_onboarding')
      .upsert({ user_id: ownerId }, { onConflict: 'user_id', ignoreDuplicates: true })

    // Always create a free wedding_subscription row so we can track the trial start date.
    await adminClient
      .from('wedding_subscriptions')
      .upsert({ wedding_id: data.id, plan: 'free' }, { onConflict: 'wedding_id', ignoreDuplicates: true })

    // Handle gift code redemption if provided
    if (body.giftCode) {
      // Validate the gift code
      const { data: gift, error: giftError } = await adminClient
        .from('gift_subscriptions')
        .select('*')
        .eq('code', body.giftCode.trim().toUpperCase())
        .eq('status', 'active')
        .is('wedding_id', null)
        .single()

      if (giftError || !gift) {
        // Wedding was created but gift code is invalid - still return success
        // The wedding is created, user can try redeeming later
        return NextResponse.json({ 
          weddingId: data.id, 
          weddingNameId: data.wedding_name_id,
          emailSent,
          giftCodeError: 'Invalid or already redeemed gift code'
        })
      }

      // Redeem the gift: create wedding_subscription + update gift_subscription
      await adminClient
        .from('wedding_subscriptions')
        .upsert({
          wedding_id: data.id,
          plan: gift.plan,
        })

      await adminClient
        .from('gift_subscriptions')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by_user_id: ownerId,
          wedding_id: data.id,
        })
        .eq('id', gift.id)
    }

    return NextResponse.json({ 
      weddingId: data.id, 
      weddingNameId: data.wedding_name_id,
      emailSent,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
