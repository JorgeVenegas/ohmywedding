import { createAdminSupabaseClient } from "@/lib/supabase-server"
import { whatsappAdapter } from "./channels/whatsapp"
import { isMessagingEnabledForWeddingUuid } from "./feature-flag"
import type { MessageStatus, ParsedWebhookEvent, WebhookEventRow, WhatsappAccount } from "./types"

// Higher rank never gets overwritten by a lower one (design doc §3.6) — a late
// "sent" webhook must not downgrade a message that's already "delivered"/"read",
// which does happen under Meta's own retry behavior.
const STATUS_RANK: Record<MessageStatus, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
}

let cachedWhatsappChannelId: string | null = null

async function getWhatsappChannelId(supabase: ReturnType<typeof createAdminSupabaseClient>): Promise<string> {
  if (cachedWhatsappChannelId) return cachedWhatsappChannelId
  const { data, error } = await supabase.from("channels").select("id").eq("type", "whatsapp").single()
  if (error || !data) throw new Error("whatsapp channel row not found — did the messaging migration run?")
  cachedWhatsappChannelId = data.id as string
  return cachedWhatsappChannelId
}

async function findAccountByPhoneNumberId(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  phoneNumberId: string
): Promise<WhatsappAccount | null> {
  const { data } = await supabase
    .from("whatsapp_accounts")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle()
  return (data as WhatsappAccount | null) ?? null
}

async function handleInboundMessage(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  event: Extract<ParsedWebhookEvent, { kind: "inbound_message" }>,
  webhookEventId: string
) {
  const account = await findAccountByPhoneNumberId(supabase, event.phoneNumberId)
  if (!account) {
    // Not one of ours (or not configured yet) — nothing to attach this to.
    return { ok: false as const, reason: "unknown_phone_number_id" }
  }
  if (!(await isMessagingEnabledForWeddingUuid(supabase, account.wedding_id))) {
    // Wedding has a connected number but isn't on the rollout allowlist —
    // acknowledge and drop, same as an unrecognized number. The raw payload is
    // already durable in webhook_events either way (design doc §4.2).
    return { ok: false as const, reason: "messaging_not_enabled_for_wedding" }
  }
  const channelId = await getWhatsappChannelId(supabase)

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .upsert(
      {
        wedding_id: account.wedding_id,
        channel_id: channelId,
        external_address: event.fromAddress,
        display_name: event.profileName ?? null,
      },
      { onConflict: "wedding_id,channel_id,external_address", ignoreDuplicates: false }
    )
    .select("id")
    .single()
  if (contactError || !contact) throw contactError ?? new Error("contact upsert failed")

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .upsert(
      {
        wedding_id: account.wedding_id,
        contact_id: contact.id,
        channel_id: channelId,
        channel_account_id: account.id,
      },
      { onConflict: "wedding_id,contact_id,channel_id", ignoreDuplicates: false }
    )
    .select("id")
    .single()
  if (conversationError || !conversation) throw conversationError ?? new Error("conversation upsert failed")

  // Idempotent on channel_message_id — a re-processed webhook (retry, replay) never
  // creates a duplicate message row.
  const { error: messageError } = await supabase
    .from("messages")
    .upsert(
      {
        conversation_id: conversation.id,
        wedding_id: account.wedding_id,
        direction: "inbound",
        sender_type: "guest",
        body: event.body ?? null,
        message_type: event.messageType,
        channel_message_id: event.channelMessageId,
        status: "delivered", // an inbound message reaching us is definitionally delivered
        context_message_id: null, // resolving context_id -> our message uuid is a Phase 2 nicety
        created_at: event.occurredAt,
      },
      { onConflict: "channel_message_id", ignoreDuplicates: true }
    )
  if (messageError) throw messageError

  return { ok: true as const }
}

