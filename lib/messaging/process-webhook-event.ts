import { createAdminSupabaseClient } from "@/lib/supabase-server"
import { whatsappAdapter, getSharedWhatsappAccount } from "./channels/whatsapp"
import { isMessagingEnabledForWeddingUuid } from "./feature-flag"
import type { MessageStatus, ParsedWebhookEvent, WebhookEventRow, WhatsappAccount } from "./types"

// Sent to a sender who can't be matched to ANY wedding at all (not a wedding's
// own connected number, and their phone doesn't match any guest list either) —
// the whole point is to be understandable regardless of the guest's language,
// so it's one message, both languages, not locale-detected.
const UNRECOGNIZED_SENDER_REPLY =
  "Hi! You've reached OhMyWedding (ohmy.wedding). This number isn't linked to a specific wedding in our system, " +
  "so we're unable to share any information here. If you're looking for a couple's wedding, please check the " +
  "invitation link you received or contact them directly.\n\n" +
  "¡Hola! Escribiste a OhMyWedding (ohmy.wedding). Este número no está vinculado a una boda específica en nuestro " +
  "sistema, así que no podemos compartir información aquí. Si buscas la boda de una pareja, revisa el enlace de " +
  "invitación que recibiste o contáctalos directamente."

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "")
}

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

// Tie-break for a phone number that resolves to more than one wedding: prefer
// whichever is soonest-upcoming, falling back to the most recently past.
async function pickWeddingByDate(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  weddingIds: string[]
): Promise<string> {
  if (weddingIds.length === 1) return weddingIds[0]
  const { data } = await supabase.from("weddings").select("id, wedding_date").in("id", weddingIds)
  const rows = data ?? []
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = rows
    .filter((w) => w.wedding_date >= today)
    .sort((a, b) => (a.wedding_date < b.wedding_date ? -1 : 1))
  if (upcoming.length > 0) return upcoming[0].id
  const past = rows.filter((w) => w.wedding_date < today).sort((a, b) => (a.wedding_date > b.wedding_date ? -1 : 1))
  return past[0]?.id ?? weddingIds[0]
}

// Reused when the sender's number has messaged in before, under the shared
// number (any wedding) — keeps a thread anchored to whichever wedding it was
// first resolved to, without re-running the guest-phone match every time.
async function findExistingContactWedding(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  channelId: string,
  externalAddress: string
): Promise<string | null> {
  const { data } = await supabase
    .from("contacts")
    .select("wedding_id")
    .eq("channel_id", channelId)
    .eq("external_address", externalAddress)
  const weddingIds = [...new Set((data ?? []).map((c) => c.wedding_id as string))]
  if (weddingIds.length === 0) return null
  return pickWeddingByDate(supabase, weddingIds)
}

// The only way to know which wedding a message to the SHARED number is about:
// match the sender's phone against every wedding's guest list. No functional
// index on guests.phone_number today — the ILIKE narrows the scan to a cheap
// prefilter, then a full digit-normalized comparison confirms the match. Fine
// at current scale; worth a trigram/functional index if guest volume grows a
// lot.
async function findGuestMatchByPhone(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  fromAddress: string
): Promise<{ weddingId: string; guestId: string } | null> {
  const senderDigits = normalizePhoneDigits(fromAddress)
  if (senderDigits.length < 7) return null // too short to safely match
  const last10 = senderDigits.slice(-10)

  const { data: candidates } = await supabase
    .from("guests")
    .select("id, wedding_id, phone_number")
    .not("phone_number", "is", null)
    .ilike("phone_number", `%${last10}%`)

  const matches = (candidates ?? []).filter((g) => {
    const guestDigits = normalizePhoneDigits(g.phone_number ?? "")
    return guestDigits.length >= 7 && guestDigits.slice(-10) === last10
  })
  if (matches.length === 0) return null

  const weddingIds = [...new Set(matches.map((m) => m.wedding_id as string))]
  const weddingId = await pickWeddingByDate(supabase, weddingIds)
  const guestId = matches.find((m) => m.wedding_id === weddingId)!.id as string
  return { weddingId, guestId }
}

