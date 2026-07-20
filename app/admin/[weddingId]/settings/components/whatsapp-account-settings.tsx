"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/components/contexts/i18n-context"

interface WhatsappAccountSummary {
  id: string
  waba_id: string
  phone_number_id: string
  display_phone_number: string
  display_name: string | null
  status: "pending" | "connected" | "disconnected" | "error"
}

interface WhatsappAccountSettingsProps {
  weddingId: string
}

const emptyForm = {
  wabaId: "",
  phoneNumberId: "",
  displayPhoneNumber: "",
  displayName: "",
  accessTokenSecret: "",
}

// Every wedding sends/receives through the platform's shared WhatsApp number by
// default (no setup needed). This lets a wedding opt into its own dedicated
// number instead — same whatsapp_accounts row/API this always used, just
// relocated here from the inbox so connecting a number is a one-time config
// choice, not something surfaced in the messaging UI itself.
export function WhatsappAccountSettings({ weddingId }: WhatsappAccountSettingsProps) {
  const { t } = useTranslation()
  const [account, setAccount] = useState<WhatsappAccountSummary | null | undefined>(undefined)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch(`/api/messaging/whatsapp-account?weddingId=${encodeURIComponent(weddingId)}`)
      .then((res) => (res.ok ? res.json() : { account: null }))
      .then((data) => setAccount(data.account))
      .catch(() => setAccount(null))
  }

  useEffect(load, [weddingId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/messaging/whatsapp-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, ...form }),
      })
      if (res.ok) {
        setForm(emptyForm)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  if (account === undefined) return null

  return (
    <div className="space-y-6">
      {account && account.status === "connected" ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {t('admin.settings.messaging.connectedPrefix', { phone: account.display_phone_number })}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <MessageCircle className="h-4 w-4 flex-shrink-0" />
          {account ? t('admin.settings.messaging.notFullyConnected') : t('admin.settings.messaging.notConnectedYet')}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">{t('admin.settings.messaging.setupDescription')}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t('admin.settings.messaging.wabaId')}</Label>
            <Input value={form.wabaId} onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label>{t('admin.settings.messaging.phoneNumberId')}</Label>
            <Input
              value={form.phoneNumberId}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumberId: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('admin.settings.messaging.displayPhoneNumber')}</Label>
            <Input
              value={form.displayPhoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, displayPhoneNumber: e.target.value }))}
              placeholder={t('admin.settings.messaging.phonePlaceholder')}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('admin.settings.messaging.displayName')}</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="col-span-2">
            <Label>{t('admin.settings.messaging.accessToken')}</Label>
            <Input
              type="password"
              value={form.accessTokenSecret}
              onChange={(e) => setForm((f) => ({ ...f, accessTokenSecret: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !form.wabaId || !form.phoneNumberId || !form.displayPhoneNumber}
        >
          {saving ? t('admin.settings.messaging.saving') : t('admin.settings.messaging.save')}
        </Button>
      </div>
    </div>
  )
}
