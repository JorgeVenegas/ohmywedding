"use client"

import { use, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, CalendarDays, MapPin, Clock, ChevronDown, ChevronRight, StickyNote } from "lucide-react"
import { AddEditEventModal } from "./components"
import type { ItineraryEvent, ItineraryEventWithChildren, SubEventInput } from "./types"
import { getEventIcon, getIconColor } from "./icon-map"

interface ItineraryPageProps {
  params: Promise<{ weddingId: string }>
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateHeading(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function ItineraryPage({ params }: ItineraryPageProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()

  const [events, setEvents] = useState<ItineraryEvent[]>([])
  const [weddingDate, setWeddingDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ItineraryEventWithChildren | null>(null)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/itinerary?weddingId=${encodeURIComponent(decodedWeddingId)}`)
      const data = await res.json()
      const allEvents: ItineraryEvent[] = data.events || []
      setEvents(allEvents)
      setWeddingDate(data.wedding_date || null)
      setExpandedEvents(new Set(allEvents.filter(e => !e.parent_id).map(e => e.id)))
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setLoading(false)
    }
  }, [decodedWeddingId, t])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  const handleSaveEvent = async (eventData: Partial<ItineraryEvent> & { subEvents?: SubEventInput[] }) => {
    setSaving(true)
    try {
      const isEdit = !!eventData.id
      const url = isEdit
        ? `/api/itinerary?weddingId=${encodeURIComponent(decodedWeddingId)}&eventId=${eventData.id}`
        : `/api/itinerary?weddingId=${encodeURIComponent(decodedWeddingId)}`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(isEdit ? t('admin.itinerary.notifications.updated') : t('admin.itinerary.notifications.created'))
      setShowEventModal(false)
      setEditingEvent(null)
      fetchData()
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/itinerary?weddingId=${encodeURIComponent(decodedWeddingId)}&eventId=${eventId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(t('admin.itinerary.notifications.deleted'))
      fetchData()
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  const openAddModal = () => { setEditingEvent(null); setShowEventModal(true) }

  // Build tree and group by day
  const mainEvents = events.filter(e => !e.parent_id)
  const eventTree: ItineraryEventWithChildren[] = mainEvents.map(event => ({
    ...event,
    children: events.filter(e => e.parent_id === event.id).sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ),
  }))

  const weddingDateShort = weddingDate?.slice(0, 10) ?? null
  const grouped: Record<string, ItineraryEventWithChildren[]> = {}
  for (const ev of eventTree) {
    const day = new Date(ev.start_time).toISOString().slice(0, 10)
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(ev)
  }
  const sortedDays = Object.keys(grouped).sort((a, b) => {
    if (a === weddingDateShort) return -1
    if (b === weddingDateShort) return 1
    return a.localeCompare(b)
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, 'dashboard')} title={t('admin.itinerary.title')} />
        <div className="page-container">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title={t('admin.itinerary.title')}
        rightContent={
          <Button size="sm" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('admin.itinerary.addEvent')}</span>
          </Button>
        }
      />
      <div className="page-container">
        <p className="text-muted-foreground mb-8">{t('admin.itinerary.description')}</p>

        {eventTree.length === 0 ? (
          <Card className="p-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('admin.itinerary.empty.title')}</h3>
            <p className="text-muted-foreground mb-6">{t('admin.itinerary.empty.description')}</p>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.itinerary.addEvent')}
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDays.map(day => {
              const isWeddingDay = day === weddingDateShort
              return (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-base font-semibold">{formatDateHeading(day)}</h2>
                    {isWeddingDay && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {t('admin.itinerary.weddingDay')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {grouped[day].map(event => {
                      const EventIcon = getEventIcon(event.icon)
                      const isExpanded = expandedEvents.has(event.id)
                      const hasChildren = event.children.length > 0
                      return (
                        <Card key={event.id} className="overflow-hidden">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {hasChildren ? (
                                <button onClick={() => toggleExpanded(event.id)} className="p-1 hover:bg-muted rounded flex-shrink-0">
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              ) : (
                                <div className="w-6 flex-shrink-0" />
                              )}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(event.icon).bg}`}>
                                <EventIcon className={`w-4 h-4 ${getIconColor(event.icon).text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base">{event.title}</div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTime(event.start_time)}
                                    {event.end_time && <> — {formatTime(event.end_time)}</>}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                                {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                                {event.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" /> {event.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => { setEditingEvent(event); setShowEventModal(true) }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteEvent(event.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && hasChildren && (
                            <div className="border-t bg-muted/20">
                              {event.children.map(child => {
                                const ChildIcon = getEventIcon(child.icon)
                                return (
                                  <div key={child.id} className="flex items-center justify-between px-4 py-3 pl-14 border-b last:border-b-0 hover:bg-muted/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(child.icon).bg}`}>
                                        <ChildIcon className={`w-3 h-3 ${getIconColor(child.icon).text}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{child.title}</div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-0.5">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(child.start_time)}
                                            {child.end_time && <> — {formatTime(child.end_time)}</>}
                                          </span>
                                          {child.location && (
                                            <span className="flex items-center gap-1">
                                              <MapPin className="w-3 h-3" />
                                              {child.location}
                                            </span>
                                          )}
                                        </div>
                                        {child.description && <p className="text-xs text-muted-foreground mt-0.5">{child.description}</p>}
                                        {child.notes && (
                                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <StickyNote className="w-2.5 h-2.5" /> {child.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                      <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => { setEditingEvent(child as ItineraryEventWithChildren); setShowEventModal(true) }}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteEvent(child.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showEventModal && (
        <AddEditEventModal
          open={showEventModal}
          onClose={() => { setShowEventModal(false); setEditingEvent(null) }}
          onSave={handleSaveEvent}
          event={editingEvent}
          existingChildren={editingEvent && !editingEvent.parent_id ? editingEvent.children ?? [] : []}
          saving={saving}
          weddingDate={weddingDate}
        />
      )}
    </main>
  )
}