"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/components/contexts/i18n-context"
import { TimelineItem } from "../types"

interface EditPaymentModalProps {
  open: boolean
  item: TimelineItem | null
  onClose: () => void
  onSave: (data: { amount: number; payment_date: string; notes: string | null }) => Promise<void>
}

export function EditPaymentModal({ open, item, onClose, onSave }: EditPaymentModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    payment_date: '',
    notes: '',
  })

  useEffect(() => {
    if (item) {
      setForm({
        amount: item.payment_amount != null ? String(item.payment_amount) : '',
        payment_date: item.date,
        notes: item.description ?? '',
      })
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.payment_date) return
    setSaving(true)
    try {
      await onSave({
        amount: Number(form.amount),
        payment_date: form.payment_date,
        notes: form.notes || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('admin.timeline.fields.supplier')}: {item?.supplier_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="amount">{t('admin.timeline.fields.amount')} *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="payment_date">{t('admin.timeline.fields.paymentDate')} *</Label>
            <Input
              id="payment_date"
              type="date"
              value={form.payment_date}
              onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">{t('admin.timeline.fields.notes')}</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.amount || !form.payment_date}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