async function handleStatusUpdate(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  event: Extract<ParsedWebhookEvent, { kind: "status_update" }>,
  webhookEventId: string
) {
  const { data: message } = await supabase
    .from("messages")
    .select("id, status, wedding_id")
    .eq("channel_message_id", event.channelMessageId)
    .maybeSingle()

  if (!message) {
    // The status webhook can race ahead of our own send-response write in rare
    // cases. Leave it unprocessed so the retry/sweep picks it up again shortly
    // rather than silently dropping a real delivery status.
    return { ok: false as const, reason: "message_not_found_yet" }
  }
  if (!(await isMessagingEnabledForWeddingUuid(supabase, message.wedding_id))) {
    return { ok: false as const, reason: "messaging_not_enabled_for_wedding" }
  }

  // Dedupe true network-retry duplicates: skip if we already recorded this exact event.
  const { data: existingEvent } = await supabase
    .from("message_events")
    .select("id")
    .eq("message_id", message.id)
    .eq("event_type", event.status)
    .eq("occurred_at", event.occurredAt)
    .maybeSingle()

  if (!existingEvent) {
    const { error: eventError } = await supabase.from("message_events").insert({
      message_id: message.id,
      event_type: event.status,
      occurred_at: event.occurredAt,
      error_code: event.errorCode ?? null,
      error_message: event.errorMessage ?? null,
      webhook_event_id: webhookEventId,
    })
    if (eventError) throw eventError
  }

  const currentStatus = message.status as MessageStatus
  if (STATUS_RANK[event.status] > STATUS_RANK[currentStatus]) {
    const { error: updateError } = await supabase
      .from("messages")
      .update({
        status: event.status,
        error_code: event.errorCode ?? null,
        error_message: event.errorMessage ?? null,
      })
      .eq("id", message.id)
    if (updateError) throw updateError
  }

  return { ok: true as const }
}

// Called by the sweep before it reads the queue: a processor that crashed mid-run
// leaves its row stuck in 'processing' forever otherwise, since only a completed
// run flips it to 'processed'/'failed'.
export async function resetStaleProcessingWebhookEvents(olderThanSeconds = 120): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const cutoff = new Date(Date.now() - olderThanSeconds * 1000).toISOString()
  await supabase.from("webhook_events").update({ status: "pending" }).eq("status", "processing").lt("received_at", cutoff)
}

// The single code path for turning a stored webhook_events row into domain state —
// called from the instant pg_net push, the pg_cron sweep, and manual/local-dev
// triggers alike (design doc §4.5/§5.3's stated fix: no separate "first attempt" vs
// "retry" logic).
export async function processWebhookEvent(webhookEventId: string): Promise<void> {
  const supabase = createAdminSupabaseClient()

  // Claim it: only proceed if it's still pending, so a race between the instant
  // push and the sweep (or a duplicate pg_net call) can't double-process the same row.
  const { data: claimed } = await supabase
    .from("webhook_events")
    .update({ status: "processing" })
    .eq("id", webhookEventId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle()

  const row = claimed as WebhookEventRow | null
  if (!row) {
    // Either already processed, or currently being processed by a concurrent
    // caller, or was left in 'processing'/'failed' by a previous crashed attempt —
    // in the latter two cases, this claim query intentionally does not re-claim it;
    // that's the pg_cron sweep's job (it resets stale 'processing' rows first).
    return
  }

  await supabase
    .from("webhook_events")
    .update({ attempt_count: row.attempt_count + 1 })
    .eq("id", webhookEventId)

  try {
    const events = whatsappAdapter.parseWebhookPayload(row.raw_payload)

    for (const event of events) {
      if (event.kind === "inbound_message") {
        await handleInboundMessage(supabase, event, webhookEventId)
      } else {
        await handleStatusUpdate(supabase, event, webhookEventId)
      }
    }

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", webhookEventId)
  } catch (err) {
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        last_error: err instanceof Error ? err.message : "Unknown processing error",
      })
      .eq("id", webhookEventId)
    throw err
  }
}
