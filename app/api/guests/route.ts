import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { requireFeature } from "@/lib/subscription-api"
import { getWeddingFeatureLimit } from "@/lib/subscription"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET all guests for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const groupId = searchParams.get('groupId')
    const ungrouped = searchParams.get('ungrouped')

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)
    
    // No plan check on GET - free users can browse their guest list
    // Write operations (POST/PUT/DELETE) are plan-gated

    const supabase = await createServerSupabaseClient()
    
    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', decodedWeddingId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    
    let query = supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: true })

    if (groupId) {
      query = query.eq("guest_group_id", groupId)
    } else if (ungrouped === 'true') {
      query = query.is("guest_group_id", null)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new guest or bulk create guests
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Check if this is a bulk insert
    if (body.bulk && Array.isArray(body.guests)) {
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
      
      // Get the wedding UUID from the wedding_name_id
      const { data: wedding, error: weddingError } = await supabase
        .from('weddings')
        .select('id')
        .eq('wedding_name_id', decodedWeddingId)
        .single()
      
      if (weddingError || !wedding) {
        return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
      }
      
      // Check guest limit for wedding's plan
      const guestLimit = await getWeddingFeatureLimit(wedding.id, 'guests_limit')
      if (guestLimit !== null) {
        // Count current guests
        const { count: currentGuestCount } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('wedding_id', wedding.id)
        
        const newGuestCount = (currentGuestCount || 0) + body.guests.length
        if (newGuestCount > guestLimit) {
          return NextResponse.json({ 
            error: `Guest limit exceeded. Your plan allows ${guestLimit} guests. You currently have ${currentGuestCount || 0} and are trying to add ${body.guests.length}.`,
            code: 'GUEST_LIMIT_EXCEEDED',
            limit: guestLimit,
            current: currentGuestCount || 0,
            requested: body.guests.length
          }, { status: 403 })
        }
      }
      
      const guestsToInsert = body.guests.map((guest: {
        name: string
        phoneNumber?: string
        email?: string
        tags?: string[]
        confirmationStatus?: string
        dietaryRestrictions?: string
        notes?: string
        guestGroupId?: string
        invitedBy?: string[]
        isTraveling?: boolean
        travelingFrom?: string
        travelArrangement?: string
      }) => ({
        wedding_id: wedding.id,
        guest_group_id: guest.guestGroupId || null,
        name: guest.name,
        phone_number: guest.phoneNumber || null,
        email: guest.email || null,
        tags: guest.tags || [],
        confirmation_status: guest.confirmationStatus || 'pending',
        dietary_restrictions: guest.dietaryRestrictions || null,
        notes: guest.notes || null,
        invited_by: guest.invitedBy || [],
        is_traveling: guest.isTraveling || false,
        traveling_from: guest.travelingFrom || null,
        travel_arrangement: guest.travelArrangement || null,
      }))

      const { data, error } = await supabase
        .from("guests")
        .insert(guestsToInsert)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data, count: data.length })
    }

    // Single guest insert (original behavior)
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

    // Get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', decodedWeddingId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Check guest limit for wedding's plan
    const guestLimit = await getWeddingFeatureLimit(wedding.id, 'guests_limit')
    if (guestLimit !== null) {
      // Count current guests
      const { count: currentGuestCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id)
      
      if ((currentGuestCount || 0) >= guestLimit) {
        return NextResponse.json({ 
          error: `Guest limit reached. Your plan allows ${guestLimit} guests. Upgrade to add more.`,
          code: 'GUEST_LIMIT_EXCEEDED',
          limit: guestLimit,
          current: currentGuestCount || 0
        }, { status: 403 })
      }
    }

    const { data, error } = await supabase.from("guests").insert([
      {
        wedding_id: wedding.id,
        guest_group_id: body.guestGroupId || null,
        name: body.name,
        phone_number: body.phoneNumber || null,
        email: body.email || null,
        tags: body.tags || [],
        confirmation_status: body.confirmationStatus || 'pending',
        dietary_restrictions: body.dietaryRestrictions || null,
        notes: body.notes || null,
        invited_by: body.invitedBy || [],
        is_traveling: body.isTraveling || false,
        traveling_from: body.travelingFrom || null,
        travel_arrangement: body.travelArrangement || null,
      },
    ]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update a guest
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }

    // Check current user auth
    const { data: { user } } = await supabase.auth.getUser()

    // First, check if the guest exists and get its wedding_id and current data
    const { data: existingGuest, error: fetchError } = await supabase
      .from("guests")
      .select("wedding_id, confirmation_status, name, guest_group_id, invited_by, is_traveling, traveling_from, travel_arrangement, ticket_attachment_url, no_ticket_reason, admin_set_travel")
      .eq("id", body.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    // Check wedding ownership
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("owner_id, collaborator_emails")
      .eq("id", existingGuest.wedding_id)
      .single()

    if (weddingError) {
    }

    // Make invited_by additive - merge with existing values
    let invitedByToUse = body.invitedBy || []
    if (body.invitedBy && body.invitedBy.length > 0) {
      const existingInvitedBy = existingGuest.invited_by || []
      // Merge arrays and remove duplicates
      invitedByToUse = [...new Set([...existingInvitedBy, ...body.invitedBy])]
    } else if (!body.invitedBy) {
      // If not provided in update, keep existing values
      invitedByToUse = existingGuest.invited_by || []
    }

    const updateData: Record<string, any> = {
      name: body.name,
      phone_number: body.phoneNumber,
      email: body.email,
      tags: body.tags || [],
      guest_group_id: body.guestGroupId,
      confirmation_status: body.confirmationStatus,
      dietary_restrictions: body.dietaryRestrictions,
      notes: body.notes,
      invited_by: invitedByToUse,
      is_traveling: body.isTraveling !== undefined ? body.isTraveling : existingGuest.is_traveling,
      traveling_from: body.travelingFrom !== undefined ? body.travelingFrom : existingGuest.traveling_from,
      travel_arrangement: body.travelArrangement !== undefined ? body.travelArrangement : existingGuest.travel_arrangement,
      // Only update ticket_attachment_url if explicitly provided, otherwise preserve existing
      ticket_attachment_url: body.ticketAttachmentUrl !== undefined ? body.ticketAttachmentUrl : existingGuest.ticket_attachment_url,
      no_ticket_reason: body.noTicketReason !== undefined ? body.noTicketReason : existingGuest.no_ticket_reason,
      admin_set_travel: body.adminSetTravel !== undefined ? body.adminSetTravel : existingGuest.admin_set_travel,
      updated_at: new Date().toISOString(),
    }

    // Handle invitation status
    if (body.invitationSent !== undefined) {
      updateData.invitation_sent = body.invitationSent
      if (body.invitationSent) {
        updateData.invitation_sent_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from("guests")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log activity if confirmation status changed
    const oldStatus = existingGuest.confirmation_status
    const newStatus = body.confirmationStatus
    if (newStatus && oldStatus !== newStatus && (newStatus === 'confirmed' || newStatus === 'declined')) {
      const activityType = newStatus === 'confirmed' ? 'rsvp_confirmed' : 'rsvp_declined'
      const description = newStatus === 'confirmed' 
        ? `${existingGuest.name} confirmed by owner`
        : `${existingGuest.name} declined by owner`

      // Use service role to bypass RLS for activity logging
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      await supabaseAdmin
        .from('activity_logs')
        .insert({
          wedding_id: existingGuest.wedding_id,
          guest_group_id: existingGuest.guest_group_id,
          guest_id: body.id,
          activity_type: activityType,
          description: description,
          metadata: {
            source: 'admin',
            old_status: oldStatus,
            new_status: newStatus
          }
        })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE a guest
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
