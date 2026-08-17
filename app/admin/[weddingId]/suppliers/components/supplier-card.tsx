"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Mail, Globe, Link as LinkIcon, ExternalLink, Edit2, Trash2,
  Plus, ChevronDown, Calendar, Trash,
  UtensilsCrossed, Image, Video, Music, Heart, Hotel, Navigation,
  Sparkles, Star, User, BookOpen, Tag,
} from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import type { Supplier, SupplierPayment } from '../types'
import { SUPPLIER_CATEGORIES_LIST } from '../types'

export const CATEGORY_ICON: Record<string, React.ElementType> = {
  catering:    UtensilsCrossed,
  photography: Image,
  videography: Video,
  music:       Music,
  flowers:     Heart,
  venue:       Hotel,
  transport:   Navigation,
  decoration:  Sparkles,
  cake:        Star,
  beauty:      User,
  officiant:   BookOpen,
  lighting:    Sparkles,
  other:       Tag,
}

const CONTACT_ICON: Record<string, React.ElementType> = {
  phone: Phone, email: Mail, website: Globe, other: LinkIcon,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

interface SupplierCardProps {
  supplier: Supplier
  onEdit: (s: Supplier) => void
  onDelete: (s: Supplier) => void
  onAddPayment: (s: Supplier) => void
  onEditPayment: (s: Supplier, p: SupplierPayment) => void
  onDeletePayment: (p: SupplierPayment) => void
}

export function SupplierCard({ supplier, onEdit, onDelete, onAddPayment, onEditPayment, onDeletePayment }: SupplierCardProps) {
  const { t } = useTranslation()
  const [paymentsOpen, setPaymentsOpen] = useState(false)

  const covered  = supplier.covered_amount
  const total    = Number(supplier.total_amount)
  const percent  = total > 0 ? Math.min(100, Math.round((covered / total) * 100)) : 0
  const remaining = Math.max(0, total - covered)
  const isComplete = total > 0 && covered >= total
  const hasAmount  = total > 0

  const ContactIcon  = CONTACT_ICON[supplier.contact_type] ?? LinkIcon
  const CategoryIcon = CATEGORY_ICON[supplier.category] ?? Tag
  const categoryItem = SUPPLIER_CATEGORIES_LIST.find(c => c.value === supplier.category)
  const categoryLabel = categoryItem ? t(categoryItem.labelKey) : supplier.category

  return (
    <div className="group flex flex-col rounded-2xl border border-[#420c14]/10 bg-white overflow-hidden hover:border-[#420c14]/20 hover:shadow-sm transition-all">

      {/* Header */}
      <div className="p-5 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CategoryIcon className="w-3.5 h-3.5 text-[#420c14]/35 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/35 mb-0.5">
                {categoryLabel}
              </p>
              <h3 className="text-[17px] font-bold text-[#420c14] leading-tight truncate">
                {supplier.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
            <button onClick={() => onEdit(supplier)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/30 hover:text-[#420c14] hover:bg-[#420c14]/5 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(supplier)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contact */}
        {supplier.contact_info && (
          <div className="flex items-center gap-1.5 text-xs text-[#420c14]/40 pl-6 mt-0.5">
            <ContactIcon className="w-3 h-3 shrink-0 text-[#420c14]/25" />
            {supplier.contact_type === 'website' || supplier.contact_type === 'other' ? (
              <a href={supplier.contact_info} target="_blank" rel="noopener noreferrer" className="truncate hover:text-[#DDA46F] transition-colors">
                {supplier.contact_info}
              </a>
            ) : (
              <span className="truncate">{supplier.contact_info}</span>
            )}
          </div>
        )}

        {/* Contract */}
        {supplier.contract_url && (
          <a href={supplier.contract_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#DDA46F] hover:text-[#c9956a] transition-colors pl-6 mt-0.5"
          >
            <ExternalLink className="w-3 h-3" />
            {t('admin.suppliers.viewContract')}
          </a>
        )}
      </div>

      {/* Budget */}
      {hasAmount ? (
        <div className="px-5 pb-5 pt-0 border-t border-[#420c14]/6 mt-0 flex flex-col gap-3 pt-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/35 mb-2">
              {t('admin.suppliers.covered')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums leading-none text-[#DDA46F]">
                {formatCurrency(covered)}
              </span>
              <span className="text-xs text-[#420c14]/35 tabular-nums">
                / {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 bg-[#420c14]/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#DDA46F]"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#420c14]/40">
              <span>{percent}% {t('admin.suppliers.paid')}</span>
              {isComplete ? (
                <span className="font-semibold text-[#420c14]/50">✓ {t('admin.suppliers.fullyPaid')}</span>
              ) : (
                <span>{formatCurrency(remaining)} {t('admin.suppliers.remaining')}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4 border-t border-[#420c14]/6 pt-4">
          <p className="text-xs text-[#420c14]/25 italic">{t('admin.suppliers.noAmount')}</p>
        </div>
      )}

      {/* Notes */}
      {supplier.notes && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-xs text-[#420c14]/40 italic border-l border-[#420c14]/15 pl-3 leading-relaxed">
            {supplier.notes}
          </p>
        </div>
      )}

      {/* Payments */}
      <div className="border-t border-[#420c14]/8 mt-auto">
        <div
          role="button"
          tabIndex={0}
          className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#420c14]/[0.02] transition-colors"
          onClick={() => setPaymentsOpen(o => !o)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPaymentsOpen(o => !o)}
        >
          <span className="flex items-center gap-2 text-[#420c14]/50">
            <ChevronDown className={`w-3 h-3 text-[#420c14]/25 transition-transform duration-200 ${paymentsOpen ? 'rotate-180' : ''}`} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em]">{t('admin.suppliers.payments')}</span>
            {supplier.payments.length > 0 && (
              <span className="text-[10px] tabular-nums text-[#420c14]/40 font-medium">
                ({supplier.payments.length})
              </span>
            )}
          </span>
          <button
            className="text-[11px] font-semibold text-[#DDA46F] hover:text-[#c9956a] transition-colors flex items-center gap-1"
            onClick={e => { e.stopPropagation(); onAddPayment(supplier) }}
          >
            <Plus className="w-3 h-3" />
            {t('admin.suppliers.addPayment')}
          </button>
        </div>

        <AnimatePresence>
          {paymentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-1.5">
                {supplier.payments.length === 0 ? (
                  <p className="text-xs text-[#420c14]/30 text-center py-2">{t('admin.suppliers.noPayments')}</p>
                ) : supplier.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 bg-[#f5f2eb] rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="w-3 h-3 text-[#420c14]/25 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[#420c14] tabular-nums">{formatCurrency(Number(p.amount))}</span>
                        <span className="text-xs text-[#420c14]/40 ml-2">{formatDate(p.payment_date)}</span>
                        {p.notes && <p className="text-xs text-[#420c14]/35 truncate mt-0.5">{p.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => onEditPayment(supplier, p)} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-[#420c14] hover:bg-white transition-colors">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDeletePayment(p)} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
