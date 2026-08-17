"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WeddingDatePicker } from '@/components/ui/wedding-date-picker'
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

  const fieldClass = "w-full h-10 rounded-xl border border-[#420c14]/15 bg-[#fefdfb] px-3 text-sm text-[#420c14] placeholder:text-[#420c14]/30 outline-none focus:ring-2 focus:ring-[#420c14]/15 focus:border-[#420c14]/40 transition-all"
  const labelClass = "text-xs font-medium text-[#420c14]/60 uppercase tracking-wide mb-1.5 block"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm border-[#420c14]/15 bg-[#fefdfb] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#420c14] text-lg">
            {payment ? t('admin.suppliers.editPayment') : t('admin.suppliers.addPayment')}
          </DialogTitle>
          <DialogDescription className="text-[#420c14]/40 text-sm">{supplierName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <label className={labelClass}>{t('admin.suppliers.paymentAmount')} *</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              autoFocus
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t('admin.suppliers.paymentDate')}</label>
            <WeddingDatePicker
              value={form.payment_date}
              onChange={date => setForm(p => ({ ...p, payment_date: date }))}
            />
          </div>

          <div>
            <label className={labelClass}>{t('admin.suppliers.paymentNotes')}</label>
            <Input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder={t('admin.suppliers.paymentNotesPlaceholder')}
              className={fieldClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-[#420c14]/8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-[#420c14]/15 text-sm text-[#420c14]/60 hover:bg-[#420c14]/5 hover:text-[#420c14] transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.amount || parseFloat(form.amount) <= 0}
              className="px-5 py-2 rounded-xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-colors disabled:opacity-40"
            >
              {saving ? t('admin.settings.saving') : payment ? t('common.save') : t('common.add')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
