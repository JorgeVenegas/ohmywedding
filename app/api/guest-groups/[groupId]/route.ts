import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const supabase = await createServerSupabaseClient()

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
        confirmation_status
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
      attending: guest.confirmation_status === 'confirmed' ? true : 
                 guest.confirmation_status === 'declined' ? false : null
    })) || []

    // Check if all guests have responded
    const allResponded = guestsWithStatus.length > 0 && 
                        guestsWithStatus.every(g => g.attending !== null)

    return NextResponse.json({
      id: group.id,
      name: group.name,
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
