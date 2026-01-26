"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  TrendingUp,
  Users,
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
  const [stats, setStats] = useState<InvitationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/invitation-tracking?weddingId=${encodeURIComponent(weddingId)}`
      )
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError("Failed to load stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [weddingId])

  if (loading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Invitation Opens</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Invitation Opens</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (!stats) return null

  const openRate = stats.totalGroups > 0 
    ? Math.round((stats.openedGroupsCount / stats.totalGroups) * 100)
    : 0

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Invitation Opens</h3>
        <Button variant="ghost" size="sm" onClick={fetchStats} className="h-7 px-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Open Rate */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Open Rate</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{openRate}%</p>
          <p className="text-xs text-blue-600/70">
            {stats.openedGroupsCount} of {stats.totalGroups} groups
          </p>
        </div>

        {/* Total Opens */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Total Opens</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.totalOpens}</p>
          <p className="text-xs text-green-600/70">
            All-time views
          </p>
        </div>

        {/* Opened */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Opened</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.openedGroupsCount}</p>
        </div>

        {/* Not Opened */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <EyeOff className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-muted-foreground">Not Opened</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.unopenedGroupsCount}</p>
        </div>
      </div>

      {/* Device Breakdown */}
      {stats.totalOpens > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Device Breakdown</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                {stats.deviceBreakdown.mobile} 
                <span className="text-muted-foreground ml-0.5">
                  ({Math.round((stats.deviceBreakdown.mobile / stats.totalOpens) * 100)}%)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                {stats.deviceBreakdown.tablet}
                <span className="text-muted-foreground ml-0.5">
                  ({Math.round((stats.deviceBreakdown.tablet / stats.totalOpens) * 100)}%)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                {stats.deviceBreakdown.desktop}
                <span className="text-muted-foreground ml-0.5">
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
