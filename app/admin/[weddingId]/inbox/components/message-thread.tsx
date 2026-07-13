"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Composer } from "./composer"
import { useTranslation } from "@/components/contexts/i18n-context"
import type { Conversation, Message, MessageStatus } from "../types"

interface MessageThreadProps {
  conversation: Conversation | null
  messages: Message[]
  onSend: (body: string) => Promise<void>
  onTyping?: () => void
}

export function MessageThread({ conversation, messages, onSend, onTyping }: MessageThreadProps) {
  const { t } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Only animate messages that just arrived/were just sent — not the whole
  // history replaying every time a conversation is opened or refetched.
  const previousMessageIds = useRef<Set<string>>(new Set())
  const previousConversationId = useRef<string | null>(null)
  const conversationChanged = conversation?.id !== previousConversationId.current
  const newMessageIds = conversationChanged
    ? new Set<string>()
    : new Set(messages.filter((m) => !previousMessageIds.current.has(m.id)).map((m) => m.id))
  previousConversationId.current = conversation?.id ?? null
  previousMessageIds.current = new Set(messages.map((m) => m.id))

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
          const fromRight = message.direction === "outbound"
          return (
            <motion.div
              key={message.id}
              layout
              initial={newMessageIds.has(message.id) ? { opacity: 0, y: 10, scale: 0.96, x: fromRight ? 8 : -8 } : false}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
              className={`flex ${fromRight ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[65%] rounded-2xl border px-3.5 py-2 text-sm ${
                  fromRight
                    ? "rounded-br-sm border-primary bg-muted text-foreground"
                    : "rounded-bl-sm border-transparent bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body || `[${message.message_type}]`}</p>
                {fromRight && (
                  <p className={`mt-1 text-[10px] ${notConfigured ? "font-semibold text-amber-600" : "text-muted-foreground"}`}>
                    {notConfigured ? t('admin.inbox.messageThread.notSent') : STATUS_LABEL[message.status]}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={onSend} onTyping={onTyping} />
    </div>
  )
}
