import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST create multiple guest groups with auto-generated guests
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Decode the weddingNameId in case it's URL encoded
    const weddingNameId = decodeURIComponent(body.weddingNameId)

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!body.groups || !Array.isArray(body.groups)) {
      return NextResponse.json({ error: "Groups array is required" }, { status: 400 })
    }

    // Get wedding ID
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
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
          tags: groupData.tags || [],
          notes: groupData.notes || null,
          invited_by: groupData.invitedBy || [],
        }])
        .select()
        .single()

      if (groupError) {
        console.error('Error creating group:', groupError)
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
          tags: [],
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
        console.error('Error creating guests for group:', guestsError)
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
    console.error('Bulk guest groups POST - Exception:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
