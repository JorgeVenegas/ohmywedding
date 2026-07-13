"use client"

import { useRef, useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"

interface ComposerProps {
  onSend: (body: string) => Promise<void>
  onTyping?: () => void
  disabled?: boolean
}

// Meta dismisses a typing indicator after 25s, so re-firing sooner than that is
// wasted API calls; a little under it keeps "typing…" visible without gaps.
const TYPING_REFIRE_MS = 20_000

export function Composer({ onSend, onTyping, disabled }: ComposerProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const lastTypingSentAt = useRef(0)

  const handleSend = async () => {
    const body = value.trim()
    if (!body || sending) return
    setSending(true)
    try {
      await onSend(body)
      setValue("")
    } finally {
      setSending(false)
    }
  }

  const handleChange = (next: string) => {
    setValue(next)
    if (next.trim() && onTyping) {
      const now = Date.now()
      if (now - lastTypingSentAt.current > TYPING_REFIRE_MS) {
        lastTypingSentAt.current = now
        onTyping()
      }
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-3">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder={t('admin.inbox.composer.placeholder')}
        disabled={disabled || sending}
        className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
      />
      <Button size="sm" className="rounded-full" onClick={handleSend} disabled={disabled || sending || !value.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