async function replyToUnrecognizedSender(fromAddress: string): Promise<void> {
  const sharedAccount = getSharedWhatsappAccount()
  if (!sharedAccount) return // no shared account configured — nothing to reply with
  await whatsappAdapter.send({ account: sharedAccount, toAddress: fromAddress, body: UNRECOGNIZED_SENDER_REPLY })
}

async function handleInboundMessage(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  event: Extract<ParsedWebhookEvent, { kind: "inbound_message" }>,
  webhookEventId: string
) {
  const channelId = await getWhatsappChannelId(supabase)

  // A wedding's own connected number resolves directly, same as before this
  // change. Anything else (the shared platform number, or a truly unrecognized
  // phone_number_id) falls back to matching the sender's phone against every
  // wedding's guest list.
  const customAccount = await findAccountByPhoneNumberId(supabase, event.phoneNumberId)

  let weddingId: string
  let channelAccountId: string | null
  let autoLinkGuestId: string | null = null

  if (customAccount) {
    weddingId = customAccount.wedding_id
    channelAccountId = customAccount.id
  } else {
    const existingWeddingId = await findExistingContactWedding(supabase, channelId, event.fromAddress)
    if (existingWeddingId) {
      weddingId = existingWeddingId
    } else {
      const guestMatch = await findGuestMatchByPhone(supabase, event.fromAddress)
      if (!guestMatch) {
        await replyToUnrecognizedSender(event.fromAddress)
        return { ok: false as const, reason: "unrecognized_sender" }
      }
      weddingId = guestMatch.weddingId
      autoLinkGuestId = guestMatch.guestId
    }
    channelAccountId = null
  }

  if (!(await isMessagingEnabledForWeddingUuid(supabase, weddingId))) {
    // Wedding resolved but isn't on the rollout allowlist — acknowledge and
    // drop, same as before. The raw payload is already durable in
    // webhook_events either way (design doc §4.2).
    return { ok: false as const, reason: "messaging_not_enabled_for_wedding" }
  }

  // Select-then-insert rather than a blind upsert: a returning sender's contact
  // (and any manual guest link a host already made) must not get its guest_id
  // silently overwritten by auto-linking on every subsequent message.
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("channel_id", channelId)
    .eq("external_address", event.fromAddress)
    .maybeSingle()

  let contactId: string
  if (existingContact) {
    contactId = existingContact.id
    // Still keep the display name fresh, same as the old blind upsert did.
    await supabase.from("contacts").update({ display_name: event.profileName ?? null }).eq("id", contactId)
  } else {
    const { data: newContact, error: insertError } = await supabase
      .from("contacts")
      .insert({
        wedding_id: weddingId,
        channel_id: channelId,
        external_address: event.fromAddress,
        display_name: event.profileName ?? null,
        guest_id: autoLinkGuestId,
      })
      .select("id")
      .single()

    if (insertError) {
      // Unique violation = lost a race with a concurrent insert for the same
      // contact (two webhook deliveries for a brand-new sender processed at
      // once) — use the row the other one created instead of failing.
      if (insertError.code === "23505") {
        const { data: raceWinner } = await supabase
          .from("contacts")
          .select("id")
          .eq("wedding_id", weddingId)
          .eq("channel_id", channelId)
          .eq("external_address", event.fromAddress)
          .single()
        if (!raceWinner) throw insertError
        contactId = raceWinner.id
      } else {
        throw insertError
      }
    } else {
      contactId = newContact!.id
    }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .upsert(
      {
        wedding_id: weddingId,
        contact_id: contactId,
        channel_id: channelId,
        channel_account_id: channelAccountId,
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
        wedding_id: weddingId,
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
