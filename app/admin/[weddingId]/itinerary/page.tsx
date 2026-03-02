"use client"

import { use, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, CalendarDays, MapPin } from "lucide-react"
import { AddEditEventModal } from "./components"
import type { ItineraryEvent, ItineraryEventWithChildren, SubEventInput } from "./types"
import { getEventIcon, getIconColor } from "./icon-map"

interface ItineraryPageProps {
  params: Promise<{ weddingId: string }>
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/itinerary?weddingId=${encodeURIComponent(decodedWeddingId)}`)
      const data = await res.json()
      const allEvents: ItineraryEvent[] = data.events || []
      setEvents(allEvents)
      setWeddingDate(data.wedding_date || null)
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setLoading(false)
    }
  }, [decodedWeddingId, t])

  useEffect(() => { fetchData() }, [fetchData])

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

  const lastMainEvent = mainEvents[mainEvents.length - 1] || null

  const weddingDateShort = weddingDate?.slice(0, 10) ?? null
  const grouped: Record<string, ItineraryEventWithChildren[]> = {}
  for (const ev of eventTree) {
    const d = new Date(ev.start_time)
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
      <div className="page-container max-w-2xl">
        <p className="text-muted-foreground mb-10">{t('admin.itinerary.description')}</p>

        {eventTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-5">
              <CalendarDays className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">{t('admin.itinerary.empty.title')}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">{t('admin.itinerary.empty.description')}</p>
            <Button onClick={openAddModal} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.itinerary.addEvent')}
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedDays.map(day => {
              const isWeddingDay = day === weddingDateShort
              return (
                <div key={day}>
                  {/* Day heading */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {formatDateHeading(day)}
                    </span>
                    {isWeddingDay && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary border border-primary/20">
                        {t('admin.itinerary.weddingDay')}
                      </span>
                    )}
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[4.5rem] top-3 bottom-3 w-px bg-border" aria-hidden="true" />

                    <div className="space-y-0">
                      {grouped[day].map((event, idx) => {
                        const EventIcon = getEventIcon(event.icon)
                        const iconColor = getIconColor(event.icon)
                        const hasChildren = event.children.length > 0
                        const isLast = idx === grouped[day].length - 1

                        return (
                          <div key={event.id} className={`relative flex gap-6 ${isLast ? '' : 'pb-6'}`}>
                            {/* Time */}
                            <div className="w-14 flex-shrink-0 text-right pt-0.5">
                              <span className="text-sm tabular-nums text-muted-foreground font-medium">
                                {formatTime(event.start_time)}
                              </span>
                            </div>

                            {/* Dot */}
                            <div className="relative flex-shrink-0 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor.bg} ring-2 ring-background`}>
                                <EventIcon className={`w-3.5 h-3.5 ${iconColor.text}`} />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 group">
                              <div className="flex items-start justify-between gap-2 -mt-0.5">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm leading-tight">{event.title}</div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                    {event.end_time && (
                                      <span className="text-xs text-muted-foreground tabular-nums">
                                        → {formatTime(event.end_time)}
                                      </span>
                                    )}
                                    {event.location && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        {event.location}
                                      </span>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{event.description}</p>
                                  )}
                                  {event.notes && (
                                    <p className="text-xs text-muted-foreground/70 mt-1 italic">{event.notes}</p>
                                  )}
                                </div>

                                {/* Actions — visible on hover */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button
                                    onClick={() => { setEditingEvent(event); setShowEventModal(true) }}
                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Sub-events */}
                              {hasChildren && (
                                <div className="mt-3 space-y-2 pl-2 border-l-2 border-border/60 ml-1">
                                  {event.children.map(child => {
                                    const ChildIcon = getEventIcon(child.icon)
                                    const childColor = getIconColor(child.icon)
                                    return (
                                      <div key={child.id} className="flex items-start gap-2.5 group/child">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${childColor.bg}`}>
                                          <ChildIcon className={`w-2.5 h-2.5 ${childColor.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs tabular-nums text-muted-foreground font-medium w-9 flex-shrink-0">
                                              {formatTime(child.start_time)}
                                            </span>
                                            <span className="text-xs font-medium truncate">{child.title}</span>
                                          </div>
                                          {(child.location || child.description) && (
                                            <div className="ml-11 flex flex-col gap-0.5 mt-0.5">
                                              {child.location && (
                                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                                  {child.location}
                                                </span>
                                              )}
                                              {child.description && (
                                                <span className="text-[11px] text-muted-foreground">{child.description}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/child:opacity-100 transition-opacity flex-shrink-0">
                                          <button
                                            onClick={() => { setEditingEvent(child as ItineraryEventWithChildren); setShowEventModal(true) }}
                                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteEvent(child.id)}
                                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add event inline CTA */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/40 group-hover:border-primary/60 flex items-center justify-center transition-colors">
                <Plus className="w-3 h-3" />
              </div>
              {t('admin.itinerary.addEvent')}
            </button>
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
          previousEvent={editingEvent ? null : lastMainEvent}
        />
      )}
    </main>
  )
}