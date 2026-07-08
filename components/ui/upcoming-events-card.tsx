"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import { mergeTimelineItems, CATEGORY_COLORS } from "@/app/admin/[weddingId]/timeline/types"
import type { WeddingEvent, Supplier, TimelineItem } from "@/app/admin/[weddingId]/timeline/types"

interface UpcomingEventsCardProps {
  weddingId: string
  viewAllHref: string
}

export function UpcomingEventsCard({ weddingId, viewAllHref }: UpcomingEventsCardProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async () => {
      try {
        const [eventsRes, suppliersRes] = await Promise.all([
          fetch(`/api/events?weddingId=${encodeURIComponent(weddingId)}`),
          fetch(`/api/suppliers?weddingId=${encodeURIComponent(weddingId)}`),
        ])
        const eventsData = await eventsRes.json()
        const suppliersData = await suppliersRes.json()

        const events: WeddingEvent[] = eventsData.events ?? []
        const suppliers: Supplier[] = suppliersData.suppliers ?? []

        const merged = mergeTimelineItems(events, suppliers)
        const upcoming = merged.filter(item => {
          if (item.source === 'event' && (item.status === 'completed' || item.status === 'cancelled')) return false
          return item.date >= today
        }).slice(0, 5)

        setItems(upcoming)
      } catch {
        // silently fail — widget is non-critical
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [weddingId, today])

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">
          {t('admin.timeline.upcomingEvents')}
        </h3>
        <Link href={viewAllHref}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
            {t('admin.timeline.viewAll')}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-muted flex-shrink-0" />
              <div className="h-4 bg-muted rounded flex-1" />
              <div className="h-3 bg-muted rounded w-12 flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('admin.timeline.noEvents')}</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[item.category]}`} />
              <span className="flex-1 text-sm truncate">{item.title}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(item.date)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
