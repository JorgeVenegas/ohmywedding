import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isMessagingEnabledForWeddingUuid } from "@/lib/messaging/feature-flag"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/messaging/conversations/[id] — everything the guest context panel
// needs in one call: the conversation, its contact, and (if linked) the guest,
// their group, the group's other members, menu/dish/seating assignments, and
// when they last responded to the RSVP. Read-only, cookie-scoped client — RLS
// on conversations/contacts/guests/guest_groups/etc. already gates access.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("*, contacts(*)")
      .eq("id", id)
      .single()
    if (error || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (!(await isMessagingEnabledForWeddingUuid(supabase, conversation.wedding_id))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    let guest = null
    let group = null
    let groupMembers: Array<{ id: string; name: string; confirmation_status: string }> = []
    let dishAssignment = null
    let menuAssignment = null
    let seatAssignment = null
    let rsvpRespondedAt: string | null = null

    const guestId = (conversation.contacts as { guest_id: string | null } | null)?.guest_id
    if (guestId) {
      const [guestResult, dishResult, menuResult, seatResult, rsvpActivityResult] = await Promise.all([
        supabase.from("guests").select("*").eq("id", guestId).single(),
        supabase.from("guest_dish_assignments").select("*, dishes(id, name, category)").eq("guest_id", guestId).maybeSingle(),
        supabase.from("guest_menu_assignments").select("*, menus(id, name)").eq("guest_id", guestId).maybeSingle(),
        supabase.from("seating_assignments").select("*, seating_tables(id, name)").eq("guest_id", guestId).maybeSingle(),
        supabase
          .from("activity_logs")
          .select("created_at, activity_type")
          .eq("guest_id", guestId)
          .in("activity_type", ["rsvp_confirmed", "rsvp_declined"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const guestRow = guestResult.data
      guest = guestRow
      dishAssignment = dishResult.data
      menuAssignment = menuResult.data
      seatAssignment = seatResult.data
      rsvpRespondedAt = rsvpActivityResult.data?.created_at ?? null

      if (guestRow?.guest_group_id) {
        const { data: groupRow } = await supabase
          .from("guest_groups")
          .select("*")
          .eq("id", guestRow.guest_group_id)
          .single()
        group = groupRow

        const { data: members } = await supabase
          .from("guests")
          .select("id, name, confirmation_status")
          .eq("guest_group_id", guestRow.guest_group_id)
          .order("name")
        groupMembers = members ?? []
      }
    }

    return NextResponse.json({
      conversation,
      guest,
      group,
      groupMembers,
      dishAssignment,
      menuAssignment,
      seatAssignment,
      rsvpRespondedAt,
    })
  } catch (error) {
    console.error("GET /api/messaging/conversations/[id] failed:", error)
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 })
  }
}

// PATCH /api/messaging/conversations/[id] — mark read and/or change status.
// conversations has no authenticated write policy, so this goes through the
// admin client after an explicit access check (reusing weddings RLS, same
// pattern as the send route).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { markRead, status } = (await request.json()) as { markRead?: boolean; status?: string }

    const admin = createAdminSupabaseClient()
    const { data: conversation } = await admin.from("conversations").select("id, wedding_id").eq("id", id).single()
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (!(await isMessagingEnabledForWeddingUuid(admin, conversation.wedding_id))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    const userClient = await createServerSupabaseClient()
    const { data: access } = await userClient
      .from("weddings")
      .select("id")
      .eq("id", conversation.wedding_id)
      .maybeSingle()
    if (!access) {
      return NextResponse.json({ error: "Not authorized for this wedding" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (markRead) updates.unread_count = 0
    if (status) updates.status = status
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    const { data: updated, error } = await admin.from("conversations").update(updates).eq("id", id).select("*").single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversation: updated })
  } catch (error) {
    console.error("PATCH /api/messaging/conversations/[id] failed:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}
