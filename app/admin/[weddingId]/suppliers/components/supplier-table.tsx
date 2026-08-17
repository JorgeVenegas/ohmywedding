"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Mail, Globe, Link as LinkIcon, ExternalLink,
  Edit2, Trash2, Plus, ChevronDown, Calendar, Trash, Tag,
} from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import type { Supplier, SupplierPayment } from '../types'
import { SUPPLIER_CATEGORIES_LIST } from '../types'
import { CATEGORY_ICON } from './supplier-card'

interface SupplierTableProps {
  suppliers: Supplier[]
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onAddPayment: (supplier: Supplier) => void
  onEditPayment: (supplier: Supplier, payment: SupplierPayment) => void
  onDeletePayment: (payment: SupplierPayment) => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const CONTACT_ICON: Record<string, React.ElementType> = {
  phone: Phone, email: Mail, website: Globe, other: LinkIcon,
}

function SupplierRow({
  supplier, onEdit, onDelete, onAddPayment, onEditPayment, onDeletePayment,
}: {
  supplier: Supplier
  onEdit: (s: Supplier) => void
  onDelete: (s: Supplier) => void
  onAddPayment: (s: Supplier) => void
  onEditPayment: (s: Supplier, p: SupplierPayment) => void
  onDeletePayment: (p: SupplierPayment) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const covered    = supplier.covered_amount
  const total      = Number(supplier.total_amount)
  const percent    = total > 0 ? Math.min(100, Math.round((covered / total) * 100)) : 0
  const isComplete = total > 0 && covered >= total
  const hasAmount  = total > 0

  const ContactIcon  = CONTACT_ICON[supplier.contact_type] ?? LinkIcon
  const CategoryIcon = CATEGORY_ICON[supplier.category] ?? Tag
  const categoryItem = SUPPLIER_CATEGORIES_LIST.find(c => c.value === supplier.category)
  const categoryLabel = categoryItem ? t(categoryItem.labelKey) : supplier.category

  return (
    <>
      <tr
        className="group border-b border-[#420c14]/6 hover:bg-[#420c14]/[0.018] transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Supplier name + category */}
        <td className="py-3.5 pl-5 pr-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#420c14]/5">
              <CategoryIcon className="w-3.5 h-3.5 text-[#420c14]/40" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#420c14] leading-tight truncate max-w-[200px]">
                {supplier.name}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#420c14]/35 mt-0.5">
                {categoryLabel}
              </p>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="py-3.5 px-3 hidden md:table-cell">
          {supplier.contact_info ? (
            <div
              className="flex items-center gap-1.5 text-xs text-[#420c14]/45"
              onClick={e => e.stopPropagation()}
            >
              <ContactIcon className="w-3 h-3 text-[#420c14]/25 shrink-0" />
              {supplier.contact_type === 'website' || supplier.contact_type === 'other' ? (
                <a
                  href={supplier.contact_info}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate max-w-[140px] hover:text-[#DDA46F] transition-colors"
                >
                  {supplier.contact_info}
                </a>
              ) : (
                <span className="truncate max-w-[140px]">{supplier.contact_info}</span>
              )}
            </div>
          ) : (
            <span className="text-[#420c14]/20 text-xs">—</span>
          )}
        </td>

        {/* Budget progress */}
        <td className="py-3.5 px-3 hidden lg:table-cell">
          {hasAmount ? (
            <div className="w-36">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="font-bold tabular-nums text-[#DDA46F]">
                  {formatCurrency(covered)}
                </span>
                <span className="text-[#420c14]/30 tabular-nums">{formatCurrency(total)}</span>
              </div>
              <div className="h-1 bg-[#420c14]/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#DDA46F]"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[#420c14]/20 text-xs">—</span>
          )}
        </td>

        {/* Status */}
        <td className="py-3.5 px-3">
          {!hasAmount ? (
            <span className="text-[10px] text-[#420c14]/25">—</span>
          ) : isComplete ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#420c14]/55 bg-[#420c14]/6 border border-[#420c14]/10 px-2 py-0.5 rounded-full">
              ✓ {t('admin.suppliers.fullyPaid')}
            </span>
          ) : (
            <span className="inline-flex items-center text-[10px] font-bold tabular-nums text-[#DDA46F] bg-[#DDA46F]/10 border border-[#DDA46F]/20 px-2 py-0.5 rounded-full">
              {percent}%
            </span>
          )}
        </td>

        {/* Payments count + expand */}
        <td className="py-3.5 px-3 hidden sm:table-cell">
          <div className="flex items-center gap-2">
            {supplier.payments.length > 0 ? (
              <span className="text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-full bg-[#420c14]/5 text-[#420c14]/45 border border-[#420c14]/8">
                {supplier.payments.length}
              </span>
            ) : (
              <span className="text-[#420c14]/20 text-xs">0</span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-[#420c14]/20 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </td>

        {/* Actions */}
        <td className="py-3.5 pl-3 pr-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddPayment(supplier)}
              className="h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-[#DDA46F] hover:bg-[#DDA46F]/10 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden xl:inline">{t('admin.suppliers.addPayment')}</span>
            </button>
            <button
              onClick={() => onEdit(supplier)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-[#420c14] hover:bg-[#420c14]/5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {supplier.contract_url && (
              <a
                href={supplier.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-[#DDA46F] hover:bg-[#DDA46F]/8 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => onDelete(supplier)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/20 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded payment history */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="p-0 border-b border-[#420c14]/6">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="bg-[#f5f2eb]/50 px-6 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/35">
                      {t('admin.suppliers.payments')}
                    </p>
                    <button
                      onClick={() => onAddPayment(supplier)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#DDA46F] hover:text-[#c9956a] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {t('admin.suppliers.addPayment')}
                    </button>
                  </div>

                  {supplier.payments.length === 0 ? (
                    <p className="text-xs text-[#420c14]/30 py-1">{t('admin.suppliers.noPayments')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {supplier.payments.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5 border border-[#420c14]/8"
                        >
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-3 h-3 text-[#420c14]/25 shrink-0" />
                            <span className="text-sm font-bold text-[#420c14] tabular-nums">
                              {formatCurrency(Number(p.amount))}
                            </span>
                            <span className="text-xs text-[#420c14]/40">{formatDate(p.payment_date)}</span>
                            {p.notes && (
                              <span className="text-xs text-[#420c14]/30 hidden sm:inline">· {p.notes}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onEditPayment(supplier, p)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-[#420c14] hover:bg-[#420c14]/5 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeletePayment(p)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#420c14]/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

export function SupplierTable({
  suppliers, onEdit, onDelete, onAddPayment, onEditPayment, onDeletePayment,
}: SupplierTableProps) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-[#420c14]/10 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#420c14]/10 bg-[#420c14]/[0.025]">
              <th className="py-2.5 pl-5 pr-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/40">
                {t('admin.suppliers.supplier')}
              </th>
              <th className="py-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/40 hidden md:table-cell">
                {t('admin.suppliers.contactInfo')}
              </th>
              <th className="py-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/40 hidden lg:table-cell">
                {t('admin.suppliers.stats.budget')}
              </th>
              <th className="py-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/40">
                {t('admin.suppliers.stats.covered')}
              </th>
              <th className="py-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#420c14]/40 hidden sm:table-cell">
                {t('admin.suppliers.payments')}
              </th>
              <th className="py-2.5 pl-3 pr-5" />
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <SupplierRow
                key={s.id}
                supplier={s}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddPayment={onAddPayment}
                onEditPayment={onEditPayment}
                onDeletePayment={onDeletePayment}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
