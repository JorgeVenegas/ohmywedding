import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { isMessagingEnabledForWeddingNameId } from "@/lib/messaging/feature-flag"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/messaging/conversations?weddingId=<wedding_name_id> — the inbox list.
// Cookie-scoped client only: the conversations RLS policy (owner/collaborator)
// already does the access control, no separate check needed.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get("weddingId")
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const decodedWeddingId = decodeURIComponent(weddingId)

    if (!isMessagingEnabledForWeddingNameId(decodedWeddingId)) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", decodeURIComponent(weddingId))
      .single()
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*, contacts(id, display_name, external_address, guest_id)")
      .eq("wedding_id", wedding.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations ?? [], weddingId: wedding.id })
  } catch (error) {
    console.error("GET /api/messaging/conversations failed:", error)
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 })
  }
}
