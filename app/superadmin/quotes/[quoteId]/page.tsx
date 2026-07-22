"use client"

import { useState, useEffect, useCallback, use } from "react"

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    const el = document.createElement("textarea")
    el.value = text
    el.style.cssText = "position:fixed;top:-9999px"
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
  }
}
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Check,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/superadmin/confirm-dialog"
import type { Quote, QuoteStatus } from "@/lib/quote-types"
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  formatMXN,
  computeDiscountedPrice,
  getScenarioFeatures,
} from "@/lib/quote-types"
import { INVITATION_PRICING, MANAGEMENT_PRICING } from "@/lib/subscription-shared"

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteId: string }>
}) {
  const { quoteId } = use(params)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingLanguage, setUpdatingLanguage] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/superadmin/quotes/${quoteId}`)
      const data = await res.json()
      if (res.ok) setQuote(data.quote)
      else toast.error("Quote not found")
    } catch {
      toast.error("Failed to load quote")
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  useEffect(() => { fetchQuote() }, [fetchQuote])

  const copyLink = async () => {
    if (!quote) return
    const text = `${window.location.origin}/quotes/${quote.id}`
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateLanguage = async (language: 'en' | 'es') => {
    if (!quote || quote.language === language) return
    setUpdatingLanguage(true)
    try {
      const res = await fetch(`/api/superadmin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      })
      if (res.ok) {
        toast.success(`Quote language set to ${language === 'es' ? 'Spanish' : 'English'}`)
        fetchQuote()
      } else {
        toast.error("Failed to update language")
      }
    } finally {
      setUpdatingLanguage(false)
    }
  }

  const cancelQuote = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/superadmin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (res.ok) {
        toast.success("Quote cancelled and coupon expired")
        setCancelDialogOpen(false)
        fetchQuote()
      } else {
        toast.error("Failed to cancel quote")
      }
    } finally {
      setCancelling(false)
    }
  }

  const updateStatus = async (status: QuoteStatus) => {
    if (!quote) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/superadmin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Status updated to ${QUOTE_STATUS_LABELS[status]}`)
        fetchQuote()
      } else {
        toast.error("Failed to update status")
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="text-center py-20">
        <p className="text-[#420c14]/50">Quote not found</p>
        <Link href="/superadmin/quotes">
          <Button variant="link" className="text-[#DDA46F] mt-2">Back to quotes</Button>
        </Link>
      </div>
    )
  }

  const discountLabel = quote.discount_type === "percent"
    ? `${quote.discount_value}% off`
    : `${formatMXN(quote.discount_value)} off`

  const quoteUrl = `/quotes/${quote.id}`
  const nextStatuses: QuoteStatus[] = quote.status === "sent"
    ? ["viewed", "paid", "cancelled"]
    : quote.status === "viewed"
    ? ["paid", "cancelled"]
    : []

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/superadmin/quotes"
          className="inline-flex items-center gap-1.5 text-sm text-[#420c14]/50 hover:text-[#420c14] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotes
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-[#420c14]/40">{quote.quote_number}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status]}`}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
            <h1 className="text-3xl font-serif text-[#420c14]">{quote.recipient_name}</h1>
            {quote.recipient_email && (
              <p className="text-[#420c14]/50 mt-0.5">{quote.recipient_email}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="border-[#420c14]/20 text-[#420c14]/70"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Link href={quoteUrl} target="_blank">
              <Button size="sm" className="bg-[#420c14] hover:bg-[#5a1a22] text-white">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                View Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#420c14]/10 shadow-sm">
          <p className="text-xs text-[#420c14]/50 mb-1">Discount</p>
          <p className="font-bold text-[#DDA46F]">{discountLabel}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#420c14]/10 shadow-sm">
          <p className="text-xs text-[#420c14]/50 mb-1">Coupon Code</p>
          <p className="font-mono font-bold text-[#420c14] tracking-wider">{quote.coupon_code ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#420c14]/10 shadow-sm">
          <p className="text-xs text-[#420c14]/50 mb-1">Created</p>
          <p className="text-sm font-medium text-[#420c14]">{format(new Date(quote.created_at), "MMM d, yyyy")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#420c14]/10 shadow-sm">
          <p className="text-xs text-[#420c14]/50 mb-1">Code Expires</p>
          <p className="text-sm font-medium text-[#420c14]">
            {quote.coupon_expires_at
              ? format(new Date(quote.coupon_expires_at), "MMM d, yyyy")
              : "Never"}
          </p>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#420c14]/50 uppercase tracking-wider mb-0.5">Quote Language</p>
          <p className="text-sm text-[#420c14]/70">Controls the language of the public quote page the client sees.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {(["es", "en"] as const).map(lang => (
            <button
              key={lang}
              type="button"
              disabled={updatingLanguage}
              onClick={() => updateLanguage(lang)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
                quote.language === lang
                  ? "border-[#420c14] bg-[#420c14] text-white"
                  : "border-[#420c14]/15 text-[#420c14]/60 hover:border-[#420c14]/30"
              }`}
            >
              {lang === "es" ? "🇲🇽 Español" : "🇺🇸 English"}
            </button>
          ))}
        </div>
      </div>

      {/* Linked wedding */}
      {quote.wedding_id && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-700">Paid — linked to wedding</p>
            <Link href={`/superadmin/weddings/${quote.wedding_id}`} className="text-xs text-green-600 underline">
              View wedding
            </Link>
          </div>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm p-5">
          <p className="text-xs text-[#420c14]/50 uppercase tracking-wider mb-2">Internal Notes</p>
          <p className="text-sm text-[#420c14]/80">{quote.notes}</p>
        </div>
      )}

      {/* Scenarios */}
      <div className="space-y-4">
        <h2 className="font-medium text-[#420c14]">Pricing Scenarios</h2>
        {quote.scenarios.map((scenario, i) => {
          const discounted = computeDiscountedPrice(
            scenario.total_price_cents,
            quote.discount_type,
            quote.discount_value
          )
          const { invitation, management } = getScenarioFeatures(scenario)

          return (
            <div key={i} className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#420c14]/[0.02] border-b border-[#420c14]/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#420c14] text-white text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="font-medium text-[#420c14] text-sm">{scenario.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#420c14]/40 line-through mr-2">{formatMXN(scenario.total_price_cents)}</span>
                  <span className="font-bold text-[#DDA46F]">{formatMXN(discounted)}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex gap-4 mb-4 flex-wrap text-xs text-[#420c14]/60">
                  {scenario.invitation_tier && (
                    <span>
                      Invitation — <strong>{INVITATION_PRICING[scenario.invitation_tier].name}</strong>{" "}
                      ({formatMXN(scenario.invitation_price_cents)})
                    </span>
                  )}
                  {scenario.management_tier && (
                    <span>
                      Management — <strong>{MANAGEMENT_PRICING[scenario.management_tier].name}</strong>{" "}
                      ({formatMXN(scenario.management_price_cents)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {invitation.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-2">Invitation</p>
                      <ul className="space-y-1">
                        {invitation.filter(f => !f.startsWith('RSVP')).map((f, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-[#420c14]/70">
                            <Check className="w-3 h-3 text-[#DDA46F] flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {management.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-2">Management</p>
                      <ul className="space-y-1">
                        {management.map((f, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-[#420c14]/70">
                            <Check className="w-3 h-3 text-[#DDA46F] flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Status management */}
      {nextStatuses.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm p-5">
          <p className="text-xs text-[#420c14]/50 uppercase tracking-wider mb-3">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map(s => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                disabled={updatingStatus}
                onClick={() => s === "cancelled" ? setCancelDialogOpen(true) : updateStatus(s)}
                className={`border-[#420c14]/20 text-[#420c14]/70 hover:bg-[#420c14]/5 ${
                  s === "paid" ? "border-green-300 text-green-700 hover:bg-green-50" :
                  s === "cancelled" ? "border-red-200 text-red-500 hover:bg-red-50" : ""
                }`}
              >
                {updatingStatus && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Mark as {QUOTE_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this quote?"
        description={`This will cancel the quote for ${quote.recipient_name} and immediately expire the coupon code "${quote.coupon_code ?? ""}" in Stripe so it can no longer be used.`}
        confirmLabel="Cancel quote & expire coupon"
        cancelLabel="Keep quote"
        loading={cancelling}
        onConfirm={cancelQuote}
      />
    </div>
  )
}
