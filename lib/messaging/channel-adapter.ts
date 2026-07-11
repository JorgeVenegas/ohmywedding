import type { ParsedWebhookEvent, SendMessageParams, SendMessageResult } from "./types"

// The seam that keeps this platform channel-agnostic (design doc §0, bet 1).
// WhatsApp is the only implementation today; Email/SMS implement the same
// interface later without touching the domain layer that calls it.
export interface ChannelAdapter {
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean
  parseWebhookPayload(rawPayload: unknown): ParsedWebhookEvent[]
  send(params: SendMessageParams): Promise<SendMessageResult>
}
