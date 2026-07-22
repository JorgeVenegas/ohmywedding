"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, RefreshCw, Clock } from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"

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

export function RegistryPaymentNotifications({ weddingId, limit = 5 }: RegistryPaymentNotificationsProps) {
  const { t } = useTranslation()
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
    } catch {
      setError(t('activity.noCompletedPayments'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [weddingId, limit])

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('activity.justNow')
    if (diffMins < 60) return t('activity.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('activity.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('activity.daysAgo', { count: diffDays })

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <Card className="p-4 h-full border-[#420c14]/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#420c14]">{t('activity.completedPayments')}</h3>
        <Button variant="ghost" size="sm" onClick={fetchData} className="h-7 px-2 text-[#420c14]/30 hover:text-[#420c14]">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#420c14]/8 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#420c14]/8 rounded w-3/4" />
                <div className="h-2.5 bg-[#420c14]/5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#420c14]/50 mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData} className="text-[#420c14]/50 hover:text-[#420c14]">
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('activity.retry')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-7 h-7 text-[#420c14]/20 mx-auto mb-2" />
          <p className="text-sm text-[#420c14]/50">{t('activity.noCompletedPayments')}</p>
          <p className="text-xs text-[#420c14]/35 mt-1">{t('activity.recentPaymentsHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-1.5">
              <div className="p-1.5 rounded-full bg-[#DDA46F]/10 text-[#DDA46F] flex-shrink-0">
                <Gift className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#420c14] leading-snug">
                  {item.itemTitle
                    ? t('activity.contributedTo', { name: item.contributorName, amount: item.amount.toFixed(2), item: item.itemTitle })
                    : t('activity.contributed', { name: item.contributorName, amount: item.amount.toFixed(2) })
                  }
                </p>
                {item.message && (
                  <p className="text-xs text-[#420c14]/45 mt-0.5 line-clamp-2">{item.message}</p>
                )}
                <p className="text-xs text-[#420c14]/40 mt-0.5">{formatTimeAgo(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
