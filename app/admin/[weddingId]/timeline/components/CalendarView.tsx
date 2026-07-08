"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import { TimelineItem, EventStatus, TimelineCategory, STATUS_COLORS, TimelineFilter } from "../types"

interface CalendarViewProps {
  items: TimelineItem[]
  today: string
  filter: TimelineFilter
  onEdit: (item: TimelineItem) => void
  onDelete: (item: TimelineItem) => void
  onStatusChange: (item: TimelineItem, status: EventStatus) => void
  onEditPayment: (item: TimelineItem) => void
}

const PILL_COLORS: Record<TimelineCategory, string> = {
  payment:        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  save_the_date:  'bg-blue-100   text-blue-800   border-blue-200   dark:bg-blue-950/60   dark:text-blue-300   dark:border-blue-800',
  invitations:    'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  communications: 'bg-amber-100  text-amber-800  border-amber-200  dark:bg-amber-950/60  dark:text-amber-300  dark:border-amber-800',
  logistics:      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
  other:          'bg-slate-100  text-slate-700  border-slate-200  dark:bg-slate-800/60  dark:text-slate-300  dark:border-slate-700',
}

// Gold shadow for today's date number
const TODAY_RING = 'shadow-[0_0_0_3px_rgba(212,165,116,0.45)]'
// Gold inset highlight for today's cell
const TODAY_CELL = 'bg-amber-50/70 shadow-[inset_0_0_0_1.5px_rgba(212,165,116,0.45)] dark:bg-amber-950/20'

function fmtDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay()) // Sunday anchor
  d.setHours(0, 0, 0, 0)
  return d
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  const leadPad = firstDay.getDay()
  for (let i = leadPad - 1; i >= 0; i--) days.push(new Date(year, month, -i))
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  const trailPad = 42 - days.length
  for (let d = 1; d <= trailPad; d++) days.push(new Date(year, month + 1, d))
  return days
}

// Locale-aware weekday headers, Sun-anchored (Jan 5, 2025 is a Sunday)
function getWeekdayHeaders(locale: string): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2025, 0, 5 + i))
  )
}

// ── Event detail popover ─────────────────────────────────────────────────────

interface PillRect { top: number; bottom: number; left: number; right: number }
interface SelectedEvent { item: TimelineItem; pillRect: PillRect }

interface DetailPopoverProps {
  selected: SelectedEvent
  today: string
  onClose: () => void
  onEdit: (item: TimelineItem) => void
  onDelete: (item: TimelineItem) => void
  onEditPayment: (item: TimelineItem) => void
}

