"use client"

import { formatDistanceToNowStrict } from "date-fns"
import { es as esLocale } from "date-fns/locale"
import { useTranslation } from "@/components/contexts/i18n-context"
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
    <div className="flex h-full flex-col border-r border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{t('admin.inbox.conversationList.title')}</span>
        <span className="text-xs text-muted-foreground">
          {t('admin.inbox.conversationList.openCount', { count: openCount })}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">{t('admin.inbox.conversationList.empty')}</div>
        )}
        {conversations.map((conversation) => {
          const contact = conversation.contacts
          const name = contact?.display_name || contact?.external_address || t('admin.inbox.unknownContact')
          const active = conversation.id === selectedId
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                active ? "border-l-2 border-l-primary bg-primary/10 pl-[14px]" : ""
              }`}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary/30 text-xs font-semibold text-secondary-foreground">
                {initials(contact?.display_name ?? null, contact?.external_address ?? "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                  {conversation.last_message_at && (
                    <time className="flex-shrink-0 text-[10px] text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(conversation.last_message_at), {
                        locale: locale === 'es' ? esLocale : undefined,
                      })}
                    </time>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.last_message_preview || t('admin.inbox.conversationList.noMessagesPreview')}
                </p>
              </div>
              {conversation.unread_count > 0 && (
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
