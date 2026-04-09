import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"
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

    // Get the wedding UUID and verify ownership
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq('wedding_name_id', decodedWeddingId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Verify user is owner or collaborator
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() || '')
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use admin client for writes to bypass RLS (ownership already verified above)
    const adminClient = createAdminSupabaseClient()

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

    // Track groups we need to create and their extra passes
    const groupsToCreate = new Set<string>()
    const groupExtraPasses = new Map<string, number>()
    
    // First pass: identify groups that need to be created and collect metadata
    for (const guest of body.guests) {
      const groupName = (guest.groupName as string)?.trim()
      if (groupName) {
        const groupKey = groupName.toLowerCase()
        if (!groupMap.has(groupKey)) {
          groupsToCreate.add(groupName)
        }
        // Track extra passes per group (use the max value found across guests in the same group)
        const extraPasses = parseInt(guest.extraPasses) || 0
        if (extraPasses > 0) {
          const current = groupExtraPasses.get(groupKey) || 0
          if (extraPasses > current) {
            groupExtraPasses.set(groupKey, extraPasses)
          }
        }
      }
    }

    // Create new groups
    let newGroupsCreated = 0
    const groupErrors: string[] = []
    for (const groupName of groupsToCreate) {
      const groupKey = groupName.toLowerCase()
      const { data: newGroup, error: createError } = await adminClient
        .from("guest_groups")
        .insert([{
          wedding_id: wedding.id,
          name: groupName,
          notes: null,
          extra_passes: groupExtraPasses.get(groupKey) || 0,
        }])
        .select()
        .single()

      if (createError) {
        console.error('[bulk-with-groups] Failed to create group:', { groupName, error: createError.message, code: createError.code })
        groupErrors.push(`${groupName}: ${createError.message}`)
        continue
      }

      groupMap.set(groupKey, newGroup.id)
      newGroupsCreated++
    }

    // If ALL groups failed to create, return an error instead of creating ungrouped guests
    if (groupsToCreate.size > 0 && newGroupsCreated === 0) {
      return NextResponse.json({
        error: "Failed to create any groups. Guests were not imported.",
        details: groupErrors.slice(0, 5),
      }, { status: 500 })
    }

    // Update extra passes on existing groups if needed
    for (const [groupKey, extraPasses] of groupExtraPasses) {
      const groupId = groupMap.get(groupKey)
      if (groupId && !groupsToCreate.has(groupKey)) {
        await adminClient
          .from("guest_groups")
          .update({ extra_passes: extraPasses })
          .eq("id", groupId)
      }
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

    const { data: createdGuests, error: insertError } = await adminClient
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
      newGroupsCreated,
      ...(groupErrors.length > 0 ? { groupErrors } : {}),
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
