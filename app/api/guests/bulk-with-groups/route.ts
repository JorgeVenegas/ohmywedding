import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST create multiple guests with auto-group creation
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const weddingId = body.weddingId

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)

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

    if (!body.guests || !Array.isArray(body.guests)) {
      return NextResponse.json({ error: "Guests array is required" }, { status: 400 })
    }

    // First, get existing groups for this wedding
    const { data: existingGroups, error: groupsError } = await supabase
      .from("guest_groups")
      .select("id, name")
      .eq("wedding_id", wedding.id)

    if (groupsError) {
      return NextResponse.json({ error: "Failed to fetch existing groups" }, { status: 500 })
    }

    // Create a map of group names to IDs (case-insensitive)
    const groupMap = new Map<string, string>()
    existingGroups?.forEach(group => {
      groupMap.set(group.name.toLowerCase().trim(), group.id)
    })

    // Track groups we need to create
    const groupsToCreate = new Set<string>()
    
    // First pass: identify groups that need to be created
    for (const guest of body.guests) {
      const groupName = (guest.groupName as string)?.trim()
      if (groupName && !groupMap.has(groupName.toLowerCase())) {
        groupsToCreate.add(groupName)
      }
    }

    // Create new groups
    let newGroupsCreated = 0
    for (const groupName of groupsToCreate) {
      const { data: newGroup, error: createError } = await supabase
        .from("guest_groups")
        .insert([{
          wedding_id: wedding.id,
          name: groupName,
          phone_number: null,
          notes: null,
        }])
        .select()
        .single()

      if (createError) {
        continue
      }

      groupMap.set(groupName.toLowerCase(), newGroup.id)
      newGroupsCreated++
    }

    // Now create all guests with their group assignments
    const guestsToInsert = body.guests
      .filter((guest: { name?: string; groupName?: string }) => 
        guest.name?.trim() && guest.groupName?.trim()
      )
      .map((guest: {
        name: string
        groupName: string
        phoneNumber?: string
        tags?: string[]
        confirmationStatus?: string
        dietaryRestrictions?: string
        notes?: string
        invitedBy?: string[]
      }) => {
        const groupName = guest.groupName.trim()
        const groupId = groupMap.get(groupName.toLowerCase())
        
        return {
          wedding_id: wedding.id,
          guest_group_id: groupId || null,
          name: guest.name.trim(),
          phone_number: guest.phoneNumber || null,
          tags: guest.tags || [],
          confirmation_status: guest.confirmationStatus || 'pending',
          dietary_restrictions: guest.dietaryRestrictions || null,
          notes: guest.notes || null,
          invited_by: guest.invitedBy || [],
        }
      })

    if (guestsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid guests to import" }, { status: 400 })
    }

    const { data: createdGuests, error: insertError } = await supabase
      .from("guests")
      .insert(guestsToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Count unique groups used
    const uniqueGroupIds = new Set(createdGuests?.map(g => g.guest_group_id).filter(Boolean))

    return NextResponse.json({ 
      success: true, 
      guestCount: createdGuests?.length || 0,
      groupCount: uniqueGroupIds.size,
      newGroupsCreated
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
