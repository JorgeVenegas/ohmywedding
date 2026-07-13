"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ChevronDown, ChevronUp, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/components/contexts/i18n-context"

interface WhatsappAccountSummary {
  id: string
  waba_id: string
  phone_number_id: string
  display_phone_number: string
  display_name: string | null
  status: "pending" | "connected" | "disconnected" | "error"
}

interface ConnectWhatsappFormProps {
  weddingId: string
}

const emptyForm = {
  wabaId: "",
  phoneNumberId: "",
  displayPhoneNumber: "",
  displayName: "",
  accessTokenSecret: "",
}

export function ConnectWhatsappForm({ weddingId }: ConnectWhatsappFormProps) {
  const { t } = useTranslation()
  const [account, setAccount] = useState<WhatsappAccountSummary | null | undefined>(undefined)
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch(`/api/messaging/whatsapp-account?weddingId=${encodeURIComponent(weddingId)}`)
      .then((res) => (res.ok ? res.json() : { account: null }))
      .then((data) => setAccount(data.account))
      .catch(() => setAccount(null))
  }

  useEffect(load, [weddingId])

  if (account === undefined) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/messaging/whatsapp-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, ...form }),
      })
      if (res.ok) {
        setExpanded(false)
        setForm(emptyForm)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  if (account && account.status === "connected" && !expanded) {
    return (
      <div className="flex items-center justify-between border-b border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />{" "}
          {t('admin.inbox.connectWhatsapp.connectedPrefix', { phone: account.display_phone_number })}
        </span>
        <button onClick={() => setExpanded(true)} className="underline">
          {t('admin.inbox.connectWhatsapp.edit')}
        </button>
      </div>
    )
  }

  return (
    <div className="border-b border-border bg-muted/30">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-amber-600" />
          {account
            ? t('admin.inbox.connectWhatsapp.notFullyConnected')
            : t('admin.inbox.connectWhatsapp.connectPrompt')}
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {expanded && (
        <Card className="mx-4 mb-3 space-y-2 p-4">
          <p className="text-xs text-muted-foreground">{t('admin.inbox.connectWhatsapp.setupDescription')}</p>
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput
              label={t('admin.inbox.connectWhatsapp.wabaId')}
              value={form.wabaId}
              onChange={(v) => setForm((f) => ({ ...f, wabaId: v }))}
            />
            <LabeledInput
              label={t('admin.inbox.connectWhatsapp.phoneNumberId')}
              value={form.phoneNumberId}
              onChange={(v) => setForm((f) => ({ ...f, phoneNumberId: v }))}
            />
            <LabeledInput
              label={t('admin.inbox.connectWhatsapp.displayPhoneNumber')}
              value={form.displayPhoneNumber}
              onChange={(v) => setForm((f) => ({ ...f, displayPhoneNumber: v }))}
              placeholder={t('admin.inbox.connectWhatsapp.phonePlaceholder')}
            />
            <LabeledInput
              label={t('admin.inbox.connectWhatsapp.displayName')}
              value={form.displayName}
              onChange={(v) => setForm((f) => ({ ...f, displayName: v }))}
            />
            <div className="col-span-2">
              <LabeledInput
                label={t('admin.inbox.connectWhatsapp.accessToken')}
                value={form.accessTokenSecret}
                onChange={(v) => setForm((f) => ({ ...f, accessTokenSecret: v }))}
                type="password"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !form.wabaId || !form.phoneNumberId || !form.displayPhoneNumber}
          >
            {saving ? t('admin.inbox.connectWhatsapp.saving') : t('admin.inbox.connectWhatsapp.save')}
          </Button>
        </Card>
      )}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  )
}
