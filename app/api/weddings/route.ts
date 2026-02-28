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

// Simplified POST - creates a wedding with minimal info (names, date, location)
// Website creation is now a separate step via POST /api/weddings/[weddingId]/website
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user - required for wedding creation
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - please log in to create a wedding" }, { status: 401 })
    }

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

    // Generate unique wedding IDs
    const { dateId, weddingNameId } = await generateWeddingIds(
      body.partner1FirstName,
      body.partner2FirstName,
      body.partner1LastName,
      body.partner2LastName,
      body.weddingDate,
    )

    // Create wedding record with minimal data
    const weddingData = {
      date_id: dateId,
      wedding_name_id: weddingNameId,
      partner1_first_name: body.partner1FirstName,
      partner1_last_name: body.partner1LastName || null,
      partner2_first_name: body.partner2FirstName,
      partner2_last_name: body.partner2LastName || null,
      wedding_date: body.weddingDate || null,
      ceremony_venue_name: body.location || null,
      owner_id: user.id,
      has_website: false,
    }

    const { data, error } = await supabase
      .from("weddings")
      .insert([weddingData])
      .select('id, wedding_name_id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Handle gift code redemption if provided
    if (body.giftCode) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

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
          redeemed_by_user_id: user.id,
          wedding_id: data.id,
        })
        .eq('id', gift.id)
    }

    return NextResponse.json({ 
      weddingId: data.id, 
      weddingNameId: data.wedding_name_id 
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
