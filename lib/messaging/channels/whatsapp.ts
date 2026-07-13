import crypto from "crypto"
import type { ChannelAdapter } from "../channel-adapter"
import type { MessageType, ParsedWebhookEvent, SendMessageParams, SendMessageResult, WhatsappAccount } from "../types"

const GRAPH_API_VERSION = "v21.0"

// Meta's webhook signature is app-level (one Meta App, shared App Secret), not
// per-wedding — we operate a single Meta App as a Tech Provider and onboard many
// weddings' WABAs under it via Embedded Signup (design doc §6.2), so this lives in
// an env var rather than on whatsapp_accounts.
function getAppSecret(): string | null {
  return process.env.WHATSAPP_APP_SECRET || null
}

function mapMetaMessageType(type: string): MessageType {
  switch (type) {
    case "text":
    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker":
    case "location":
      return type
    default:
      return "unsupported"
  }
}

function mapMetaStatus(status: string): "sent" | "delivered" | "read" | "failed" | null {
  if (status === "sent" || status === "delivered" || status === "read" || status === "failed") {
    return status
  }
  return null
}

export const whatsappAdapter: ChannelAdapter = {
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    const appSecret = getAppSecret()
    if (!appSecret) {
      // No app secret configured yet (no Meta App set up) — cannot verify. Callers
      // must treat this as "not verified", not "verified", and decide policy
      // (the webhook route allows unverified-but-logged in dev, rejects in prod).
      return false
    }
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
      return false
    }
    const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")
    const provided = signatureHeader.slice("sha256=".length)

    const expectedBuf = Buffer.from(expected, "hex")
    const providedBuf = Buffer.from(provided, "hex")
    if (expectedBuf.length !== providedBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, providedBuf)
  },

  parseWebhookPayload(rawPayload: unknown): ParsedWebhookEvent[] {
    const events: ParsedWebhookEvent[] = []
    const payload = rawPayload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            metadata?: { phone_number_id?: string }
            contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>
            messages?: Array<{
              id: string
              from: string
              timestamp: string
              type: string
              text?: { body?: string }
              context?: { id?: string }
            }>
            statuses?: Array<{
              id: string
              status: string
              timestamp: string
              errors?: Array<{ code?: number; title?: string }>
            }>
          }
        }>
      }>
    }

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        if (!value) continue
        const phoneNumberId = value.metadata?.phone_number_id ?? ""
        const profileByWaId = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]))

        for (const msg of value.messages ?? []) {
          events.push({
            kind: "inbound_message",
            providerEventId: msg.id,
            phoneNumberId,
            fromAddress: msg.from,
            profileName: profileByWaId.get(msg.from) ?? undefined,
            channelMessageId: msg.id,
            occurredAt: new Date(Number(msg.timestamp) * 1000).toISOString(),
            messageType: mapMetaMessageType(msg.type),
            body: msg.text?.body,
            contextChannelMessageId: msg.context?.id,
          })
        }

        for (const status of value.statuses ?? []) {
          const mapped = mapMetaStatus(status.status)
          if (!mapped) continue // e.g. "deleted" or unrecognized — ignore rather than fail
          const error = status.errors?.[0]
          events.push({
            kind: "status_update",
            providerEventId: `${status.id}:${status.status}:${status.timestamp}`,
            phoneNumberId,
            channelMessageId: status.id,
            status: mapped,
            occurredAt: new Date(Number(status.timestamp) * 1000).toISOString(),
            errorCode: error?.code != null ? String(error.code) : undefined,
            errorMessage: error?.title,
          })
        }
      }
    }

    return events
  },

  async send({ account, toAddress, body }: SendMessageParams): Promise<SendMessageResult> {
    if (!account.access_token_secret) {
      return {
        ok: false,
        errorCode: "no_provider_configured",
        errorMessage: "No WhatsApp access token configured for this wedding yet.",
      }
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token_secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: toAddress,
            type: "text",
            text: { body },
          }),
        }
      )

      const json = (await response.json()) as {
        messages?: Array<{ id: string }>
        error?: { code?: number; message?: string }
      }

      if (!response.ok || json.error) {
        return {
          ok: false,
          errorCode: json.error?.code != null ? String(json.error.code) : `http_${response.status}`,
          errorMessage: json.error?.message ?? "WhatsApp send failed",
        }
      }

      return { ok: true, channelMessageId: json.messages?.[0]?.id, errorCode: "" }
    } catch (err) {
      return {
        ok: false,
        errorCode: "network_error",
        errorMessage: err instanceof Error ? err.message : "Unknown network error",
      }
    }
  },
}

// WhatsApp-only, so it's not on ChannelAdapter (email/sms have no such concept).
// Shows "typing…" to the guest; Meta auto-dismisses it after 25s or on our next
// reply, whichever comes first, and marks the referenced inbound message as read
// as a side effect. `messageId` must be the channel_message_id of an inbound
// message — Meta rejects arbitrary/outbound IDs.
export async function sendTypingIndicator(
  account: WhatsappAccount,
  messageId: string
): Promise<{ ok: boolean; errorCode?: string }> {
  if (!account.access_token_secret) {
    return { ok: false, errorCode: "no_provider_configured" }
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token_secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
          typing_indicator: { type: "text" },
        }),
      }
    )
    if (!response.ok) {
      return { ok: false, errorCode: `http_${response.status}` }
    }
    return { ok: true }
  } catch {
    return { ok: false, errorCode: "network_error" }
  }
}