function EventDetailPopover({ selected, today, onClose, onEdit, onDelete, onEditPayment }: DetailPopoverProps) {
  const { t, locale } = useTranslation()
  const { item, pillRect } = selected
  const isPayment = item.source === 'payment'

  const POPUP_W = 288
  const POPUP_H = 260
  const vp = { w: window.innerWidth, h: window.innerHeight }
  const left = Math.min(pillRect.left, vp.w - POPUP_W - 12)
  const showAbove = pillRect.bottom + POPUP_H + 8 > vp.h - 16
  const top = showAbove ? pillRect.top - POPUP_H - 4 : pillRect.bottom + 4

  const dateFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedDate = dateFmt.format(new Date(item.date + 'T00:00:00'))

  const currencyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

  return createPortal(
    <>
      {/* Backdrop — dismiss on outside click */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 bg-popover border border-border rounded-xl shadow-2xl p-4 w-72"
        style={{ left, top }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${PILL_COLORS[item.category]}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {t(`admin.timeline.categories.${item.category}` as Parameters<typeof t>[0])}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground leading-snug">{item.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
          <div className="text-foreground font-medium">{formattedDate}</div>

          {!isPayment && item.status && (
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${STATUS_COLORS[item.status]}`}>
                {t(`admin.timeline.statuses.${item.status}` as Parameters<typeof t>[0])}
              </span>
            </div>
          )}

          {isPayment && item.payment_amount != null && (
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              {currencyFmt.format(item.payment_amount)}
            </div>
          )}

          {item.description && (
            <p className="leading-relaxed text-muted-foreground line-clamp-3">{item.description}</p>
          )}

          {item.assignee_email && (
            <div>
              <span className="font-medium text-foreground">Assigned: </span>
              {item.assignee_email}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={() => isPayment ? onEditPayment(item) : onEdit(item)}
          >
            <Pencil className="h-3 w-3 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Event pill button ────────────────────────────────────────────────────────

function EventPill({ item, onPillClick }: { item: TimelineItem; onPillClick: (e: React.MouseEvent, item: TimelineItem) => void }) {
  return (
    <button
      onClick={e => onPillClick(e, item)}
      title={item.title}
      className={[
        'w-full text-left text-[10px] font-medium leading-tight px-1.5 py-0.5 rounded border truncate block',
        'transition-opacity hover:opacity-75 cursor-pointer',
        PILL_COLORS[item.category],
        item.status === 'completed' ? 'opacity-50 line-through' : '',
      ].join(' ')}
    >
      {item.source === 'payment' && '$ '}{item.title}
    </button>
  )
}

// ── Legend ───────────────────────────────────────────────────────────────────

function Legend({ categories, t }: { categories: Set<TimelineCategory>; t: (k: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string }) {
  if (categories.size === 0) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border/60">
      {Array.from(categories).map(cat => (
        <div key={cat} className="flex items-center gap-1.5">
          <span className={`inline-block w-3 h-3 rounded-sm border ${PILL_COLORS[cat]}`} />
          <span className="text-[11px] text-muted-foreground capitalize">
            {t(`admin.timeline.categories.${cat}` as Parameters<typeof t>[0])}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function CalendarView({
  items, today, filter, onEdit, onDelete, onStatusChange, onEditPayment,
}: CalendarViewProps) {
  const { t, locale } = useTranslation()
  const todayDate = new Date(today + 'T00:00:00')

  const [navDate, setNavDate] = useState<Date>(todayDate)
  const [selected, setSelected] = useState<SelectedEvent | null>(null)

  // Jump to the relevant period when filter tab changes
  useEffect(() => {
    setNavDate(new Date(today + 'T00:00:00'))
    setSelected(null)
  }, [filter, today])

  const itemsByDate = items.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})

  const handlePillClick = useCallback((e: React.MouseEvent, item: TimelineItem) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setSelected({
      item,
      pillRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
    })
  }, [])

  const closeDetail = useCallback(() => setSelected(null), [])

  const handleEdit = useCallback((item: TimelineItem) => {
    closeDetail()
    onEdit(item)
  }, [closeDetail, onEdit])

  const handleDelete = useCallback((item: TimelineItem) => {
    closeDetail()
    onDelete(item)
  }, [closeDetail, onDelete])

  const handleEditPayment = useCallback((item: TimelineItem) => {
    closeDetail()
    onEditPayment(item)
  }, [closeDetail, onEditPayment])

  // ── Day view ──────────────────────────────────────────────────────────────
  if (filter === 'today') {
    const dateStr = fmtDate(navDate)
    const dayItems = itemsByDate[dateStr] ?? []
    const dayCategories = new Set(dayItems.map(i => i.category))

    const dayLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(navDate)

    return (
      <>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate capitalize">{dayLabel}</h2>
              {dateStr !== today && (
                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 flex-shrink-0"
                  onClick={() => setNavDate(new Date(today + 'T00:00:00'))}>
                  Today
                </Button>
              )}
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => { const d = new Date(navDate); d.setDate(d.getDate() - 1); setNavDate(d) }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => { const d = new Date(navDate); d.setDate(d.getDate() + 1); setNavDate(d) }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {dayItems.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground text-sm">No events on this day</div>
          ) : (
            <div className="space-y-2">
              {dayItems.map(item => (
                <button
                  key={item.id}
                  onClick={e => handlePillClick(e, item)}
                  className={[
                    'w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium',
                    'transition-opacity hover:opacity-80',
                    PILL_COLORS[item.category],
                    item.status === 'completed' ? 'opacity-50 line-through' : '',
                  ].join(' ')}
                >
                  {item.source === 'payment' && <span className="mr-1 text-xs opacity-70">$</span>}
                  {item.title}
                </button>
              ))}
            </div>
          )}

          <Legend categories={dayCategories} t={t} />
        </Card>

        {selected && (
          <EventDetailPopover
            selected={selected}
            today={today}
            onClose={closeDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEditPayment={handleEditPayment}
          />
        )}
      </>
    )
  }

  // ── Week view ─────────────────────────────────────────────────────────────
  if (filter === 'thisWeek') {
    const weekStart = getWeekStart(navDate)
    const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
    const weekDateStrs = weekDays.map(fmtDate)

    const weekCategories = new Set(
      weekDateStrs.flatMap(ds => (itemsByDate[ds] ?? []).map(i => i.category))
    )

    const startFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
    const endFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    const weekLabel = `${startFmt.format(weekStart)} – ${endFmt.format(weekDays[6])}`

    const weekdayHeaders = getWeekdayHeaders(locale)

    return (
      <>
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">{weekLabel}</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5"
                onClick={() => setNavDate(new Date(today + 'T00:00:00'))}>
                Today
              </Button>
            </div>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => { const d = new Date(navDate); d.setDate(d.getDate() - 7); setNavDate(d) }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => { const d = new Date(navDate); d.setDate(d.getDate() + 7); setNavDate(d) }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-border/60">
            {/* Day headers */}
            {weekDays.map((day, idx) => {
              const dateStr = weekDateStrs[idx]
              const isToday = dateStr === today
              return (
                <div
                  key={idx}
                  className={[
                    'border-r border-b border-border/60 py-2 flex flex-col items-center gap-0.5',
                    isToday ? TODAY_CELL : 'bg-background',
                  ].join(' ')}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {weekdayHeaders[idx]}
                  </span>
                  <span className={[
                    'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full',
                    isToday ? `bg-primary text-primary-foreground ${TODAY_RING}` : 'text-foreground',
                  ].join(' ')}>
                    {day.getDate()}
                  </span>
                </div>
              )
            })}

            {/* Day event columns */}
            {weekDays.map((day, idx) => {
              const dateStr = weekDateStrs[idx]
              const dayItems = itemsByDate[dateStr] ?? []
              const isToday = dateStr === today
              return (
                <div
                  key={idx}
                  className={[
                    'border-r border-b border-border/60 min-h-[8rem] p-1.5 space-y-0.5',
                    isToday ? TODAY_CELL : 'bg-background',
                  ].join(' ')}
                >
                  {dayItems.map(item => (
                    <EventPill key={item.id} item={item} onPillClick={handlePillClick} />
                  ))}
                </div>
              )
            })}
          </div>

          <Legend categories={weekCategories} t={t} />
        </Card>

        {selected && (
          <EventDetailPopover
            selected={selected}
            today={today}
            onClose={closeDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEditPayment={handleEditPayment}
          />
        )}
      </>
    )
  }

  // ── Month view (all / thisMonth) ──────────────────────────────────────────
  const year = navDate.getFullYear()
  const month = navDate.getMonth()
  const days = buildMonthGrid(year, month)
  const weekdayHeaders = getWeekdayHeaders(locale)

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(navDate)

  const monthCategories = new Set(
    days
      .filter(d => d.getMonth() === month)
      .map(fmtDate)
      .flatMap(ds => (itemsByDate[ds] ?? []).map(i => i.category))
  )

  const prevMonth = () => {
    const d = new Date(navDate)
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
    setNavDate(d)
  }
  const nextMonth = () => {
    const d = new Date(navDate)
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    setNavDate(d)
  }

  return (
    <>
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground capitalize">{monthLabel}</h2>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5"
              onClick={() => setNavDate(new Date(today + 'T00:00:00'))}>
              Today
            </Button>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-border/60">
          {/* Weekday headers */}
          {weekdayHeaders.map(d => (
            <div key={d} className="border-r border-b border-border/60 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}

          {/* Day cells */}
          {days.map((day, idx) => {
            const dateStr = fmtDate(day)
            const dayItems = itemsByDate[dateStr] ?? []
            const isCurrentMonth = day.getMonth() === month
            const isToday = dateStr === today
            const MAX_VISIBLE = 3
            const overflow = Math.max(0, dayItems.length - MAX_VISIBLE)

            return (
              <div
                key={idx}
                className={[
                  'border-r border-b border-border/60 min-h-[5.5rem] p-1 transition-colors',
                  isToday
                    ? TODAY_CELL
                    : isCurrentMonth ? 'bg-background' : 'bg-muted/20',
                ].join(' ')}
              >
                <div className="flex justify-end mb-1">
                  <span className={[
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    isToday
                      ? `bg-primary text-primary-foreground font-bold ${TODAY_RING}`
                      : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                  ].join(' ')}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayItems.slice(0, MAX_VISIBLE).map(item => (
                    <EventPill key={item.id} item={item} onPillClick={handlePillClick} />
                  ))}
                  {overflow > 0 && (
                    <span className="text-[10px] text-muted-foreground pl-1 block">+{overflow} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Legend categories={monthCategories} t={t} />
      </Card>

      {selected && (
        <EventDetailPopover
          selected={selected}
          today={today}
          onClose={closeDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onEditPayment={handleEditPayment}
        />
      )}
    </>
  )
}
