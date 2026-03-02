"use client"

import { use, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { toast } from "sonner"
import { Plus, Handshake } from "lucide-react"
import { SupplierCard, SupplierModal, PaymentModal } from "./components"
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
          <Button size="sm" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('admin.suppliers.addSupplier')}</span>
          </Button>
        }
      />

      <div className="page-container space-y-8">
        <p className="text-muted-foreground">{t('admin.suppliers.description')}</p>

        {/* Stats */}
        {suppliers.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <Card className="p-4 flex-1 min-w-[120px]">
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <div className="text-sm text-muted-foreground">{t('admin.suppliers.stats.total')}</div>
            </Card>
            <Card className="p-4 flex-1 min-w-[120px]">
              <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
              <div className="text-sm text-muted-foreground">{t('admin.suppliers.stats.budget')}</div>
            </Card>
            <Card className="p-4 flex-1 min-w-[120px]">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCovered)}</div>
              <div className="text-sm text-muted-foreground">{t('admin.suppliers.stats.covered')}</div>
            </Card>
            <Card className="p-4 flex-1 min-w-[120px]">
              <div className={`text-2xl font-bold ${totalRemaining > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{formatCurrency(totalRemaining)}</div>
              <div className="text-sm text-muted-foreground">{t('admin.suppliers.stats.remaining')}</div>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {suppliers.length === 0 ? (
          <Card className="p-12 text-center">
            <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('admin.suppliers.empty.title')}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t('admin.suppliers.empty.description')}</p>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.suppliers.addSupplier')}
            </Button>
          </Card>
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
