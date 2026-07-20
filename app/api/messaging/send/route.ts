import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { whatsappAdapter, getSharedWhatsappAccount } from "@/lib/messaging/channels/whatsapp"
import { isMessagingEnabledForWeddingUuid } from "@/lib/messaging/feature-flag"
import type { WhatsappAccount, WhatsappSendableAccount } from "@/lib/messaging/types"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Note: WhatsApp's 24h session-message window (conversations.session_expires_at) is
// surfaced to the UI for the composer to gate, but not hard-enforced here yet —
// Meta's own API will reject a free-form send outside the window regardless once a
// real account is connected, and there's no template-send UI in Phase 1 to fall
// back to. Revisit once templates ship (Phase 2/3).

export async function POST(request: NextRequest) {
  try {
    const { conversationId, body } = (await request.json()) as { conversationId?: string; body?: string }
    if (!conversationId || !body?.trim()) {
      return NextResponse.json({ error: "conversationId and body are required" }, { status: 400 })
    }

    const userClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const admin = createAdminSupabaseClient()

    const { data: conversation, error: conversationError } = await admin
      .from("conversations")
      .select("id, wedding_id, contact_id, channel_account_id")
      .eq("id", conversationId)
      .single()
    if (conversationError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (!(await isMessagingEnabledForWeddingUuid(admin, conversation.wedding_id))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    // Access check via the user-scoped client: if RLS wouldn't let this user read
    // the wedding row, they're not authorized to send on its behalf either. Reuses
    // the weddings RLS policy instead of a bespoke permission check.
    const { data: weddingAccess } = await userClient
      .from("weddings")
      .select("id")
      .eq("id", conversation.wedding_id)
      .maybeSingle()
    if (!weddingAccess) {
      return NextResponse.json({ error: "Not authorized for this wedding" }, { status: 403 })
    }

    const { data: contact } = await admin
      .from("contacts")
      .select("external_address")
      .eq("id", conversation.contact_id)
      .single()
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const { data: message, error: messageError } = await admin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        wedding_id: conversation.wedding_id,
        direction: "outbound",
        sender_type: "host",
        sender_user_id: user.id,
        body,
        message_type: "text",
        status: "pending",
      })
      .select("*")
      .single()
    if (messageError || !message) {
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
    }

    // Prefer the wedding's own connected number if it has one; otherwise fall
    // back to the shared platform account (env vars) that covers everyone else.
    let account: WhatsappSendableAccount | null = null
    if (conversation.channel_account_id) {
      const { data } = await admin
        .from("whatsapp_accounts")
        .select("*")
        .eq("id", conversation.channel_account_id)
        .maybeSingle()
      account = (data as WhatsappAccount | null) ?? null
    }
    if (!account) {
      account = getSharedWhatsappAccount()
    }

    const result = account
      ? await whatsappAdapter.send({ account, toAddress: contact.external_address, body })
      : { ok: false as const, errorCode: "no_provider_configured", errorMessage: "No WhatsApp account connected for this wedding." }

    const now = new Date().toISOString()
    await admin.from("message_events").insert({
      message_id: message.id,
      event_type: result.ok ? "sent" : "failed",
      occurred_at: now,
      error_code: result.ok ? null : result.errorCode,
      error_message: result.ok ? null : result.errorMessage,
    })

    const { data: updatedMessage } = await admin
      .from("messages")
      .update({
        status: result.ok ? "sent" : "failed",
        channel_message_id: result.ok ? result.channelMessageId : null,
        error_code: result.ok ? null : result.errorCode,
        error_message: result.ok ? null : result.errorMessage,
      })
      .eq("id", message.id)
      .select("*")
      .single()

    return NextResponse.json({ message: updatedMessage ?? message, sent: result.ok })
  } catch (error) {
    console.error("messaging send failed:", error)
    return NextResponse.json({ error: "Send failed" }, { status: 500 })
  }
}
