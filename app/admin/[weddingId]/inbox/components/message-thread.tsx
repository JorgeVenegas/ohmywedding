"use client"

import { useEffect, useRef } from "react"
import { Composer } from "./composer"
import { useTranslation } from "@/components/contexts/i18n-context"
import type { Conversation, Message, MessageStatus } from "../types"

interface MessageThreadProps {
  conversation: Conversation | null
  messages: Message[]
  onSend: (body: string) => Promise<void>
}

export function MessageThread({ conversation, messages, onSend }: MessageThreadProps) {
  const { t } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)

  const STATUS_LABEL: Record<MessageStatus, string> = {
    pending: t('admin.inbox.messageThread.status.pending'),
    sent: t('admin.inbox.messageThread.status.sent'),
    delivered: t('admin.inbox.messageThread.status.delivered'),
    read: t('admin.inbox.messageThread.status.read'),
    failed: t('admin.inbox.messageThread.status.failed'),
  }

  function sessionLabel(expiresAt: string | null): { label: string; open: boolean } {
    if (!expiresAt) return { label: t('admin.inbox.messageThread.session.none'), open: false }
    const msLeft = new Date(expiresAt).getTime() - Date.now()
    if (msLeft <= 0) return { label: t('admin.inbox.messageThread.session.closed'), open: false }
    const hours = Math.floor(msLeft / 3_600_000)
    const minutes = Math.floor((msLeft % 3_600_000) / 60_000)
    return {
      label: t('admin.inbox.messageThread.session.open', { hours, minutes }),
      open: true,
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        {t('admin.inbox.messageThread.selectConversation')}
      </div>
    )
  }

  const contact = conversation.contacts
  const name = contact?.display_name || contact?.external_address || t('admin.inbox.unknownContact')
  const session = sessionLabel(conversation.session_expires_at)

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{contact?.external_address}</p>
        </div>
        <span className={`text-xs font-medium ${session.open ? "text-emerald-600" : "text-amber-600"}`}>
          {session.label}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-muted-foreground">{t('admin.inbox.messageThread.noMessages')}</p>
        )}
        {messages.map((message) => {
          const notConfigured = message.status === "failed" && message.error_code === "no_provider_configured"
          return (
            <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[65%] rounded-2xl border px-3.5 py-2 text-sm ${
                  message.direction === "outbound"
                    ? "rounded-br-sm border-primary bg-muted text-foreground"
                    : "rounded-bl-sm border-transparent bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body || `[${message.message_type}]`}</p>
                {message.direction === "outbound" && (
                  <p className={`mt-1 text-[10px] ${notConfigured ? "font-semibold text-amber-600" : "text-muted-foreground"}`}>
                    {notConfigured ? t('admin.inbox.messageThread.notSent') : STATUS_LABEL[message.status]}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={onSend} />
    </div>
  )
}
