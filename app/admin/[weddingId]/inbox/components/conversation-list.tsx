"use client"

import { formatDistanceToNowStrict } from "date-fns"
import { es as esLocale } from "date-fns/locale"
import { useTranslation } from "@/components/contexts/i18n-context"
import { avatarPalette } from "../lib/avatar-color"
import type { Conversation } from "../types"

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function initials(name: string | null, fallback: string) {
  const source = (name?.trim() || fallback).replace(/^\+/, "")
  return source.slice(0, 2).toUpperCase()
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const { t, locale } = useTranslation()
  const openCount = conversations.filter((c) => c.status === "open").length

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-serif text-sm font-semibold text-foreground">
          {t('admin.inbox.conversationList.title')}
        </span>
        {openCount > 0 && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {t('admin.inbox.conversationList.openCount', { count: openCount })}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="p-6 text-center text-sm font-serif text-brand/50">{t('admin.inbox.conversationList.empty')}</div>
        )}
        {conversations.map((conversation) => {
          const contact = conversation.contacts
          const name = contact?.display_name || contact?.external_address || t('admin.inbox.unknownContact')
          const active = conversation.id === selectedId
          const unread = conversation.unread_count > 0
          const palette = avatarPalette(contact?.id ?? conversation.contact_id)
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`relative flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                active ? "border-l-[3px] border-l-primary bg-primary/10 pl-[13px] shadow-[inset_0_0_0_1px_rgba(212,165,116,0.08)]" : ""
              }`}
            >
              {!active && unread && (
                <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ${palette.bg} ${palette.text} ${palette.ring}`}
              >
                {initials(contact?.display_name ?? null, contact?.external_address ?? "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${unread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                    {name}
                  </span>
                  {conversation.last_message_at && (
                    <time className={`flex-shrink-0 text-[10px] ${unread ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {formatDistanceToNowStrict(new Date(conversation.last_message_at), {
                        locale: locale === 'es' ? esLocale : undefined,
                      })}
                    </time>
                  )}
                </div>
                <p className={`truncate text-xs ${unread ? "font-medium text-foreground/80" : "text-muted-foreground"}`}>
                  {conversation.last_message_preview || t('admin.inbox.conversationList.noMessagesPreview')}
                </p>
              </div>
              {unread && (
                <span className="flex h-4 min-w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {conversation.unread_count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
