"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, Globe, Link as LinkIcon, ExternalLink, Edit2, Trash2, Plus, ChevronDown, ChevronRight, Calendar, Trash } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/contexts/i18n-context'
import type { Supplier, SupplierPayment } from '../types'
import { SUPPLIER_CATEGORIES_LIST } from '../types'

interface SupplierCardProps {
  supplier: Supplier
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onAddPayment: (supplier: Supplier) => void
  onEditPayment: (supplier: Supplier, payment: SupplierPayment) => void
  onDeletePayment: (payment: SupplierPayment) => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const CONTACT_ICON = {
  phone: Phone,
  email: Mail,
  website: Globe,
  other: LinkIcon,
}

export function SupplierCard({ supplier, onEdit, onDelete, onAddPayment, onEditPayment, onDeletePayment }: SupplierCardProps) {
  const { t } = useTranslation()
  const [paymentsOpen, setPaymentsOpen] = useState(false)

  const covered = supplier.covered_amount
  const total = Number(supplier.total_amount)
  const percent = total > 0 ? Math.min(100, Math.round((covered / total) * 100)) : 0
  const remaining = Math.max(0, total - covered)
  const isComplete = total > 0 && covered >= total
  const ContactIcon = CONTACT_ICON[supplier.contact_type] ?? LinkIcon
  const categoryItem = SUPPLIER_CATEGORIES_LIST.find(c => c.value === supplier.category)
  const categoryLabel = categoryItem ? t(categoryItem.labelKey) : supplier.category

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Top section */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">{supplier.name}</h3>
            <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1">
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Contact info */}
        {supplier.contact_info && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ContactIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {supplier.contact_type === 'website' || supplier.contact_type === 'other' ? (
              <a href={supplier.contact_info} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                {supplier.contact_info}
              </a>
            ) : (
              <span className="truncate">{supplier.contact_info}</span>
            )}
          </div>
        )}

        {/* Contract URL */}
        {supplier.contract_url && (
          <a
            href={supplier.contract_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {t('admin.suppliers.viewContract')}
          </a>
        )}

        {/* Budget progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('admin.suppliers.covered')}</span>
            <span className={`font-medium ${isComplete ? 'text-green-600' : ''}`}>
              {formatCurrency(covered)} / {formatCurrency(total)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{percent}% {t('admin.suppliers.paid')}</span>
            {!isComplete && total > 0 && (
              <span>{formatCurrency(remaining)} {t('admin.suppliers.remaining')}</span>
            )}
            {isComplete && <span className="text-green-600">✓ {t('admin.suppliers.fullyPaid')}</span>}
          </div>
        </div>

        {/* Notes */}
        {supplier.notes && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
            {supplier.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-1 mt-auto pt-2 border-t border-border">
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => onEdit(supplier)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(supplier)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Payments section */}
      <div className="border-t">
        <div
          role="button"
          tabIndex={0}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => setPaymentsOpen(o => !o)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPaymentsOpen(o => !o)}
        >
          <span className="flex items-center gap-1.5">
            {paymentsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {t('admin.suppliers.payments')}
            {supplier.payments.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                {supplier.payments.length}
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={e => { e.stopPropagation(); onAddPayment(supplier) }}
          >
            <Plus className="w-3 h-3" />
            {t('admin.suppliers.addPayment')}
          </Button>
        </div>

        <AnimatePresence>
          {paymentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2">
                {supplier.payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    {t('admin.suppliers.noPayments')}
                  </p>
                ) : (
                  supplier.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2 bg-muted/40 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{formatCurrency(Number(p.amount))}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(p.payment_date)}</span>
                          {p.notes && <p className="text-xs text-muted-foreground truncate">{p.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditPayment(supplier, p)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDeletePayment(p)}>
                          <Trash className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
