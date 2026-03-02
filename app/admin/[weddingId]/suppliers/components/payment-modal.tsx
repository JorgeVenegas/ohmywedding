"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/components/contexts/i18n-context'
import type { SupplierPayment } from '../types'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<SupplierPayment>) => Promise<void>
  payment?: SupplierPayment | null
  supplierName: string
  saving: boolean
}

export function PaymentModal({ open, onClose, onSave, payment, supplierName, saving }: PaymentModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    if (open) {
      if (payment) {
        setForm({
          amount: String(payment.amount),
          payment_date: payment.payment_date,
          notes: payment.notes || '',
        })
      } else {
        setForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' })
      }
    }
  }, [open, payment])

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return
    await onSave({
      ...(payment?.id ? { id: payment.id } : {}),
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      notes: form.notes.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle>
            {payment ? t('admin.suppliers.editPayment') : t('admin.suppliers.addPayment')}
          </DialogTitle>
          <DialogDescription>{supplierName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.paymentAmount')} *</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.paymentDate')}</label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.paymentNotes')}</label>
            <Input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder={t('admin.suppliers.paymentNotesPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !form.amount || parseFloat(form.amount) <= 0}>
              {saving ? t('admin.settings.saving') : payment ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
