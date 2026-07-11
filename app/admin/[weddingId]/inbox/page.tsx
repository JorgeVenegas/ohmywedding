"use client"

import { use, useCallback, useEffect, useState } from "react"
import { MessageCircleOff } from "lucide-react"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useMessagingRealtime } from "@/hooks/use-messaging-realtime"
import { ConversationList, MessageThread, GuestContextPanel, ConnectWhatsappForm } from "./components"
import type { Conversation, ConversationDetail, Message } from "./types"

interface InboxPageProps {
  params: Promise<{ weddingId: string }>
}

export default function InboxPage({ params }: InboxPageProps) {
  const { weddingId: rawWeddingId } = use(params)
  const weddingId = decodeURIComponent(rawWeddingId)

  // Restricted-rollout gate (MESSAGING_ENABLED_WEDDING_IDS / MESSAGING_GA — see
  // lib/messaging/feature-flag.ts). This is UX only: every messaging API route
  // enforces the same check server-side regardless of what this renders.
  const [messagingEnabled, setMessagingEnabled] = useState<boolean | null>(null)

  const [weddingUuid, setWeddingUuid] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    const res = await fetch(`/api/messaging/conversations?weddingId=${encodeURIComponent(weddingId)}`)
    if (!res.ok) return
    const data = await res.json()
    setConversations(data.conversations ?? [])
    setWeddingUuid(data.weddingId ?? null)
  }, [weddingId])

  useEffect(() => {
    fetch(`/api/messaging/feature-flag?weddingId=${encodeURIComponent(weddingId)}`)
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data) => setMessagingEnabled(Boolean(data.enabled)))
      .catch(() => setMessagingEnabled(false))
  }, [weddingId])

  useEffect(() => {
    if (!messagingEnabled) {
      setLoading(false)
      return
    }
    loadConversations().finally(() => setLoading(false))
  }, [messagingEnabled, loadConversations])

  // First Realtime usage in this codebase (design doc §7.3) — refetch on any
  // change rather than hand-merging payloads into local state.
  useMessagingRealtime(weddingUuid, loadConversations)

  const loadConversationDetail = useCallback(async (conversationId: string) => {
    const [detailRes, messagesRes] = await Promise.all([
      fetch(`/api/messaging/conversations/${conversationId}`),
      fetch(`/api/messaging/conversations/${conversationId}/messages`),
    ])
    if (detailRes.ok) setDetail(await detailRes.json())
    if (messagesRes.ok) setMessages((await messagesRes.json()).messages ?? [])
  }, [])

  const handleSelect = useCallback(
    async (conversationId: string) => {
      setSelectedId(conversationId)
      await loadConversationDetail(conversationId)
      fetch(`/api/messaging/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markRead: true }),
      }).then(loadConversations)
    },
    [loadConversationDetail, loadConversations]
  )

  // Realtime pushes a fresh conversation list, but the open thread also needs the
  // new message appended without waiting for a manual re-select.
  useEffect(() => {
    if (!selectedId) return
    loadConversationDetail(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations])

  const handleSend = useCallback(
    async (body: string) => {
      if (!selectedId) return
      const res = await fetch("/api/messaging/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, body }),
      })
      if (res.ok) {
        await Promise.all([loadConversationDetail(selectedId), loadConversations()])
      }
    },
    [selectedId, loadConversationDetail, loadConversations]
  )

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? detail?.conversation ?? null

  if (messagingEnabled === false) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, "dashboard")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <MessageCircleOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Inbox isn't available for this wedding yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            WhatsApp messaging is rolling out gradually. Reach out if you'd like early access.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header showBackButton backHref={getCleanAdminUrl(weddingId, "dashboard")} />
      <ConnectWhatsappForm weddingId={weddingId} />

      {loading || messagingEnabled === null ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading inbox…</div>
      ) : (
        <div className="grid flex-1 grid-cols-[260px_1fr_290px] overflow-hidden">
          <ConversationList conversations={conversations} selectedId={selectedId} onSelect={handleSelect} />
          <MessageThread conversation={selectedConversation} messages={messages} onSend={handleSend} />
          <GuestContextPanel
            weddingId={weddingId}
            contactId={selectedConversation?.contact_id ?? null}
            detail={detail}
            onLinked={() => {
              if (selectedId) loadConversationDetail(selectedId)
              loadConversations()
            }}
          />
        </div>
      )}
    </main>
  )
}
