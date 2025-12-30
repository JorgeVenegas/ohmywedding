import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    // Use anonymous client for public RSVP pages - RLS policies allow public read
    const supabase = createClient()

    // Fetch the guest group
    const { data: group, error: groupError } = await supabase
      .from("guest_groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (groupError) {
      return NextResponse.json(
        { error: "Guest group not found" },
        { status: 404 }
      )
    }

    // Fetch guests in the group with their RSVP status
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select(`
        id,
        name,
        phone_number,
        confirmation_status,
        is_traveling,
        traveling_from,
        travel_arrangement,
        ticket_attachment_url,
        no_ticket_reason,
        admin_set_travel
      `)
      .eq("guest_group_id", groupId)
      .order("name")

    if (guestsError) {
      return NextResponse.json(
        { error: "Failed to fetch guests" },
        { status: 500 }
      )
    }

    // Map confirmation_status to attending boolean for frontend compatibility
    const guestsWithStatus = guests?.map(guest => ({
      id: guest.id,
      name: guest.name,
      phone_number: guest.phone_number,
      attending: guest.confirmation_status === 'confirmed' ? true : 
                 guest.confirmation_status === 'declined' ? false : null,
      is_traveling: guest.is_traveling,
      traveling_from: guest.traveling_from,
      travel_arrangement: guest.travel_arrangement,
      ticket_attachment_url: guest.ticket_attachment_url,
      no_ticket_reason: guest.no_ticket_reason,
      admin_set_travel: guest.admin_set_travel || false
    })) || []

    // Check if all guests have responded
    const allResponded = guestsWithStatus.length > 0 && 
                        guestsWithStatus.every(g => g.attending !== null)

    // Collect all phone numbers from group and guests
    const phoneNumbers: string[] = []
    if (group.phone_number) {
      phoneNumbers.push(group.phone_number)
    }
    guestsWithStatus.forEach(guest => {
      if (guest.phone_number && !phoneNumbers.includes(guest.phone_number)) {
        phoneNumbers.push(guest.phone_number)
      }
    })

    return NextResponse.json({
      id: group.id,
      name: group.name,
      phone_number: group.phone_number,
      phone_numbers: phoneNumbers,
      guests: guestsWithStatus,
      hasSubmitted: allResponded
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
