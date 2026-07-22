"use client"

import { use, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { Plus } from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"
import { toast } from "sonner"
import {
  WeddingEvent,
  Supplier,
  TimelineItem,
  TimelineFilter,
  EventStatus,
  mergeTimelineItems,
} from "./types"
import { CalendarView } from "./components/CalendarView"
import { AddEditEventModal } from "./components/AddEditEventModal"
import { EditPaymentModal } from "./components/EditPaymentModal"

export default function TimelinePage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()

  const today = new Date().toISOString().split('T')[0]

  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TimelineFilter>('thisMonth')
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null)
  const [editingPayment, setEditingPayment] = useState<TimelineItem | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [eventsRes, suppliersRes] = await Promise.all([
        fetch(`/api/events?weddingId=${encodeURIComponent(decodedWeddingId)}`),
        fetch(`/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}`),
      ])
      const eventsData = await eventsRes.json()
      const suppliersData = await suppliersRes.json()
      setEvents(eventsData.events ?? [])
      setSuppliers(suppliersData.suppliers ?? [])
    } catch {
      toast.error(t('admin.timeline.notifications.error'))
    } finally {
      setLoading(false)
    }
  }, [decodedWeddingId, t])

  useEffect(() => { fetchData() }, [fetchData])

  const mergedItems = mergeTimelineItems(events, suppliers)

  const handleSave = async (data: Partial<WeddingEvent>) => {
    try {
      if (editingEvent) {
        const res = await fetch(
          `/api/events/${editingEvent.id}?weddingId=${encodeURIComponent(decodedWeddingId)}`,
          { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
        )
        if (!res.ok) throw new Error()
        toast.success(t('admin.timeline.notifications.updated'))
      } else {
        const res = await fetch(
          `/api/events?weddingId=${encodeURIComponent(decodedWeddingId)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
        )
        if (!res.ok) throw new Error()
        toast.success(t('admin.timeline.notifications.created'))
      }
      setShowModal(false)
      setEditingEvent(null)
      fetchData()
    } catch {
      toast.error(t('admin.timeline.notifications.error'))
    }
  }

  const handleStatusChange = async (item: TimelineItem, status: EventStatus) => {
    setEvents(prev => prev.map(e =>
      e.id === item.id
        ? { ...e, status, completed_at: status === 'completed' ? new Date().toISOString() : null }
        : e
    ))
    try {
      const res = await fetch(
        `/api/events/${item.id}?weddingId=${encodeURIComponent(decodedWeddingId)}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }
      )
      if (!res.ok) throw new Error()
      toast.success(t('admin.timeline.notifications.statusChanged'))
      fetchData()
    } catch {
      fetchData()
      toast.error(t('admin.timeline.notifications.error'))
    }
  }

  const handleDelete = async (item: TimelineItem) => {
    if (!confirm('Delete this item?')) return
    if (item.source === 'payment') {
      try {
        const res = await fetch(
          `/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}`,
          { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment', id: item.id }) }
        )
        if (!res.ok) throw new Error()
        toast.success(t('admin.timeline.notifications.paymentDeleted'))
        fetchData()
      } catch {
        toast.error(t('admin.timeline.notifications.error'))
      }
    } else {
      try {
        const res = await fetch(
          `/api/events/${item.id}?weddingId=${encodeURIComponent(decodedWeddingId)}`,
          { method: 'DELETE' }
        )
        if (!res.ok) throw new Error()
        toast.success(t('admin.timeline.notifications.deleted'))
        fetchData()
      } catch {
        toast.error(t('admin.timeline.notifications.error'))
      }
    }
  }

  const handleSavePayment = async (data: { amount: number; payment_date: string; notes: string | null }) => {
    if (!editingPayment) return
    try {
      const res = await fetch(
        `/api/suppliers?weddingId=${encodeURIComponent(decodedWeddingId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'payment', id: editingPayment.id, ...data }),
        }
      )
      if (!res.ok) throw new Error()
      toast.success(t('admin.timeline.notifications.paymentUpdated'))
      setEditingPayment(null)
      fetchData()
    } catch {
      toast.error(t('admin.timeline.notifications.error'))
    }
  }

  const FILTERS: { key: TimelineFilter; label: string }[] = [
    { key: 'thisMonth', label: t('admin.timeline.filters.thisMonth') },
    { key: 'thisWeek', label: t('admin.timeline.filters.thisWeek') },
    { key: 'today', label: t('admin.timeline.filters.today') },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title={t('admin.timeline.title')}
      />

      <div className="page-container">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">{t('admin.dashboard.management')}</p>
          <h1 className="text-2xl font-serif text-[#420c14] mb-1">{t('admin.timeline.title')}</h1>
          <p className="text-sm text-[#420c14]/60">{t('admin.timeline.description')}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <Button onClick={() => { setEditingEvent(null); setShowModal(true) }} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.timeline.addEvent')}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <CalendarView
            items={mergedItems}
            today={today}
            filter={filter}
            onEdit={item => {
              const ev = events.find(e => e.id === item.id)
              if (ev) { setEditingEvent(ev); setShowModal(true) }
            }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onEditPayment={item => setEditingPayment(item)}
          />
        )}
      </div>

      <AddEditEventModal
        open={showModal}
        event={editingEvent}
        collaboratorEmails={[]}
        onClose={() => { setShowModal(false); setEditingEvent(null) }}
        onSave={handleSave}
      />

      <EditPaymentModal
        open={!!editingPayment}
        item={editingPayment}
        onClose={() => setEditingPayment(null)}
        onSave={handleSavePayment}
      />
    </main>
  )
}
