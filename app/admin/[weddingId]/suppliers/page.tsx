"use client"

import { use, useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { toast } from "sonner"
import { Plus, Handshake, TrendingUp, LayoutGrid, List } from "lucide-react"
import { SupplierCard, SupplierTable, SupplierModal, PaymentModal } from "./components"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import type { Supplier, SupplierPayment } from "./types"

interface SuppliersPageProps {
  params: Promise<{ weddingId: string }>
}

export default function SuppliersPage({ params }: SuppliersPageProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Supplier modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null)
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null)

  // Delete confirm state
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null)
  const [deletePayment, setDeletePayment] = useState<SupplierPayment | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}`)
      const data = await res.json()
      setSuppliers(data.suppliers || [])
    } catch {
      toast.error(t('admin.suppliers.notifications.error'))
    } finally {
      setLoading(false)
    }
  }, [decodedWeddingId, t])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Supplier CRUD ───────────────────────────────────────────────────────────

  const handleSaveSupplier = async (data: Partial<Supplier>) => {
    setSaving(true)
    try {
      const isEdit = !!data.id
      const url = isEdit
        ? `/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}&supplierId=${data.id}`
        : `/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(isEdit ? t('admin.suppliers.notifications.updated') : t('admin.suppliers.notifications.created'))
      setShowSupplierModal(false)
      setEditingSupplier(null)
      fetchData()
    } catch {
      toast.error(t('admin.suppliers.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDeleteSupplier = async () => {
    if (!deleteSupplier) return
    setSaving(true)
    try {
      await fetch(`/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}&supplierId=${deleteSupplier.id}`, { method: 'DELETE' })
      toast.success(t('admin.suppliers.notifications.deleted'))
      setDeleteSupplier(null)
      fetchData()
    } catch {
      toast.error(t('admin.suppliers.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Payment CRUD ────────────────────────────────────────────────────────────

  const handleSavePayment = async (data: Partial<SupplierPayment>) => {
    if (!paymentSupplier) return
    setSaving(true)
    try {
      const isEdit = !!data.id
      const url = isEdit
        ? `/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}&paymentId=${data.id}&type=payment`
        : `/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}&type=payment`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, supplier_id: paymentSupplier.id }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(isEdit ? t('admin.suppliers.notifications.paymentUpdated') : t('admin.suppliers.notifications.paymentAdded'))
      setShowPaymentModal(false)
      setPaymentSupplier(null)
      setEditingPayment(null)
      fetchData()
    } catch {
      toast.error(t('admin.suppliers.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDeletePayment = async () => {
    if (!deletePayment) return
    setSaving(true)
    try {
      await fetch(`/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}&paymentId=${deletePayment.id}&type=payment`, { method: 'DELETE' })
      toast.success(t('admin.suppliers.notifications.paymentDeleted'))
      setDeletePayment(null)
      fetchData()
    } catch {
      toast.error(t('admin.suppliers.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const totalBudget = suppliers.reduce((s, sup) => s + Number(sup.total_amount), 0)
  const totalCovered = suppliers.reduce((s, sup) => s + sup.covered_amount, 0)
  const totalRemaining = Math.max(0, totalBudget - totalCovered)
  const fullyPaid = suppliers.filter(s => Number(s.total_amount) > 0 && s.covered_amount >= Number(s.total_amount)).length

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  // ─── Render ──────────────────────────────────────────────────────────────────

  const openAddModal = () => { setEditingSupplier(null); setShowSupplierModal(true) }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, 'dashboard')} title={t('admin.suppliers.title')} />
        <div className="page-container flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title={t('admin.suppliers.title')}
        rightContent={
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#420c14] text-[#f5f2eb] px-4 py-2 text-sm font-medium hover:bg-[#5a1a22] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('admin.suppliers.addSupplier')}</span>
          </button>
        }
      />

      <div className="page-container space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">{t('admin.dashboard.management')}</p>
            <h1 className="text-2xl font-serif text-[#420c14] mb-1">{t('admin.suppliers.title')}</h1>
            <p className="text-sm text-[#420c14]/60">{t('admin.suppliers.description')}</p>
          </div>
          {suppliers.length > 0 && (
            <div className="flex items-center rounded-xl border border-[#420c14]/12 overflow-hidden shrink-0 mb-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-9 h-9 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#420c14] text-[#f5f2eb]' : 'text-[#420c14]/35 hover:bg-[#420c14]/5'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`w-9 h-9 flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-[#420c14] text-[#f5f2eb]' : 'text-[#420c14]/35 hover:bg-[#420c14]/5'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {suppliers.length > 0 && (
          <div className="rounded-2xl border border-[#420c14]/10 bg-white overflow-hidden">
            {/* Budget progress bar */}
            <div className="h-1 bg-[#420c14]/5">
              <div
                className="h-full bg-gradient-to-r from-[#DDA46F] to-[#c9956a] transition-all duration-700"
                style={{ width: totalBudget > 0 ? `${Math.min(100, Math.round((totalCovered / totalBudget) * 100))}%` : '0%' }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#420c14]/8">
              <div className="px-5 py-4">
                <div className="text-[10px] uppercase tracking-widest text-[#420c14]/35 mb-1">{t('admin.suppliers.stats.total')}</div>
                <div className="text-xl font-serif text-[#420c14]">{suppliers.length}</div>
                <div className="text-[11px] text-[#420c14]/35 mt-0.5">{fullyPaid} {t('admin.suppliers.stats.fullyPaid')}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-[10px] uppercase tracking-widest text-[#420c14]/35 mb-1">{t('admin.suppliers.stats.budget')}</div>
                <div className="text-xl font-serif text-[#420c14] tabular-nums">{formatCurrency(totalBudget)}</div>
                <div className="text-[11px] text-[#420c14]/35 mt-0.5">{t('admin.suppliers.stats.total')} {t('admin.suppliers.stats.committed')}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-[10px] uppercase tracking-widest text-[#420c14]/35 mb-1">{t('admin.suppliers.stats.covered')}</div>
                <div className="text-xl font-serif text-[#DDA46F] tabular-nums">{formatCurrency(totalCovered)}</div>
                <div className="text-[11px] text-[#420c14]/35 mt-0.5">
                  {totalBudget > 0 ? `${Math.min(100, Math.round((totalCovered / totalBudget) * 100))}%` : '—'} {t('admin.suppliers.paid')}
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="text-[10px] uppercase tracking-widest text-[#420c14]/35 mb-1">{t('admin.suppliers.stats.remaining')}</div>
                <div className={`text-xl font-serif tabular-nums ${totalRemaining > 0 ? 'text-[#420c14]' : 'text-[#420c14]/30'}`}>
                  {formatCurrency(totalRemaining)}
                </div>
                <div className="text-[11px] text-[#420c14]/35 mt-0.5 flex items-center gap-1">
                  {totalRemaining > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : null}
                  {totalRemaining > 0 ? t('admin.suppliers.stats.pending') : t('admin.suppliers.fullyPaid')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {suppliers.length === 0 ? (
          <div className="rounded-2xl border border-[#420c14]/10 bg-white p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#420c14]/5 flex items-center justify-center mx-auto mb-5">
              <Handshake className="w-6 h-6 text-[#420c14]/30" />
            </div>
            <h3 className="text-lg font-serif text-[#420c14] mb-2">{t('admin.suppliers.empty.title')}</h3>
            <p className="text-sm text-[#420c14]/50 mb-6 max-w-sm mx-auto leading-relaxed">{t('admin.suppliers.empty.description')}</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#420c14] text-[#f5f2eb] px-5 py-2.5 text-sm font-medium hover:bg-[#5a1a22] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('admin.suppliers.addSupplier')}
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <SupplierTable
            suppliers={suppliers}
            onEdit={s => { setEditingSupplier(s); setShowSupplierModal(true) }}
            onDelete={s => setDeleteSupplier(s)}
            onAddPayment={s => { setPaymentSupplier(s); setEditingPayment(null); setShowPaymentModal(true) }}
            onEditPayment={(s, p) => { setPaymentSupplier(s); setEditingPayment(p); setShowPaymentModal(true) }}
            onDeletePayment={p => setDeletePayment(p)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(supplier => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={s => { setEditingSupplier(s); setShowSupplierModal(true) }}
                onDelete={s => setDeleteSupplier(s)}
                onAddPayment={s => { setPaymentSupplier(s); setEditingPayment(null); setShowPaymentModal(true) }}
                onEditPayment={(s, p) => { setPaymentSupplier(s); setEditingPayment(p); setShowPaymentModal(true) }}
                onDeletePayment={p => setDeletePayment(p)}
              />
            ))}
          </div>
        )}
      </div>

      <SupplierModal
        open={showSupplierModal}
        onClose={() => { setShowSupplierModal(false); setEditingSupplier(null) }}
        onSave={handleSaveSupplier}
        supplier={editingSupplier}
        saving={saving}
      />

      <PaymentModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentSupplier(null); setEditingPayment(null) }}
        onSave={handleSavePayment}
        payment={editingPayment}
        supplierName={paymentSupplier?.name ?? ''}
        saving={saving}
      />

      <ConfirmDeleteDialog
        isOpen={!!deleteSupplier}
        componentType={deleteSupplier?.name ?? t('admin.suppliers.supplier')}
        onConfirm={handleConfirmDeleteSupplier}
        onCancel={() => setDeleteSupplier(null)}
      />

      <ConfirmDeleteDialog
        isOpen={!!deletePayment}
        componentType={t('admin.suppliers.payment')}
        onConfirm={handleConfirmDeletePayment}
        onCancel={() => setDeletePayment(null)}
      />
    </main>
  )
}
