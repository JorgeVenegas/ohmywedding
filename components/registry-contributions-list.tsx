"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { DollarSign, User, Calendar, MessageSquare } from "lucide-react"

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
}

interface RegistryContributionsListProps {
  weddingId: string
  items: RegistryItem[]
}

export function RegistryContributionsList({
  weddingId,
  items,
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
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      case "awaiting_transfer":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
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

  const totalContributions = contributions.length
  const totalAmount = contributions
    .filter(c => c.payment_status === 'completed')
    .reduce((sum, c) => sum + Number(c.amount), 0)
  const totalFees = contributions
    .filter(c => c.payment_status === 'completed')
    .reduce((sum, c) => sum + (c.guest_covers_fee ? 20 : 0), 0)

  if (isLoading) {
    return (
      <Card className="p-6 border border-border">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contributions...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Contributions</h3>

      {/* Summary Stats */}
      {contributions.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3 mb-6 p-4 bg-muted/40 rounded-lg">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Total Contributions
            </p>
            <p className="text-xl font-bold text-foreground">{totalContributions}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Total Received
            </p>
            <p className="text-xl font-bold text-secondary">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Fees Covered
            </p>
            <p className="text-xl font-bold text-primary">${totalFees.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Contributions List */}
      {contributions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No contributions yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="p-4 border border-border/50 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {contribution.contributor_name || "Anonymous"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                        contribution.payment_status
                      )}`}
                    >
                      {contribution.payment_status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getItemTitle(contribution.custom_registry_item_id)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-foreground">
                    ${Number(contribution.amount).toFixed(2)}
                  </p>
                  {contribution.guest_covers_fee && (
                    <p className="text-xs text-primary font-medium">+ 20 MXN fee</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(contribution.created_at)}</span>
                </div>
                {contribution.contributor_email && (
                  <div className="flex items-center gap-1 truncate">
                    <span className="flex-shrink-0">✉</span>
                    <span className="truncate">{contribution.contributor_email}</span>
                  </div>
                )}
              </div>

              {contribution.message && (
                <div className="mt-2 p-2 bg-background/50 rounded border border-border/30">
                  <p className="text-xs flex items-start gap-1.5">
                    <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground italic">"{contribution.message}"</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
