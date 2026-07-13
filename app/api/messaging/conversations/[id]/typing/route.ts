import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { sendTypingIndicator } from "@/lib/messaging/channels/whatsapp"
import { isMessagingEnabledForWeddingUuid } from "@/lib/messaging/feature-flag"
import type { WhatsappAccount } from "@/lib/messaging/types"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/messaging/conversations/[id]/typing — tells WhatsApp to show
// "typing…" to the guest while the host is composing a reply. Meta requires the
// channel_message_id of the inbound message being replied to (see
// developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators); it
// auto-dismisses after 25s or on our next send. Purely cosmetic, so any failure
// here is swallowed rather than surfaced to the host — a missed typing
// indicator shouldn't block or error out the composer.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminSupabaseClient()

    const { data: conversation } = await admin
      .from("conversations")
      .select("id, wedding_id, channel_account_id")
      .eq("id", id)
      .single()
    if (!conversation) {
      return NextResponse.json({ sent: false, error: "Conversation not found" }, { status: 404 })
    }

    if (!(await isMessagingEnabledForWeddingUuid(admin, conversation.wedding_id))) {
      return NextResponse.json({ sent: false, error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    const userClient = await createServerSupabaseClient()
    const { data: weddingAccess } = await userClient
      .from("weddings")
      .select("id")
      .eq("id", conversation.wedding_id)
      .maybeSingle()
    if (!weddingAccess) {
      return NextResponse.json({ sent: false, error: "Not authorized for this wedding" }, { status: 403 })
    }

    if (!conversation.channel_account_id) {
      return NextResponse.json({ sent: false })
    }

    const { data: account } = await admin
      .from("whatsapp_accounts")
      .select("*")
      .eq("id", conversation.channel_account_id)
      .maybeSingle()
    if (!account?.access_token_secret) {
      return NextResponse.json({ sent: false })
    }

    const { data: lastInbound } = await admin
      .from("messages")
      .select("channel_message_id")
      .eq("conversation_id", id)
      .eq("direction", "inbound")
      .not("channel_message_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!lastInbound?.channel_message_id) {
      return NextResponse.json({ sent: false })
    }

    const result = await sendTypingIndicator(account as WhatsappAccount, lastInbound.channel_message_id)
    return NextResponse.json({ sent: result.ok })
  } catch (error) {
    console.error("messaging typing indicator failed:", error)
    return NextResponse.json({ sent: false })
  }
}
