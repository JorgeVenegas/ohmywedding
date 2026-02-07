import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { requireFeature } from "@/lib/subscription-api"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST create multiple guest groups with auto-generated guests
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const weddingId = body.weddingId

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)

    // Check premium access for guest management
    const featureCheck = await requireFeature('invitations_panel_enabled', decodedWeddingId)
    if (!featureCheck.allowed) {
      return featureCheck.response
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', decodedWeddingId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    if (!body.groups || !Array.isArray(body.groups)) {
      return NextResponse.json({ error: "Groups array is required" }, { status: 400 })
    }

    let totalGroupsCreated = 0
    let totalGuestsCreated = 0

    for (const groupData of body.groups) {
      const groupName = groupData.groupName?.trim()
      const guestCount = parseInt(groupData.guestCount) || 1
      
      if (!groupName) continue

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("guest_groups")
        .insert([{
          wedding_id: wedding.id,
          name: groupName,
          phone_number: groupData.phoneNumber || null,
          notes: groupData.notes || null,
        }])
        .select()
        .single()

      if (groupError) {
        continue
      }

      totalGroupsCreated++

      // Create guests for this group
      const guestsToCreate = []
      for (let i = 1; i <= guestCount; i++) {
        guestsToCreate.push({
          wedding_id: wedding.id,
          guest_group_id: group.id,
          name: guestCount === 1 ? groupName : `Guest ${i}`,
          phone_number: null,
          tags: groupData.tags || [],
          confirmation_status: 'pending',
          dietary_restrictions: null,
          notes: null,
          invited_by: groupData.invitedBy || [],
        })
      }

      const { data: guests, error: guestsError } = await supabase
        .from("guests")
        .insert(guestsToCreate)
        .select()

      if (guestsError) {
        // Failed to create guests for this group
      } else {
        totalGuestsCreated += guests.length
      }
    }

    return NextResponse.json({ 
      success: true, 
      groupCount: totalGroupsCreated,
      guestCount: totalGuestsCreated
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
