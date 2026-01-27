"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, RefreshCw, Clock } from "lucide-react"

interface ContributionNotification {
  id: string
  amount: number
  contributorName: string
  message: string
  itemTitle: string
  createdAt: string
}

interface RegistryPaymentNotificationsProps {
  weddingId: string
  limit?: number
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function RegistryPaymentNotifications({ weddingId, limit = 5 }: RegistryPaymentNotificationsProps) {
  const [items, setItems] = useState<ContributionNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/registry/completed?weddingId=${encodeURIComponent(weddingId)}&limit=${limit}`)
      if (!res.ok) throw new Error("Failed to load payments")
      const data = await res.json()
      setItems(data.contributions || [])
    } catch (err) {
      setError("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [weddingId, limit])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Completed Payments</h3>
        <Button variant="ghost" size="sm" onClick={fetchData} className="h-7 px-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No completed payments yet</p>
          <p className="text-xs text-muted-foreground mt-1">Recent completed payments will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-secondary/15 text-secondary">
                <Gift className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-tight">
                  {item.contributorName} contributed ${item.amount.toFixed(2)}
                  {item.itemTitle ? ` to ${item.itemTitle}` : ""}
                </p>
                {item.message && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
