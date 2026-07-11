import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { isMessagingEnabledForWeddingUuid } from "@/lib/messaging/feature-flag"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PAGE_SIZE = 50

// GET /api/messaging/conversations/[id]/messages?before=<created_at ISO> — cursor
// (keyset) pagination, never offset (design doc §7.5: threads can run to thousands
// of messages). Omit `before` for the most recent page.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const before = searchParams.get("before")

    const supabase = await createServerSupabaseClient()

    const { data: conversation } = await supabase.from("conversations").select("wedding_id").eq("id", id).maybeSingle()
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    if (!(await isMessagingEnabledForWeddingUuid(supabase, conversation.wedding_id))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    let query = supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)

    if (before) {
      query = query.lt("created_at", before)
    }

    const { data: messages, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: (messages ?? []).reverse() })
  } catch (error) {
    console.error("GET /api/messaging/conversations/[id]/messages failed:", error)
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }
}
