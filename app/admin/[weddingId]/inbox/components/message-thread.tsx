"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Clock, Check, CheckCheck, AlertCircle, Hourglass, MessageCircleOff } from "lucide-react"
import { Composer } from "./composer"
import { useTranslation } from "@/components/contexts/i18n-context"
import { avatarPalette } from "../lib/avatar-color"
import type { Conversation, Message, MessageStatus } from "../types"

interface MessageThreadProps {
  conversation: Conversation | null
  messages: Message[]
  onSend: (body: string) => Promise<void>
  onTyping?: () => void
}

function initials(name: string | null, fallback: string) {
  const source = (name?.trim() || fallback).replace(/^\+/, "")
  return source.slice(0, 2).toUpperCase()
}

// WhatsApp's own tick semantics: clock while in flight, one check once accepted
// by Meta, two gray checks once delivered to the guest's device, two blue
// checks once they've read it.
function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />
    case "sent":
      return <Check className="h-3 w-3" />
    case "delivered":
      return <CheckCheck className="h-3 w-3" />
    case "read":
      return <CheckCheck className="h-3 w-3 text-sky-400" />
    case "failed":
      return <AlertCircle className="h-3 w-3" />
  }
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

  function sessionInfo(expiresAt: string | null): { label: string; open: boolean } {
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
  const session = sessionInfo(conversation.session_expires_at)
  const palette = avatarPalette(contact?.id ?? conversation.contact_id)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/[0.07] via-transparent to-transparent px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ${palette.bg} ${palette.text} ${palette.ring}`}
          >
            {initials(contact?.display_name ?? null, contact?.external_address ?? "?")}
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{contact?.external_address}</p>
          </div>
        </div>
        <span
          className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${
            session.open
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {session.open ? <Hourglass className="h-3 w-3" /> : <MessageCircleOff className="h-3 w-3" />}
          {session.label}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.05),_transparent_55%)] px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm font-serif text-brand/50">{t('admin.inbox.messageThread.noMessages')}</p>
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
                className={`max-w-[65%] rounded-2xl border px-3.5 py-2 text-sm shadow-sm ${
                  fromRight
                    ? "rounded-br-sm border-primary/70 bg-primary/10 text-foreground"
                    : "rounded-bl-sm border-border/60 bg-card text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body || `[${message.message_type}]`}</p>
                {fromRight && (
                  <p
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      notConfigured ? "font-semibold text-amber-600" : "text-muted-foreground"
                    }`}
                  >
                    {notConfigured ? (
                      t('admin.inbox.messageThread.notSent')
                    ) : (
                      <>
                        {STATUS_LABEL[message.status]}
                        <StatusIcon status={message.status} />
                      </>
                    )}
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
