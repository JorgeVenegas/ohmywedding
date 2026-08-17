"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import { Gift, User, Calendar, MessageSquare } from "lucide-react"

interface Contribution {
  id: string
  contributor_name: string | null
  contributor_email: string | null
  amount: number
  guest_covers_fee: boolean
  payment_status: string
  message: string | null
  created_at: string
  custom_registry_item_id: string
  stripe_payment_intent_id: string | null
  original_requested_amount: number | null
}

interface RegistryItem {
  id: string
  title: string
  image_urls?: string[]
}

interface RegistryContributionsListProps {
  weddingId: string
  items: RegistryItem[]
  searchQuery?: string
  filterByItem?: string
  filterByStatus?: string
  sortBy?: "newest" | "oldest" | "highest" | "lowest"
  onStatsChange?: (stats: { count: number; amount: number }) => void
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed:        "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    processing:       "bg-blue-50 text-blue-700 border-blue-200/60",
    requires_action:  "bg-amber-50 text-amber-700 border-amber-200/60",
    partially_funded: "bg-orange-50 text-orange-700 border-orange-200/60",
    failed:           "bg-red-50 text-red-700 border-red-200/60",
    refunded:         "bg-purple-50 text-purple-700 border-purple-200/60",
    expired:          "bg-gray-50 text-gray-500 border-gray-200/60",
    incomplete:       "bg-slate-50 text-slate-600 border-slate-200/60",
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none ${styles[status] ?? "bg-gray-50 text-gray-700 border-gray-200/60"}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function RegistryContributionsList({
  weddingId,
  items,
  searchQuery = "",
  filterByItem = "all",
  filterByStatus = "all",
  sortBy = "newest",
  onStatsChange,
}: RegistryContributionsListProps) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchContributions()
  }, [weddingId])

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("wedding_id", weddingId)
        .notIn("payment_status", ["pending", "incomplete", "partially_funded"])
        .order("created_at", { ascending: false })
      if (error) throw error
      setContributions(data || [])
    } catch (error) {
      console.error("Error fetching contributions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getItemTitle = (itemId: string) =>
    items.find(i => i.id === itemId)?.title || "Unknown Item"

  const filteredAndSorted = contributions
    .filter(c => {
      if (filterByItem !== "all" && c.custom_registry_item_id !== filterByItem) return false
      if (filterByStatus !== "all" && c.payment_status !== filterByStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName  = c.contributor_name?.toLowerCase().includes(q)
        const matchesEmail = c.contributor_email?.toLowerCase().includes(q)
        const matchesItem  = getItemTitle(c.custom_registry_item_id).toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesItem) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "highest": return Number(b.amount) - Number(a.amount)
        case "lowest":  return Number(a.amount) - Number(b.amount)
        case "oldest":  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const totalContributions = filteredAndSorted.length
  const totalAmount = filteredAndSorted
    .filter(c => c.payment_status === 'completed')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  useEffect(() => {
    onStatsChange?.({ count: totalContributions, amount: totalAmount })
  }, [onStatsChange, totalContributions, totalAmount])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-[#420c14]/8 bg-white p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#420c14]/6 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#420c14]/6 rounded w-1/3" />
                <div className="h-3 bg-[#420c14]/4 rounded w-1/2" />
              </div>
              <div className="h-5 bg-[#420c14]/6 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Empty — no contributions at all ──────────────────────────────────────
  if (contributions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#420c14]/10 border-dashed bg-white py-16 text-center mt-2">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(221,164,111,0.10)' }}
        >
          <Gift className="w-7 h-7" style={{ color: '#DDA46F' }} />
        </div>
        <p className="text-xl font-serif text-[#420c14] mb-1">No contributions yet</p>
        <p className="text-sm text-[#420c14]/40 max-w-xs mx-auto leading-relaxed">
          When your guests contribute to registry items, they'll appear here.
        </p>
      </div>
    )
  }

  // ── Empty after filtering ─────────────────────────────────────────────────
  if (filteredAndSorted.length === 0) {
    return (
      <div className="rounded-2xl border border-[#420c14]/10 border-dashed bg-white py-14 text-center mt-2">
        <p className="font-serif text-[#420c14]/50">No contributions match your filters</p>
      </div>
    )
  }

  // ── Contribution rows ─────────────────────────────────────────────────────
  return (
    <div className="space-y-2.5 pt-2">
      {filteredAndSorted.map((contribution) => {
        const item = items.find(i => i.id === contribution.custom_registry_item_id)
        const amount = Number(contribution.amount)
        const originalAmount = contribution.original_requested_amount
          ? Number(contribution.original_requested_amount)
          : null
        const hasFeeNote = originalAmount && originalAmount > amount

        return (
          <div
            key={contribution.id}
            className="rounded-2xl border border-[#420c14]/8 bg-white overflow-hidden hover:border-[#420c14]/15 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-stretch">
              {/* Item thumbnail strip */}
              <div className="w-1 flex-shrink-0" style={{ background: contribution.payment_status === 'completed' ? '#DDA46F' : contribution.payment_status === 'failed' ? '#ef4444' : '#e5e7eb' }} />

              <div className="flex-1 px-4 py-3.5">
                <div className="flex items-center gap-4">
                  {/* Item thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f5f2eb] flex-shrink-0 flex items-center justify-center">
                    {item?.image_urls?.[0] ? (
                      <img
                        src={item.image_urls[0]}
                        alt={getItemTitle(contribution.custom_registry_item_id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Gift className="w-4 h-4 text-[#DDA46F]" />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {/* Contributor */}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <User className="w-3 h-3 text-[#420c14]/30 flex-shrink-0" />
                          <span className="text-sm font-medium text-[#420c14] truncate">
                            {contribution.contributor_name || "Anonymous"}
                          </span>
                        </div>
                        {/* Item title */}
                        <p className="text-xs text-[#420c14]/45 truncate">
                          {getItemTitle(contribution.custom_registry_item_id)}
                        </p>
                      </div>

                      {/* Amount + status */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-baseline gap-1.5 justify-end">
                          {hasFeeNote && (
                            <span className="text-xs text-[#420c14]/25 line-through">
                              ${originalAmount!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                          <span className="text-base font-serif font-medium" style={{ color: '#DDA46F' }}>
                            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-end">
                          <StatusBadge status={contribution.payment_status} />
                        </div>
                      </div>
                    </div>

                    {/* Footer row — date + optional message */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] text-[#420c14]/35">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(contribution.created_at)}</span>
                        <span className="opacity-60">·</span>
                        <span>{formatTime(contribution.created_at)}</span>
                      </div>
                      {contribution.contributor_email && (
                        <span className="text-[11px] text-[#420c14]/30 truncate max-w-[160px]">
                          {contribution.contributor_email}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    {contribution.message && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#DDA46F]" />
                        <p className="text-[11px] text-[#420c14]/55 italic line-clamp-2">
                          "{contribution.message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
