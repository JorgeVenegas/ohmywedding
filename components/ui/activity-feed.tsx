"use client"

import { useEffect, useState } from "react"
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
} from "lucide-react"

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
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityFeed({ 
  weddingId, 
  limit = 10, 
  showTitle = true,
  showViewAll = true,
  compact = false 
}: ActivityFeedProps) {
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
    } catch (err) {
      setError("Failed to load activity")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [weddingId, limit])

  const getActivityIcon = (type: string) => {
    const Icon = ACTIVITY_ICONS[type] || Clock
    return Icon
  }

  const getActivityColor = (type: string) => {
    return ACTIVITY_COLORS[type] || "text-gray-500 bg-gray-50"
  }

  if (loading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'}`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'}`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
        )}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchActivities}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'}`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
        )}
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activity will appear here when guests interact with your wedding site
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <Button variant="ghost" size="sm" onClick={fetchActivities} className="h-7 px-2">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      
      <div className={`space-y-${compact ? '2' : '3'}`}>
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          const colorClass = getActivityColor(activity.type)
          
          return (
            <div 
              key={activity.id} 
              className={`flex items-start gap-${compact ? '2' : '3'} ${compact ? 'py-1' : 'py-1.5'}`}
            >
              <div className={`p-1.5 rounded-full ${colorClass} flex-shrink-0`}>
                <Icon className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-foreground leading-tight`}>
                  {activity.description}
                </p>
                <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground mt-0.5`}>
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {showViewAll && activities.length >= limit && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Showing latest {limit} activities
          </p>
        </div>
      )}
    </Card>
  )
}
