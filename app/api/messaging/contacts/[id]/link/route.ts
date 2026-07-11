import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isMessagingEnabledForWeddingUuid } from "@/lib/messaging/feature-flag"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/messaging/contacts/[id]/link — the resolution point for an unmatched
// WhatsApp sender (design doc §7): sets contacts.guest_id. Guest search itself
// reuses the existing GET /api/guests?weddingId= route — no new search endpoint.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { guestId } = (await request.json()) as { guestId?: string | null }

    const admin = createAdminSupabaseClient()
    const { data: contact } = await admin.from("contacts").select("id, wedding_id").eq("id", id).single()
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    if (!(await isMessagingEnabledForWeddingUuid(admin, contact.wedding_id))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    const userClient = await createServerSupabaseClient()
    const { data: access } = await userClient
      .from("weddings")
      .select("id")
      .eq("id", contact.wedding_id)
      .maybeSingle()
    if (!access) {
      return NextResponse.json({ error: "Not authorized for this wedding" }, { status: 403 })
    }

    if (guestId) {
      const { data: guest } = await admin
        .from("guests")
        .select("id")
        .eq("id", guestId)
        .eq("wedding_id", contact.wedding_id)
        .maybeSingle()
      if (!guest) {
        return NextResponse.json({ error: "Guest not found on this wedding" }, { status: 404 })
      }
    }

    const { data: updated, error } = await admin
      .from("contacts")
      .update({ guest_id: guestId ?? null })
      .eq("id", id)
      .select("*")
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contact: updated })
  } catch (error) {
    console.error("POST /api/messaging/contacts/[id]/link failed:", error)
    return NextResponse.json({ error: "Failed to link contact" }, { status: 500 })
  }
}
