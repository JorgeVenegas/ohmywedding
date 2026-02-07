"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { DollarSign, User, Calendar, MessageSquare, AlertCircle, X } from "lucide-react"

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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchContributions()
  }, [weddingId])

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from("registry_contributions")
        .select("*")
        .eq("wedding_id", weddingId)
        .notIn("payment_status", ["pending", "incomplete"])
        .order("created_at", { ascending: false })

      if (error) throw error
      setContributions(data || [])
    } catch (error) {
      console.error("Error fetching contributions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getItemTitle = (itemId: string) => {
    return items.find(i => i.id === itemId)?.title || "Unknown Item"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
      case "processing":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60"
      case "requires_action":
        return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60"
      case "failed":
        return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-800/60"
      case "refunded":
        return "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60"
      case "expired":
        return "bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-gray-800/60"
      case "incomplete":
        return "bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/60"
      default:
        return "bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200/60 dark:border-gray-800/60"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter and sort contributions
  const filteredAndSorted = contributions
    .filter(c => {
      if (filterByItem !== "all" && c.custom_registry_item_id !== filterByItem) return false
      if (filterByStatus !== "all" && c.payment_status !== filterByStatus) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = c.contributor_name?.toLowerCase().includes(query)
        const matchesEmail = c.contributor_email?.toLowerCase().includes(query)
        const matchesItem = getItemTitle(c.custom_registry_item_id).toLowerCase().includes(query)
        if (!matchesName && !matchesEmail && !matchesItem) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "highest":
          return Number(b.amount) - Number(a.amount)
        case "lowest":
          return Number(a.amount) - Number(b.amount)
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const totalContributions = filteredAndSorted.length
  const totalAmount = filteredAndSorted
    .filter(c => c.payment_status === 'completed')
    .reduce((sum, c) => sum + Number(c.amount), 0)
  
  const statuses = Array.from(new Set(contributions.map(c => c.payment_status)))

  useEffect(() => {
    onStatsChange?.({ count: totalContributions, amount: totalAmount })
  }, [onStatsChange, totalContributions, totalAmount])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    )
  }

  return (
    <>
      {/* Contributions Grid */}
      {filteredAndSorted.length === 0 ? (
        <Card className="p-12 text-center border border-border shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {contributions.length === 0 ? "No contributions yet" : "No contributions match your filters"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map((contribution) => {
            const item = items.find(i => i.id === contribution.custom_registry_item_id)
            return (
            <Card
              key={contribution.id}
              className="p-3 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_0.6fr] gap-3 items-center">
                {/* Column 1: Item */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg border border-border/60 bg-muted/40 overflow-hidden flex items-center justify-center">
                    {item?.image_urls?.[0] ? (
                      <img
                        src={item.image_urls[0]}
                        alt={getItemTitle(contribution.custom_registry_item_id)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Item</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {getItemTitle(contribution.custom_registry_item_id)}
                    </p>
                  </div>
                </div>

                {/* Column 2: Contribution Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-secondary" />
                    <p className="text-sm font-semibold text-foreground truncate">
                      {contribution.contributor_name || "Anonymous"}
                    </p>
                  </div>
                  {contribution.contributor_email && (
                    <p className="text-[11px] text-muted-foreground truncate mb-1">
                      {contribution.contributor_email}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatDate(contribution.created_at)}</span>
                  </div>
                  {contribution.message && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-md border-l-2 border-secondary">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                        <p className="text-[11px] text-foreground italic line-clamp-2">"{contribution.message}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Amount + Status */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                  <p className="text-xl font-semibold text-secondary">
                    ${Number(contribution.amount).toFixed(2)}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border leading-none ${getStatusColor(
                      contribution.payment_status
                    )}`}
                  >
                    {contribution.payment_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
