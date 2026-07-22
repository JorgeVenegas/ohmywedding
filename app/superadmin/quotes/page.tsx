"use client"

import { useState, useEffect, useCallback } from "react"

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
  FileText,
  Plus,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
  XCircle,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Quote, QuoteStatus } from "@/lib/quote-types"
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, formatMXN, computeDiscountedPrice } from "@/lib/quote-types"

const STATUS_ICONS: Record<QuoteStatus, React.ReactNode> = {
  draft: <Clock className="w-3 h-3" />,
  sent: <FileText className="w-3 h-3" />,
  viewed: <Eye className="w-3 h-3" />,
  paid: <CheckCircle2 className="w-3 h-3" />,
  expired: <XCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/quotes")
      const data = await res.json()
      if (res.ok) setQuotes(data.quotes)
    } catch {
      toast.error("Failed to fetch quotes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const copyLink = async (quoteId: string) => {
    const url = `${window.location.origin}/quotes/${quoteId}`
    await copyToClipboard(url)
    setCopiedId(quoteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = quotes.filter(q =>
    q.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
    (q.coupon_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (q.recipient_email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: quotes.length,
    sent: quotes.filter(q => q.status === "sent").length,
    viewed: quotes.filter(q => q.status === "viewed").length,
    paid: quotes.filter(q => q.status === "paid").length,
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Sales</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Quotes</h1>
          <p className="text-[#420c14]/60 mt-2">
            Generate custom price quotes with discount codes for prospective clients
          </p>
        </div>
        <Link href="/superadmin/quotes/new">
          <Button className="bg-[#420c14] hover:bg-[#5a1a22] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "border-[#420c14]/10" },
          { label: "Sent", value: stats.sent, color: "border-blue-200" },
          { label: "Viewed", value: stats.viewed, color: "border-amber-200" },
          { label: "Paid", value: stats.paid, color: "border-green-200" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl p-5 border ${s.color} shadow-sm`}>
            <p className="text-xs font-medium text-[#420c14]/50 mb-2">{s.label}</p>
            <p className="text-3xl font-serif text-[#420c14]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#420c14]/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#420c14]" />
          </div>
          <div className="flex-1">
            <h2 className="font-medium text-[#420c14] text-sm">All Quotes</h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#420c14]/30" />
            <Input
              placeholder="Search quotes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-[#420c14]/15 w-56"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-[#DDA46F]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-[#420c14]/15 mx-auto mb-4" />
            <p className="text-[#420c14]/50 mb-4">
              {search ? "No quotes match your search" : "No quotes yet"}
            </p>
            {!search && (
              <Link href="/superadmin/quotes/new">
                <Button variant="outline" className="border-[#DDA46F] text-[#DDA46F] hover:bg-[#DDA46F]/5">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first quote
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#420c14]/5">
            {filtered.map(quote => {
              const maxTotal = Math.max(...quote.scenarios.map(s => s.total_price_cents))
              const discountedMax = computeDiscountedPrice(maxTotal, quote.discount_type, quote.discount_value)
              const discountLabel = quote.discount_type === "percent"
                ? `${quote.discount_value}% off`
                : `${formatMXN(quote.discount_value)} off`

              return (
                <div key={quote.id} className="p-5 flex items-center gap-4 hover:bg-[#420c14]/[0.015] transition-colors">
                  {/* Quote number + recipient */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-[#420c14]/40">{quote.quote_number}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${QUOTE_STATUS_COLORS[quote.status]}`}
                      >
                        {STATUS_ICONS[quote.status]}
                        {QUOTE_STATUS_LABELS[quote.status]}
                      </span>
                      {quote.wedding_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                          <CreditCard className="w-3 h-3" />
                          Linked to wedding
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-[#420c14] mt-0.5">{quote.recipient_name}</p>
                    {quote.recipient_email && (
                      <p className="text-xs text-[#420c14]/50">{quote.recipient_email}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-[#420c14]/50">
                        {quote.scenarios.length} scenario{quote.scenarios.length !== 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex px-1.5 py-0.5 rounded bg-[#DDA46F]/10 text-[#DDA46F] text-[10px] font-bold">
                        {discountLabel}
                      </span>
                      {quote.coupon_code && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#420c14]/50 bg-[#420c14]/5 px-1.5 py-0.5 rounded">
                          {quote.coupon_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price range */}
                  <div className="text-right hidden sm:block shrink-0">
                    <p className="text-sm font-medium text-[#420c14]">
                      up to {formatMXN(discountedMax)}
                    </p>
                    <p className="text-xs text-[#420c14]/40 line-through">{formatMXN(maxTotal)}</p>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-[#420c14]/40 hidden md:block shrink-0 text-right">
                    <p>{format(new Date(quote.created_at), "MMM d, yyyy")}</p>
                    {quote.coupon_expires_at && (
                      <p className="text-amber-600">
                        Exp {format(new Date(quote.coupon_expires_at), "MMM d")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Copy quote link"
                      onClick={() => copyLink(quote.id)}
                    >
                      {copiedId === quote.id
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <Copy className="w-4 h-4 text-[#420c14]/40" />
                      }
                    </Button>
                    <Link href={`/superadmin/quotes/${quote.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View quote">
                        <ExternalLink className="w-4 h-4 text-[#420c14]/40" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
