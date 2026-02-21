"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Ticket,
  Plus,
  Loader2,
  MoreVertical,
  Eye,
  ToggleLeft,
  ToggleRight,
  Trash2,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CouponFormDialog } from "@/components/superadmin/coupon-form-dialog"
import { AddCodeDialog } from "@/components/superadmin/add-code-dialog"
import { RedemptionsDialog } from "@/components/superadmin/coupon-redemptions-dialog"

interface PromotionCode {
  id: string
  code: string
  is_active: boolean
  max_redemptions: number | null
  times_redeemed: number
  expires_at: string | null
}

interface Redemption {
  id: string
  status: string
  discount_amount_cents: number
  redeemed_at: string
}

interface Coupon {
  id: string
  stripe_coupon_id: string
  name: string
  discount_type: "percent" | "fixed"
  discount_value: number
  currency: string
  max_redemptions: number | null
  times_redeemed: number
  expires_at: string | null
  is_active: boolean
  applies_to_plans: string[]
  created_at: string
  coupon_promotion_codes: PromotionCode[]
  coupon_redemptions: Redemption[]
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [addCodeCoupon, setAddCodeCoupon] = useState<{ id: string; name: string } | null>(null)
  const [redemptionsCoupon, setRedemptionsCoupon] = useState<{ id: string; name: string } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/coupons")
      const data = await res.json()
      if (res.ok) {
        setCoupons(data.coupons)
      }
    } catch {
      toast.error("Failed to fetch coupons")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id)
    try {
      const res = await fetch(`/api/superadmin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.is_active }),
      })

      if (res.ok) {
        toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"}`)
        fetchCoupons()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update coupon")
      }
    } catch {
      toast.error("Failed to update coupon")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm("Are you sure you want to delete this coupon? This cannot be undone.")) return

    try {
      const res = await fetch(`/api/superadmin/coupons/${coupon.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Coupon deleted")
        fetchCoupons()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete coupon")
      }
    } catch {
      toast.error("Failed to delete coupon")
    }
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percent") {
      return `${coupon.discount_value}%`
    }
    return `$${(coupon.discount_value / 100).toLocaleString()} MXN`
  }

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return "inactive"
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return "expired"
    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) return "used_up"
    return "active"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        )
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#420c14]/5 text-[#420c14]/40 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        )
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        )
      case "used_up":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
            Used Up
          </span>
        )
      default:
        return null
    }
  }

  // Stats
  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => getCouponStatus(c) === "active").length,
    expired: coupons.filter(
      (c) => getCouponStatus(c) === "expired" || getCouponStatus(c) === "used_up"
    ).length,
    totalRedemptions: coupons.reduce(
      (sum, c) => sum + c.coupon_redemptions.filter((r) => r.status === "completed").length,
      0
    ),
    totalDiscountGiven: coupons.reduce(
      (sum, c) =>
        sum +
        c.coupon_redemptions
          .filter((r) => r.status === "completed")
          .reduce((s, r) => s + r.discount_amount_cents, 0),
      0
    ),
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Marketing</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Coupons</h1>
          <p className="text-[#420c14]/60 mt-2">
            Create and manage discount coupons synced with Stripe
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#420c14] hover:bg-[#5a1a22] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3">Total Coupons</p>
          <p className="text-3xl font-serif text-[#420c14]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm">
          <p className="text-sm font-medium text-green-600 mb-3">Active</p>
          <p className="text-3xl font-serif text-green-700">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm">
          <p className="text-sm font-medium text-amber-600 mb-3">Expired / Used Up</p>
          <p className="text-3xl font-serif text-amber-700">{stats.expired}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#DDA46F]/30 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3">Total Redemptions</p>
          <p className="text-3xl font-serif text-[#DDA46F]">{stats.totalRedemptions}</p>
        </div>
        <div className="bg-gradient-to-br from-[#420c14] to-[#5a1a22] rounded-2xl p-6 shadow-lg">
          <p className="text-sm font-medium text-[#f5f2eb]/70 mb-3">Discount Given</p>
          <p className="text-2xl font-serif text-[#f5f2eb]">
            ${(stats.totalDiscountGiven / 100).toLocaleString()} MXN
          </p>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#420c14]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#420c14]" />
            </div>
            <div>
              <h2 className="font-medium text-[#420c14]">All Coupons</h2>
              <p className="text-sm text-[#420c14]/60">Manage discount coupons and promotion codes</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Ticket className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
            <p className="text-[#420c14]/60 mb-4">No coupons yet</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="border-[#DDA46F] text-[#DDA46F] hover:bg-[#DDA46F]/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first coupon
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#420c14]/5">
            {coupons.map((coupon) => {
              const status = getCouponStatus(coupon)
              const completedRedemptions = coupon.coupon_redemptions.filter(
                (r) => r.status === "completed"
              ).length
              const codes = coupon.coupon_promotion_codes

              return (
                <div
                  key={coupon.id}
                  className={`p-6 transition-colors ${
                    status === "inactive" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Name, discount, codes */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#420c14]">{coupon.name}</h3>
                        <span className="inline-flex px-2 py-0.5 rounded-lg bg-[#DDA46F]/10 text-[#DDA46F] text-xs font-bold">
                          {formatDiscount(coupon)} off
                        </span>
                        {getStatusBadge(status)}
                      </div>

                      {/* Codes */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {codes.map((pc) => (
                          <span
                            key={pc.id}
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                              pc.is_active
                                ? "bg-[#420c14]/5 text-[#420c14]/70"
                                : "bg-red-50 text-red-400 line-through"
                            }`}
                          >
                            {pc.code}
                            {pc.max_redemptions && (
                              <span className="ml-1 text-[#420c14]/30">
                                ({pc.times_redeemed}/{pc.max_redemptions})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#420c14]/40 flex-wrap">
                        <span>
                          Plans:{" "}
                          {coupon.applies_to_plans.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                        </span>
                        <span>
                          Redeemed: {completedRedemptions}
                          {coupon.max_redemptions ? `/${coupon.max_redemptions}` : ""}
                        </span>
                        {coupon.expires_at && (
                          <span>
                            Expires: {format(new Date(coupon.expires_at), "MMM d, yyyy")}
                          </span>
                        )}
                        <span>Created: {format(new Date(coupon.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4 text-[#420c14]/40" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => setRedemptionsCoupon({ id: coupon.id, name: coupon.name })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Redemptions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAddCodeCoupon({ id: coupon.id, name: coupon.name })}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Code
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(coupon)}
                          disabled={togglingId === coupon.id}
                        >
                          {coupon.is_active ? (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(coupon)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CouponFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchCoupons}
      />

      {addCodeCoupon && (
        <AddCodeDialog
          open={!!addCodeCoupon}
          onOpenChange={(open) => !open && setAddCodeCoupon(null)}
          couponId={addCodeCoupon.id}
          couponName={addCodeCoupon.name}
          onSuccess={fetchCoupons}
        />
      )}

      {redemptionsCoupon && (
        <RedemptionsDialog
          open={!!redemptionsCoupon}
          onOpenChange={(open) => !open && setRedemptionsCoupon(null)}
          couponId={redemptionsCoupon.id}
          couponName={redemptionsCoupon.name}
        />
      )}
    </div>
  )
}
