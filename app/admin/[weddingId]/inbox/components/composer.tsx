"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ComposerProps {
  onSend: (body: string) => Promise<void>
  disabled?: boolean
}

export function Composer({ onSend, disabled }: ComposerProps) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)

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

  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Type a message…"
        disabled={disabled || sending}
        className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
      />
      <Button size="sm" className="rounded-full" onClick={handleSend} disabled={disabled || sending || !value.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
