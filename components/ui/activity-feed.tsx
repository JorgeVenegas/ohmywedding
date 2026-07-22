"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Eye,
  CheckCircle2,
  XCircle,
  Pencil,
  Plane,
  UserPlus,
  UserMinus,
  FolderPlus,
  FolderMinus,
  MessageSquare,
  Gift,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"

interface Activity {
  id: string
  type: string
  description: string
  metadata: Record<string, any>
  createdAt: string
  groupName?: string
  guestName?: string
}

interface ActivityFeedProps {
  weddingId: string
  limit?: number
  showTitle?: boolean
  showViewAll?: boolean
  compact?: boolean
  viewAllHref?: string
}

const ACTIVITY_ICONS: Record<string, typeof Eye> = {
  invitation_opened: Eye,
  rsvp_confirmed: CheckCircle2,
  rsvp_declined: XCircle,
  rsvp_updated: Pencil,
  travel_info_updated: Plane,
  guest_added: UserPlus,
  guest_removed: UserMinus,
  group_added: FolderPlus,
  group_removed: FolderMinus,
  message_sent: MessageSquare,
  registry_contribution: Gift,
}

const ACTIVITY_COLORS: Record<string, string> = {
  invitation_opened: "text-blue-500 bg-blue-50",
  rsvp_confirmed: "text-green-500 bg-green-50",
  rsvp_declined: "text-red-500 bg-red-50",
  rsvp_updated: "text-amber-500 bg-amber-50",
  travel_info_updated: "text-indigo-500 bg-indigo-50",
  guest_added: "text-teal-500 bg-teal-50",
  guest_removed: "text-gray-500 bg-gray-50",
  group_added: "text-purple-500 bg-purple-50",
  group_removed: "text-gray-500 bg-gray-50",
  message_sent: "text-cyan-500 bg-cyan-50",
  registry_contribution: "text-pink-500 bg-pink-50",
}

export function ActivityFeed({
  weddingId,
  limit = 10,
  showTitle = true,
  showViewAll = true,
  compact = false,
  viewAllHref,
}: ActivityFeedProps) {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/activity-logs?weddingId=${encodeURIComponent(weddingId)}&limit=${limit}`
      )
      if (!response.ok) throw new Error("Failed to fetch activities")
      const data = await response.json()
      setActivities(data.activities || [])
    } catch {
      setError(t('activity.noRecentActivity'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
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

  function getActivityDescription(activity: Activity): string {
    const name = activity.groupName || activity.guestName || '—'
    switch (activity.type) {
      case 'invitation_opened':    return t('activity.invitationOpenedDesc', { name })
      case 'rsvp_confirmed':       return t('activity.rsvpConfirmedDesc', { name })
      case 'rsvp_declined':        return t('activity.rsvpDeclinedDesc', { name })
      case 'rsvp_updated':         return t('activity.rsvpUpdatedDesc', { name })
      case 'guest_added':          return t('activity.guestAddedDesc', { name })
      case 'guest_removed':        return t('activity.guestRemovedDesc', { name })
      case 'group_added':          return t('activity.groupAddedDesc', { name })
      case 'group_removed':        return t('activity.groupRemovedDesc', { name })
      case 'message_sent':         return t('activity.messageSentDesc', { name })
      case 'registry_contribution':return t('activity.registryContributionDesc', { name })
      default:                     return activity.description
    }
  }

  const titleNode = showTitle && (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-[#420c14]">{t('activity.recentActivity')}</h3>
      <div className="flex items-center gap-1">
        {viewAllHref && (
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[#420c14]/40 hover:text-[#420c14] gap-1">
              {t('activity.viewAllActivity')}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        )}
        {!loading && (
          <Button variant="ghost" size="sm" onClick={fetchActivities} className="h-7 px-2 text-[#420c14]/30 hover:text-[#420c14]">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#420c14]">{t('activity.recentActivity')}</h3>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-[#420c14]/8 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-[#420c14]/8 rounded w-3/4 mb-2" />
                <div className="h-2.5 bg-[#420c14]/5 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
        {titleNode}
        <div className="text-center py-4">
          <p className="text-sm text-[#420c14]/50 mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchActivities} className="text-[#420c14]/50 hover:text-[#420c14]">
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('activity.retry')}
          </Button>
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
        {titleNode}
        <div className="text-center py-6">
          <Clock className="w-7 h-7 text-[#420c14]/20 mx-auto mb-2" />
          <p className="text-sm text-[#420c14]/50">{t('activity.noRecentActivity')}</p>
          <p className="text-xs text-[#420c14]/35 mt-1">{t('activity.noActivityYet')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
      {titleNode}

      <div className={`space-y-${compact ? '2' : '1'}`}>
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type] || Clock
          const colorClass = ACTIVITY_COLORS[activity.type] || "text-gray-500 bg-gray-50"

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-${compact ? '2' : '3'} ${compact ? 'py-1' : 'py-2'}`}
            >
              <div className={`p-1.5 rounded-full ${colorClass} flex-shrink-0 opacity-80`}>
                <Icon className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-[#420c14] leading-snug`}>
                  {getActivityDescription(activity)}
                </p>
                <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-[#420c14]/40 mt-0.5`}>
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {showViewAll && activities.length >= limit && (
        <div className="mt-3 pt-3 border-t border-[#420c14]/10 flex items-center justify-center">
          {viewAllHref ? (
            <Link href={viewAllHref} className="text-xs text-[#420c14]/40 hover:text-[#420c14] transition-colors flex items-center gap-1">
              {t('activity.viewAllActivity')}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <p className="text-xs text-[#420c14]/40">
              {t('activity.showingLatest', { count: limit })}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
