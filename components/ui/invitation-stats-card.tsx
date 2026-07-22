"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import {
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  TrendingUp,
  Users,
  Lock,
} from "lucide-react"

interface InvitationStats {
  totalGroups: number
  openedGroupsCount: number
  unopenedGroupsCount: number
  totalOpens: number
  deviceBreakdown: {
    mobile: number
    tablet: number
    desktop: number
  }
  openedGroups: Array<{
    id: string
    name: string
    first_opened_at: string
    open_count: number
  }>
  unopenedGroups: Array<{
    id: string
    name: string
  }>
}

interface InvitationStatsCardProps {
  weddingId: string
  compact?: boolean
}

export function InvitationStatsCard({ weddingId, compact = false }: InvitationStatsCardProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<InvitationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restricted, setRestricted] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    setRestricted(false)
    try {
      const response = await fetch(
        `/api/invitation-tracking?weddingId=${encodeURIComponent(weddingId)}`
      )
      if (response.status === 403) {
        const data = await response.json()
        if (data.restricted) {
          setRestricted(true)
          return
        }
      }
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [weddingId])

  const cardTitle = (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-[#420c14]">{t('activity.invitationOpens')}</h3>
    </div>
  )

  if (loading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
        {cardTitle}
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#420c14]/5 rounded-xl" />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
        {cardTitle}
        <div className="text-center py-4">
          <p className="text-sm text-[#420c14]/50 mb-2">{t('activity.failedToLoadStats')}</p>
          <Button variant="ghost" size="sm" onClick={fetchStats} className="text-[#420c14]/50 hover:text-[#420c14]">
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('activity.retry')}
          </Button>
        </div>
      </Card>
    )
  }

  if (restricted) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} h-full border-[#420c14]/10`}>
        {cardTitle}
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <Lock className="w-7 h-7 text-[#420c14]/15" />
          <p className="text-sm font-medium text-[#420c14]/50">Premium feature</p>
          <p className="text-xs text-[#420c14]/35">Upgrade to track invitation opens and device analytics.</p>
        </div>
      </Card>
    )
  }

  if (!stats) return null

  const openRate = stats.totalGroups > 0
    ? Math.round((stats.openedGroupsCount / stats.totalGroups) * 100)
    : 0

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'} border-[#420c14]/10`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#420c14]">{t('activity.invitationOpens')}</h3>
        <Button variant="ghost" size="sm" onClick={fetchStats} className="h-7 px-2 text-[#420c14]/30 hover:text-[#420c14]">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {/* Open Rate */}
        <div className="p-3 rounded-xl bg-[#420c14]/5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#420c14]/50" />
            <span className="text-[10px] uppercase tracking-wide text-[#420c14]/50 font-medium">{t('activity.openRate')}</span>
          </div>
          <p className="text-2xl font-serif text-[#420c14]">{openRate}%</p>
          <p className="text-[10px] text-[#420c14]/40 mt-0.5">
            {t('activity.openedOf', { opened: String(stats.openedGroupsCount), total: String(stats.totalGroups) })}
          </p>
        </div>

        {/* Total Opens */}
        <div className="p-3 rounded-xl bg-[#DDA46F]/8">
          <div className="flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-[#DDA46F]" />
            <span className="text-[10px] uppercase tracking-wide text-[#DDA46F] font-medium">{t('activity.totalOpens')}</span>
          </div>
          <p className="text-2xl font-serif text-[#420c14]">{stats.totalOpens}</p>
          <p className="text-[10px] text-[#420c14]/40 mt-0.5">
            {t('activity.allTimeViews')}
          </p>
        </div>

        {/* Opened */}
        <div className="p-3 rounded-xl bg-[#420c14]/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-[#420c14]/40" />
            <span className="text-[10px] uppercase tracking-wide text-[#420c14]/40 font-medium">{t('activity.opened')}</span>
          </div>
          <p className="text-xl font-serif text-[#420c14]">{stats.openedGroupsCount}</p>
        </div>

        {/* Not Opened */}
        <div className="p-3 rounded-xl bg-[#420c14]/5">
          <div className="flex items-center gap-1.5 mb-1">
            <EyeOff className="w-3.5 h-3.5 text-[#420c14]/30" />
            <span className="text-[10px] uppercase tracking-wide text-[#420c14]/30 font-medium">{t('activity.notOpened')}</span>
          </div>
          <p className="text-xl font-serif text-[#420c14]/60">{stats.unopenedGroupsCount}</p>
        </div>
      </div>

      {/* Device Breakdown */}
      {stats.totalOpens > 0 && (
        <div className="border-t border-[#420c14]/8 pt-3">
          <p className="text-[10px] uppercase tracking-wide text-[#420c14]/40 mb-2">{t('activity.deviceBreakdown')}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#420c14]/35" />
              <span className="text-xs font-medium text-[#420c14]">
                {stats.deviceBreakdown.mobile}
                <span className="text-[#420c14]/40 ml-0.5">
                  ({Math.round((stats.deviceBreakdown.mobile / stats.totalOpens) * 100)}%)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-[#420c14]/35" />
              <span className="text-xs font-medium text-[#420c14]">
                {stats.deviceBreakdown.tablet}
                <span className="text-[#420c14]/40 ml-0.5">
                  ({Math.round((stats.deviceBreakdown.tablet / stats.totalOpens) * 100)}%)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-[#420c14]/35" />
              <span className="text-xs font-medium text-[#420c14]">
                {stats.deviceBreakdown.desktop}
                <span className="text-[#420c14]/40 ml-0.5">
                  ({Math.round((stats.deviceBreakdown.desktop / stats.totalOpens) * 100)}%)
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
