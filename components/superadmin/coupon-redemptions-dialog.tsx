"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"

interface Redemption {
  id: string
  discount_amount_cents: number
  original_amount_cents: number
  final_amount_cents: number
  plan_type: string
  status: string
  redeemed_at: string
  user_id: string
  coupon_promotion_codes: { code: string } | null
  weddings: {
    id: string
    partner1_first_name: string
    partner2_first_name: string
    wedding_name_id: string
  } | null
  subscription_orders: {
    id: string
    amount_cents: number
    status: string
    stripe_payment_intent_id: string | null
    stripe_checkout_session_id: string | null
  } | null
}

interface RedemptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  couponId: string
  couponName: string
}

export function RedemptionsDialog({ open, onOpenChange, couponId, couponName }: RedemptionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])

  useEffect(() => {
    if (open && couponId) {
      fetchRedemptions()
    }
  }, [open, couponId])

  const fetchRedemptions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/coupons/${couponId}/redemptions`)
      const data = await res.json()
      if (res.ok) {
        setRedemptions(data.redemptions)
      }
    } catch {
      console.error("Failed to fetch redemptions")
    } finally {
      setLoading(false)
    }
  }

  const formatCents = (cents: number) => {
    return `$${(cents / 100).toLocaleString()} MXN`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        )
      case "applied":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Applied
          </span>
        )
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Refunded
          </span>
        )
      default:
        return <span className="text-xs text-[#420c14]/60">{status}</span>
    }
  }

  const getStripePaymentUrl = (piId: string) => {
    return `https://dashboard.stripe.com/payments/${piId}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-[#420c14]/10 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif text-[#420c14]">
            Redemptions &mdash; {couponName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#DDA46F]" />
          </div>
        ) : redemptions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#420c14]/40 text-sm">No redemptions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#420c14]/5 mt-2">
            {redemptions.map((r) => (
              <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.weddings && (
                        <p className="text-sm font-medium text-[#420c14]">
                          {r.weddings.partner1_first_name} & {r.weddings.partner2_first_name}
                        </p>
                      )}
                      {r.coupon_promotion_codes && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-[#420c14]/5 text-[10px] font-mono text-[#420c14]/60 uppercase">
                          {r.coupon_promotion_codes.code}
                        </span>
                      )}
                      {getStatusBadge(r.status)}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#420c14]/50 flex-wrap">
                      <span>{format(new Date(r.redeemed_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span className="capitalize">{r.plan_type} plan</span>
                      {r.weddings && (
                        <span className="font-mono text-[10px]">{r.weddings.wedding_name_id}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-green-700">
                      -{formatCents(r.discount_amount_cents)}
                    </p>
                    <p className="text-[10px] text-[#420c14]/40">
                      {formatCents(r.original_amount_cents)} → {formatCents(r.final_amount_cents)}
                    </p>

                    {r.subscription_orders?.stripe_payment_intent_id && (
                      <a
                        href={getStripePaymentUrl(r.subscription_orders.stripe_payment_intent_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-[#DDA46F] hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View in Stripe
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
