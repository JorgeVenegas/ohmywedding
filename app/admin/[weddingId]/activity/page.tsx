"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import {
  Eye, CheckCircle2, XCircle, Pencil, Plane,
  UserPlus, UserMinus, FolderPlus, FolderMinus,
  MessageSquare, Gift, RefreshCw, Clock, Filter,
  ChevronDown,
} from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"

interface Activity {
  id: string
  type: string
  description: string
  metadata: Record<string, unknown>
  createdAt: string
  groupName?: string
  guestName?: string
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

const ACTIVITY_TYPE_KEYS: Record<string, string> = {
  invitation_opened: "activity.invitationOpenedDesc",
  rsvp_confirmed: "activity.rsvpConfirmedDesc",
  rsvp_declined: "activity.rsvpDeclinedDesc",
  rsvp_updated: "activity.rsvpUpdatedDesc",
  guest_added: "activity.guestAddedDesc",
  guest_removed: "activity.guestRemovedDesc",
  group_added: "activity.groupAddedDesc",
  group_removed: "activity.groupRemovedDesc",
  message_sent: "activity.messageSentDesc",
  registry_contribution: "activity.registryContributionDesc",
}

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ weddingId: string }>
}

export default function ActivityPage({ params }: Props) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()

  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  const filterOptions = [
    { value: '', label: t('activity.recentActivity') },
    { value: 'invitation_opened', label: 'Invitaciones abiertas' },
    { value: 'rsvp_confirmed', label: 'RSVP confirmados' },
    { value: 'rsvp_declined', label: 'RSVP declinados' },
    { value: 'rsvp_updated', label: 'RSVP actualizados' },
    { value: 'guest_added', label: 'Invitados agregados' },
    { value: 'guest_removed', label: 'Invitados eliminados' },
    { value: 'message_sent', label: 'Mensajes enviados' },
    { value: 'registry_contribution', label: 'Contribuciones al registro' },
  ]

  const fetchActivities = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true)
      setOffset(0)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    const currentOffset = reset ? 0 : offset
    const queryParams = new URLSearchParams({
      weddingId: decodedWeddingId,
      limit: String(PAGE_SIZE + 1),
      ...(currentOffset > 0 ? { offset: String(currentOffset) } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    })

    try {
      const res = await fetch(`/api/activity-logs?${queryParams}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      const items: Activity[] = data.activities || []
      const planFromApi = data.plan as string
      setPlan(planFromApi)

      const hasNextPage = items.length > PAGE_SIZE
      const page = hasNextPage ? items.slice(0, PAGE_SIZE) : items

      if (reset) {
        setActivities(page)
        setOffset(page.length)
      } else {
        setActivities(prev => [...prev, ...page])
        setOffset(prev => prev + page.length)
      }
      setHasMore(hasNextPage && planFromApi === 'deluxe')
    } catch {
      setError(t('activity.noRecentActivity'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [decodedWeddingId, offset, typeFilter, t])

  useEffect(() => {
    fetchActivities(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedWeddingId, typeFilter])

  useEffect(() => {
    if (!showFilterMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilterMenu])

  function formatFullDate(dateString: string): { relative: string; absolute: string } {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let relative: string
    if (diffMins < 1) relative = t('activity.justNow')
    else if (diffMins < 60) relative = t('activity.minutesAgo', { count: diffMins })
    else if (diffHours < 24) relative = t('activity.hoursAgo', { count: diffHours })
    else if (diffDays < 7) relative = t('activity.daysAgo', { count: diffDays })
    else relative = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

    const absolute = date.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    return { relative, absolute }
  }

  function getActivityDescription(activity: Activity): string {
    const name = activity.groupName || activity.guestName || '—'
    const key = ACTIVITY_TYPE_KEYS[activity.type]
    if (key) return t(key as Parameters<typeof t>[0], { name })
    return activity.description
  }

  function groupByDate(items: Activity[]) {
    const groups: { label: string; items: Activity[] }[] = []
    const seen = new Map<string, number>()

    for (const item of items) {
      const date = new Date(item.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

      let label: string
      if (diffDays === 0) label = 'Hoy'
      else if (diffDays === 1) label = 'Ayer'
      else label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

      if (!seen.has(label)) {
        seen.set(label, groups.length)
        groups.push({ label, items: [] })
      }
      groups[seen.get(label)!].items.push(item)
    }
    return groups
  }

  const grouped = groupByDate(activities)
  const activeFilterLabel = filterOptions.find(o => o.value === typeFilter)?.label

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(decodedWeddingId, 'dashboard')}
        title={t('activity.recentActivity')}
      />

      {/* Sticky toolbar */}
      <div className="sticky top-[52px] z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('activity.recentActivity')}</h1>
                {plan && plan !== 'deluxe' && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {plan === 'free'
                      ? 'Solo se muestran las últimas 8 actividades en el plan gratuito'
                      : 'Se muestran actividades de los últimos 7 días en el plan premium'}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Count pill */}
                {!loading && activities.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground font-semibold">{activities.length}</span>
                    <span className="text-muted-foreground">registros</span>
                  </div>
                )}

                {/* Filter */}
                <div className="relative" ref={filterRef}>
                  <Button
                    variant={typeFilter ? "secondary" : "outline"}
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setShowFilterMenu(v => !v)}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    {typeFilter ? activeFilterLabel : 'Filtrar'}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                  {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-md py-1 min-w-[210px]">
                      {filterOptions.map(opt => (
                        <button
                          key={opt.value}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                            typeFilter === opt.value ? 'text-primary font-medium' : 'text-foreground'
                          }`}
                          onClick={() => { setTypeFilter(opt.value); setShowFilterMenu(false) }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => fetchActivities(true)}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mt-6">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-start gap-3 animate-pulse px-4 py-3 rounded-lg border border-border">
                  <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 py-1">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <Card className="p-12 text-center">
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => fetchActivities(true)}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {t('activity.retry')}
              </Button>
            </Card>
          )}

          {/* Empty */}
          {!loading && !error && activities.length === 0 && (
            <Card className="p-16 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">{t('activity.noRecentActivity')}</p>
              <p className="text-xs text-muted-foreground">{t('activity.noActivityYet')}</p>
            </Card>
          )}

          {/* Activity grouped by date */}
          {!loading && !error && activities.length > 0 && (
            <div className="space-y-8">
              {grouped.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {group.label}
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {group.items.map(activity => {
                      const Icon = ACTIVITY_ICONS[activity.type] || Clock
                      const colorClass = ACTIVITY_COLORS[activity.type] || "text-gray-500 bg-gray-50"
                      const { relative, absolute } = formatFullDate(activity.createdAt)

                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-4 px-4 py-3 bg-background hover:bg-muted/40 transition-colors"
                        >
                          <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">
                              {getActivityDescription(activity)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {relative}
                            </p>
                          </div>
                          <span
                            className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block flex-shrink-0"
                            title={absolute}
                          >
                            {new Date(activity.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchActivities(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Cargando...</>
                      : 'Ver más actividad'}
                  </Button>
                </div>
              )}

              {!hasMore && plan !== 'deluxe' && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  {plan === 'free'
                    ? 'Actualiza tu plan para ver todo el historial de actividad'
                    : 'Se muestran los últimos 7 días de actividad'}
                </p>
              )}
            </div>
          )}

        </div>
      </div>

    </main>
  )
}
