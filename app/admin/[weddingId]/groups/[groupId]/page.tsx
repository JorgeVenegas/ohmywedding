"use client"

import React, { useState, useEffect, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import {
  Users,
  Phone,
  Tag,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Calendar,
  ArrowLeft,
  User,
  Activity,
  MessageSquare,
  Utensils,
  Plane,
  Copy,
  ExternalLink,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts"

interface Guest {
  id: string
  name: string
  phone_number: string | null
  email: string | null
  tags: string[]
  confirmation_status: 'pending' | 'confirmed' | 'declined'
  dietary_restrictions: string | null
  notes: string | null
  invited_by: string[]
  is_traveling?: boolean
  traveling_from?: string | null
  travel_arrangement?: string | null
  created_at: string
}

interface GuestGroup {
  id: string
  name: string
  phone_number: string | null
  tags: string[]
  notes: string | null
  invited_by: string[]
  invitation_sent: boolean
  invitation_sent_at: string | null
  message: string | null
  rsvp_submitted_at: string | null
  created_at: string
  guests: Guest[]
  first_opened_at: string | null
  open_count: number
}

interface ActivityItem {
  id: string
  type: string
  description: string
  metadata: Record<string, any>
  createdAt: string
  groupName?: string
  guestName?: string
}

interface OpenEvent {
  id: string
  timestamp: string
  deviceType: string
}

interface GroupDetailsPageProps {
  params: Promise<{ weddingId: string; groupId: string }>
}

const TAG_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-700 border-blue-200",
  friends: "bg-green-100 text-green-700 border-green-200",
  work: "bg-purple-100 text-purple-700 border-purple-200",
  neighbors: "bg-orange-100 text-orange-700 border-orange-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function GroupDetailsPage({ params }: GroupDetailsPageProps) {
  const { weddingId, groupId } = use(params)
  const router = useRouter()
  
  const [group, setGroup] = useState<GuestGroup | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [openEvents, setOpenEvents] = useState<OpenEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [weddingNameId, setWeddingNameId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchGroupDetails()
    fetchActivities()
    fetchOpenHistory()
    fetchWeddingInfo()
  }, [weddingId, groupId])

  const fetchWeddingInfo = async () => {
    try {
      const response = await fetch(`/api/weddings/${encodeURIComponent(weddingId)}/details`)
      const result = await response.json()
      if (result.details?.wedding_name_id) {
        setWeddingNameId(result.details.wedding_name_id)
      }
    } catch (error) {
      console.error('Error fetching wedding info:', error)
    }
  }

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/guest-groups/${groupId}?weddingId=${encodeURIComponent(weddingId)}`)
      const result = await response.json()
      if (result.data) {
        setGroup(result.data)
      }
    } catch (error) {
      console.error('Error fetching group:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/activity-logs?weddingId=${encodeURIComponent(weddingId)}&groupId=${groupId}&limit=50`)
      const result = await response.json()
      if (result.activities) {
        setActivities(result.activities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchOpenHistory = async () => {
    try {
      const response = await fetch(`/api/invitation-tracking/timeline?weddingId=${encodeURIComponent(weddingId)}&groupId=${groupId}`)
      const result = await response.json()
      if (result.openEvents) {
        setOpenEvents(result.openEvents)
      }
    } catch (error) {
      console.error('Error fetching open history:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "declined":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-amber-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border border-green-200"
      case "declined":
        return "bg-red-100 text-red-700 border border-red-200"
      case "pending":
      default:
        return "bg-amber-100 text-amber-700 border border-amber-200"
    }
  }

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invitation_opened':
        return <Eye className="w-4 h-4 text-blue-500" />
      case 'rsvp_confirmed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'rsvp_declined':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'rsvp_updated':
        return <Activity className="w-4 h-4 text-purple-500" />
      case 'travel_info_updated':
        return <Plane className="w-4 h-4 text-cyan-500" />
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const invitationUrl = useMemo(() => {
    if (!weddingNameId || !groupId) return ''
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ohmy.wedding'
    return `${baseUrl.replace('https://', `https://${weddingNameId}.`).replace('http://', `http://${weddingNameId}.`)}?g=${groupId}`
  }, [weddingNameId, groupId])

  const copyInvitationUrl = async () => {
    if (invitationUrl) {
      await navigator.clipboard.writeText(invitationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Prepare opens timeline data
  const opensChartData = useMemo(() => {
    if (!openEvents.length) return []
    
    const dataByDate: Record<string, number> = {}
    openEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      dataByDate[date] = (dataByDate[date] || 0) + 1
    })

    return Object.entries(dataByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opens: count,
      }))
  }, [openEvents])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header
          showBackButton
          backHref={getCleanAdminUrl(weddingId, 'invitations')}
          title="Group Details"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-background">
        <Header
          showBackButton
          backHref={getCleanAdminUrl(weddingId, 'invitations')}
          title="Group Details"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Group not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(getCleanAdminUrl(weddingId, 'invitations'))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invitations
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  const confirmedCount = group.guests.filter(g => g.confirmation_status === 'confirmed').length
  const declinedCount = group.guests.filter(g => g.confirmation_status === 'declined').length
  const pendingCount = group.guests.filter(g => g.confirmation_status === 'pending').length

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'invitations')}
        title="Group Details"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Group Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              {group.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDate(group.created_at)}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-sm font-medium">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{group.guests.length} guests</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-700">{confirmedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-sm font-medium">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-sm font-medium">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700">{declinedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-sm font-medium">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">{group.open_count} opens</span>
            </div>
          </div>
        </div>

        {/* Group Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact & Meta Info */}
          <Card className="p-4 space-y-4">
            <h3 className="font-medium text-foreground">Group Information</h3>
            
            {group.phone_number && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{group.phone_number}</span>
              </div>
            )}

            {group.tags && group.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {group.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-full text-xs border ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {group.invited_by && group.invited_by.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Invited by: {group.invited_by.join(', ')}</span>
              </div>
            )}

            {group.notes && (
              <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
                <p className="font-medium text-foreground mb-1">Notes</p>
                <p>{group.notes}</p>
              </div>
            )}
          </Card>

          {/* Invitation Status */}
          <Card className="p-4 space-y-4">
            <h3 className="font-medium text-foreground">Invitation Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Invitation Sent</span>
                <span className={group.invitation_sent ? 'text-green-600' : 'text-muted-foreground'}>
                  {group.invitation_sent ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {group.invitation_sent_at ? formatDate(group.invitation_sent_at) : 'Yes'}
                    </span>
                  ) : 'Not yet'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">First Opened</span>
                <span className={group.first_opened_at ? 'text-blue-600' : 'text-muted-foreground'}>
                  {group.first_opened_at ? formatDate(group.first_opened_at) : 'Not opened'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">RSVP Submitted</span>
                <span className={group.rsvp_submitted_at ? 'text-green-600' : 'text-muted-foreground'}>
                  {group.rsvp_submitted_at ? formatDate(group.rsvp_submitted_at) : 'Pending'}
                </span>
              </div>
            </div>

            {/* Invitation URL */}
            {invitationUrl && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-2">Invitation Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">
                    {invitationUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInvitationUrl}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shrink-0"
                  >
                    <a href={invitationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Guests Table */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Group Members ({group.guests.length})</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Name</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Contact</th>
                  <th className="pb-2 font-medium text-muted-foreground">Dietary</th>
                  <th className="pb-2 font-medium text-muted-foreground">Travel</th>
                </tr>
              </thead>
              <tbody>
                {group.guests.map((guest) => (
                  <tr key={guest.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="font-medium">{guest.name}</div>
                      {guest.tags && guest.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {guest.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusBadgeClass(guest.confirmation_status)}`}>
                        {getStatusIcon(guest.confirmation_status)}
                        {guest.confirmation_status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {guest.phone_number || guest.email || '-'}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {guest.dietary_restrictions ? (
                        <span className="flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          {guest.dietary_restrictions}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {guest.is_traveling ? (
                        <span className="flex items-center gap-1 text-cyan-600">
                          <Plane className="w-3 h-3" />
                          {guest.traveling_from || 'Yes'}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {group.guests.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No guests in this group</p>
          )}
        </Card>

        {/* Opens History Chart */}
        {opensChartData.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium text-foreground mb-4">Invitation Views Over Time</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={opensChartData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="opens"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Activity Timeline */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Activity History</h3>
          
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No activity recorded yet</p>
          )}

          {/* Open Events */}
          {openEvents.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-foreground mb-3">Open History ({openEvents.length} views)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {openEvents.slice(0, 12).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 p-2 rounded bg-blue-50 text-sm"
                  >
                    <Eye className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-700">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                    <span className="text-blue-500 text-xs">
                      ({event.deviceType})
                    </span>
                  </div>
                ))}
              </div>
              {openEvents.length > 12 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{openEvents.length - 12} more views
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Message History */}
        {group.message && (
          <Card className="p-4">
            <h3 className="font-medium text-foreground mb-3">RSVP Message</h3>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{group.message}</p>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
