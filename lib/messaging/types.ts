export type ChannelType = 'whatsapp' | 'email' | 'sms'

export interface Channel {
  id: string
  type: ChannelType
  display_name: string
  capabilities: Record<string, boolean>
  is_enabled: boolean
}

export interface WhatsappAccount {
  id: string
  wedding_id: string
  channel_id: string
  waba_id: string
  phone_number_id: string
  display_phone_number: string
  display_name: string | null
  access_token_secret: string | null
  app_secret: string | null
  status: 'pending' | 'connected' | 'disconnected' | 'error'
  quality_rating: string | null
  messaging_limit_tier: string | null
  connected_at: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  wedding_id: string
  guest_id: string | null
  channel_id: string
  external_address: string
  display_name: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ConversationStatus = 'open' | 'snoozed' | 'closed'

export interface Conversation {
  id: string
  wedding_id: string
  contact_id: string
  channel_id: string
  channel_account_id: string | null
  status: ConversationStatus
  assigned_to: string | null
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  session_expires_at: string | null
  created_at: string
  updated_at: string
}

export type MessageDirection = 'inbound' | 'outbound'
export type MessageSenderType = 'guest' | 'host' | 'system' | 'ai'
export type MessageType =
  | 'text'
  | 'template'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'unsupported'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  conversation_id: string
  wedding_id: string
  direction: MessageDirection
  sender_type: MessageSenderType
  sender_user_id: string | null
  body: string | null
  message_type: MessageType
  template_id: string | null
  channel_message_id: string | null
  status: MessageStatus
  error_code: string | null
  error_message: string | null
  context_message_id: string | null
  created_at: string
  updated_at: string
}

export type MessageEventType = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted'

export interface MessageEvent {
  id: string
  message_id: string
  event_type: MessageEventType
  occurred_at: string
  error_code: string | null
  error_message: string | null
  raw_payload: unknown
  webhook_event_id: string | null
  created_at: string
}

export interface WebhookEventRow {
  id: string
  provider: ChannelType
  provider_event_id: string
  signature_verified: boolean
  raw_payload: unknown
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'ignored'
  attempt_count: number
  last_error: string | null
  received_at: string
  processed_at: string | null
}

// Normalized shape every channel adapter parses inbound webhook payloads into,
// so the processor never has to know about provider-specific JSON shapes.
export type ParsedWebhookEvent =
  | {
      kind: 'inbound_message'
      providerEventId: string
      phoneNumberId: string
      fromAddress: string
      profileName?: string
      channelMessageId: string
      occurredAt: string
      messageType: MessageType
      body?: string
      contextChannelMessageId?: string
    }
  | {
      kind: 'status_update'
      providerEventId: string
      phoneNumberId: string
      channelMessageId: string
      status: Exclude<MessageStatus, 'pending'>
      occurredAt: string
      errorCode?: string
      errorMessage?: string
    }

// The minimal shape send()/sendTypingIndicator() actually need — satisfied by
// both a whatsapp_accounts row (a wedding's own connected number) and the
// shared platform account built from env vars (lib/messaging/channels/whatsapp.ts's
// getSharedWhatsappAccount()), so callers can pass either interchangeably.
export interface WhatsappSendableAccount {
  phone_number_id: string
  access_token_secret: string | null
}

export interface SendMessageParams {
  account: WhatsappSendableAccount
  toAddress: string
  body: string
}

export interface SendMessageResult {
  ok: boolean
  channelMessageId?: string
  errorCode: string
  errorMessage?: string
}
