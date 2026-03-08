'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tag,
  Plus,
  Loader2,
  Trash2,
  Power,
  PowerOff,
  Pencil,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface GlobalDiscountRow {
  id: string
  name: string
  label: string
  is_active: boolean
  premium_card_discount_percent: number
  premium_msi_discount_percent: number
  deluxe_card_discount_percent: number
  deluxe_msi_discount_percent: number
  premium_card_stripe_coupon_id: string | null
  premium_msi_stripe_coupon_id: string | null
  deluxe_card_stripe_coupon_id: string | null
  deluxe_msi_stripe_coupon_id: string | null
  applies_to_plans: string[]
  starts_at: string
  ends_at: string | null
  created_at: string
  updated_at: string
}

export default function PromotionsPage() {
  const [discounts, setDiscounts] = useState<GlobalDiscountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formPremiumCard, setFormPremiumCard] = useState(0)
  const [formPremiumMsi, setFormPremiumMsi] = useState(0)
  const [formDeluxeCard, setFormDeluxeCard] = useState(0)
  const [formDeluxeMsi, setFormDeluxeMsi] = useState(0)
  const [formPlans, setFormPlans] = useState<string[]>(['premium', 'deluxe'])
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formEndsAt, setFormEndsAt] = useState('')
  const [formIsActive, setFormIsActive] = useState(false)

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/global-discounts')
      const data = await res.json()
      setDiscounts(data.discounts || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  const resetForm = () => {
    setFormName('')
    setFormLabel('')
    setFormPremiumCard(0)
    setFormPremiumMsi(0)
    setFormDeluxeCard(0)
    setFormDeluxeMsi(0)
    setFormPlans(['premium', 'deluxe'])
    setFormStartsAt('')
    setFormEndsAt('')
    setFormIsActive(false)
    setEditId(null)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  // Format to local datetime string for datetime-local input (avoids UTC shift)
  const toLocalDatetimeInput = (isoString: string) => {
    const d = new Date(isoString)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const openEdit = (d: GlobalDiscountRow) => {
    setEditId(d.id)
    setFormName(d.name)
    setFormLabel(d.label)
    setFormPremiumCard(d.premium_card_discount_percent)
    setFormPremiumMsi(d.premium_msi_discount_percent)
    setFormDeluxeCard(d.deluxe_card_discount_percent)
    setFormDeluxeMsi(d.deluxe_msi_discount_percent)
    setFormPlans(d.applies_to_plans)
    setFormStartsAt(d.starts_at ? toLocalDatetimeInput(d.starts_at) : '')
    setFormEndsAt(d.ends_at ? toLocalDatetimeInput(d.ends_at) : '')
    setFormIsActive(d.is_active)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formLabel.trim()) return
    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        name: formName,
        label: formLabel,
        premiumCardDiscountPercent: formPremiumCard,
        premiumMsiDiscountPercent: formPremiumMsi,
        deluxeCardDiscountPercent: formDeluxeCard,
        deluxeMsiDiscountPercent: formDeluxeMsi,
        appliesToPlans: formPlans,
        startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : undefined,
        endsAt: formEndsAt ? new Date(formEndsAt).toISOString() : undefined,
        isActive: formIsActive,
      }

      if (editId) {
        body.id = editId
        await fetch('/api/superadmin/global-discounts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/superadmin/global-discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      setShowForm(false)
      resetForm()
      await fetchDiscounts()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (d: GlobalDiscountRow) => {
    try {
      await fetch('/api/superadmin/global-discounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id, isActive: !d.is_active }),
      })
      await fetchDiscounts()
    } catch {
      // silent
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/superadmin/global-discounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setDeleteConfirmId(null)
      await fetchDiscounts()
    } catch {
      // silent
    }
  }

  const isCurrentlyActive = (d: GlobalDiscountRow) => {
    if (!d.is_active) return false
    const now = new Date()
    if (new Date(d.starts_at) > now) return false
    if (d.ends_at && new Date(d.ends_at) < now) return false
    return true
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#DDA46F]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Promotions</p>
          <h1 className="text-3xl font-serif text-[#420c14]">Global Discounts</h1>
          <p className="text-[#420c14]/60 mt-1 text-sm">
            Set promotional discounts that apply globally to all pricing. Only one can be active at a time.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Promotion
        </Button>
      </div>

      {/* Active Discount Banner */}
      {discounts.some(isCurrentlyActive) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Active Promotion</p>
            {discounts.filter(isCurrentlyActive).map(d => (
              <p key={d.id} className="text-sm text-green-600 mt-0.5">
                <strong>{d.name}</strong> &mdash;
                Premium: Card {d.premium_card_discount_percent}%/MSI {d.premium_msi_discount_percent}%,
                Deluxe: Card {d.deluxe_card_discount_percent}%/MSI {d.deluxe_msi_discount_percent}%
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Discounts List */}
      {discounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#420c14]/10 p-12 text-center">
          <Tag className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
          <p className="text-[#420c14]/60 mb-4">No promotions created yet</p>
          <Button onClick={openCreate} variant="outline" className="border-[#420c14]/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Promotion
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {discounts.map(d => (
            <div
              key={d.id}
              className={`bg-white rounded-2xl border p-6 transition-all ${
                isCurrentlyActive(d)
                  ? 'border-green-300 shadow-md shadow-green-100'
                  : 'border-[#420c14]/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-medium text-[#420c14]">{d.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isCurrentlyActive(d)
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : d.is_active
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : 'bg-[#420c14]/5 text-[#420c14]/50'
                    }`}>
                      {isCurrentlyActive(d) ? 'Active' : d.is_active ? 'Scheduled' : 'Inactive'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DDA46F]/10 text-[#DDA46F] border border-[#DDA46F]/30 text-[10px] font-medium">
                      <Tag className="w-2.5 h-2.5" />
                      {d.label}
                    </span>
                  </div>

                  {/* Discount percentages */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-[#420c14]/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#420c14]/40">Premium</span>
                      <span>Card: <strong className="text-[#420c14]">{d.premium_card_discount_percent}%</strong></span>
                      <span className="text-[#420c14]/30">/</span>
                      <span>MSI: <strong className="text-[#420c14]">{d.premium_msi_discount_percent}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#420c14]/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#DDA46F]/70">Deluxe</span>
                      <span>Card: <strong className="text-[#420c14]">{d.deluxe_card_discount_percent}%</strong></span>
                      <span className="text-[#420c14]/30">/</span>
                      <span>MSI: <strong className="text-[#420c14]">{d.deluxe_msi_discount_percent}%</strong></span>
                    </div>
                  </div>

                  {/* Stripe coupon status */}
                  {(() => {
                    const linked = [
                      d.premium_card_stripe_coupon_id && 'P-Card',
                      d.premium_msi_stripe_coupon_id && 'P-MSI',
                      d.deluxe_card_stripe_coupon_id && 'D-Card',
                      d.deluxe_msi_stripe_coupon_id && 'D-MSI',
                    ].filter(Boolean)
                    const hasAnyPercent = d.premium_card_discount_percent > 0 || d.premium_msi_discount_percent > 0 || d.deluxe_card_discount_percent > 0 || d.deluxe_msi_discount_percent > 0
                    return hasAnyPercent ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                        {linked.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                            <Check className="w-2.5 h-2.5" />
                            Stripe coupons: {linked.join(', ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
                            <AlertCircle className="w-2.5 h-2.5" />
                            No Stripe coupons linked — save to create
                          </span>
                        )}
                      </div>
                    ) : null
                  })()}

                  {/* Plans & dates */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#420c14]/50">
                    <span>Plans: {d.applies_to_plans.join(', ')}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.starts_at).toLocaleDateString()}
                      {d.ends_at ? ` - ${new Date(d.ends_at).toLocaleDateString()}` : ' - No end date'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(d)}
                    className="text-[#420c14]/50 hover:text-[#420c14]"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(d)}
                    className={d.is_active ? 'text-green-600 hover:text-red-600' : 'text-[#420c14]/50 hover:text-green-600'}
                    title={d.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {d.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(d.id)}
                    className="text-[#420c14]/50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm() } }}>
        <DialogContent className="sm:max-w-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#420c14]">
              {editId ? 'Edit Promotion' : 'New Promotion'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Name & Label */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#420c14]/70 mb-1.5 block">Internal Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. March Launch Promo"
                  className="w-full px-3 py-2 rounded-lg border border-[#420c14]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30 focus:border-[#DDA46F]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#420c14]/70 mb-1.5 block">Display Label</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={e => setFormLabel(e.target.value)}
                  placeholder="e.g. Launch Special"
                  className="w-full px-3 py-2 rounded-lg border border-[#420c14]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30 focus:border-[#DDA46F]"
                />
              </div>
            </div>

            {/* Discount Percentages */}
            <div>
              <label className="text-xs font-medium text-[#420c14]/70 mb-3 block">Discount by Plan &amp; Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Premium */}
                <div className="bg-[#f5f2eb] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#420c14]/60 uppercase tracking-wider mb-2 text-center">Premium</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#420c14]/60 w-10 flex-shrink-0">Card</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formPremiumCard}
                        onChange={e => setFormPremiumCard(parseInt(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#420c14]/15 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30"
                      />
                      <span className="text-xs text-[#420c14]/60">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#420c14]/60 w-10 flex-shrink-0">MSI</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formPremiumMsi}
                        onChange={e => setFormPremiumMsi(parseInt(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#420c14]/15 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30"
                      />
                      <span className="text-xs text-[#420c14]/60">%</span>
                    </div>
                  </div>
                </div>
                {/* Deluxe */}
                <div className="bg-[#f5f2eb] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#DDA46F] uppercase tracking-wider mb-2 text-center">Deluxe</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#420c14]/60 w-10 flex-shrink-0">Card</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formDeluxeCard}
                        onChange={e => setFormDeluxeCard(parseInt(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#420c14]/15 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30"
                      />
                      <span className="text-xs text-[#420c14]/60">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#420c14]/60 w-10 flex-shrink-0">MSI</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formDeluxeMsi}
                        onChange={e => setFormDeluxeMsi(parseInt(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#420c14]/15 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30"
                      />
                      <span className="text-xs text-[#420c14]/60">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div>
              <label className="text-xs font-medium text-[#420c14]/70 mb-2 block">Applies To Plans</label>
              <div className="flex gap-3">
                {['premium', 'deluxe'].map(plan => {
                  const checked = formPlans.includes(plan)
                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => {
                        if (checked) {
                          setFormPlans(formPlans.filter(p => p !== plan))
                        } else {
                          setFormPlans([...formPlans, plan])
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        checked
                          ? 'bg-[#420c14] text-[#f5f2eb] border-[#420c14]'
                          : 'bg-white text-[#420c14]/60 border-[#420c14]/15 hover:border-[#420c14]/30 hover:text-[#420c14]'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                      <span className="capitalize">{plan}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#420c14]/70 mb-1.5 block">Starts At</label>
                <input
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={e => setFormStartsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#420c14]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30 focus:border-[#DDA46F]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#420c14]/70 mb-1.5 block">Ends At <span className="text-[#420c14]/40">(optional)</span></label>
                <input
                  type="datetime-local"
                  value={formEndsAt}
                  onChange={e => setFormEndsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#420c14]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/30 focus:border-[#DDA46F]"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className="flex items-center gap-3 cursor-pointer w-full text-left"
            >
              <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${formIsActive ? 'bg-green-500' : 'bg-[#420c14]/20'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${formIsActive ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm text-[#420c14]">
                {formIsActive ? 'Active immediately' : 'Save as inactive'}
              </span>
            </button>

            {formIsActive && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">Activating this promotion will deactivate any other active promotion.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => { setShowForm(false); resetForm() }}
                variant="outline"
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formName.trim() || !formLabel.trim()}
                className="flex-1 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <DialogContent className="sm:max-w-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#420c14]">Delete Promotion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#420c14]/70 mt-2">
            Are you sure you want to delete this promotion? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => setDeleteConfirmId(null)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
