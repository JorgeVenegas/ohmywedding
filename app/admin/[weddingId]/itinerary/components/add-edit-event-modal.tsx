"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/contexts/i18n-context"
import { ChevronDown, ChevronRight, Check, X, Pencil, Plus } from "lucide-react"
import type { ItineraryEvent, SubEventInput } from "../types"
import { EVENT_ICONS } from "../types"
import { LUCIDE_ICON_MAP, ICON_COLORS } from "../icon-map"
import { CalendarDays } from "lucide-react"

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

interface SubEventRow {
  tempId: string
  id?: string
  title: string
  startHour: string
  startMinute: string
  icon: string
  isEditing: boolean
}

interface AddEditEventModalProps {
  open: boolean
  onClose: () => void
  onSave: (eventData: Partial<ItineraryEvent> & { subEvents?: SubEventInput[] }) => void
  event?: ItineraryEvent | null
  existingChildren?: ItineraryEvent[]
  parentEvent?: ItineraryEvent | null
  parentId?: string | null
  saving?: boolean
  weddingDate?: string | null
}

function isoToDateTimeParts(isoStr: string) {
  const iso = new Date(isoStr).toISOString()
  const date = iso.slice(0, 10)
  const hour = iso.slice(11, 13)
  const rawMin = parseInt(iso.slice(14, 16))
  const minute = String(Math.min(Math.round(rawMin / 5) * 5, 55)).padStart(2, '0')
  return { date, hour, minute }
}

function formatTime(h: string, m: string) {
  return `${h}:${m}`
}

export function AddEditEventModal({
  open, onClose, onSave, event, existingChildren, parentEvent, parentId, saving, weddingDate
}: AddEditEventModalProps) {
  const { t } = useTranslation()
  const weddingDateShort = weddingDate?.slice(0, 10) ?? null

  // Main event fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [details, setDetails] = useState("")
  const [icon, setIcon] = useState("other")
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const [isWeddingDay, setIsWeddingDay] = useState(true)
  const [customDate, setCustomDate] = useState("")
  const [startHour, setStartHour] = useState("12")
  const [startMinute, setStartMinute] = useState("00")
  const [hasEndTime, setHasEndTime] = useState(false)
  const [endHour, setEndHour] = useState("13")
  const [endMinute, setEndMinute] = useState("00")

  // Sub-events (only for main events)
  const [subEventRows, setSubEventRows] = useState<SubEventRow[]>([])
  const [subIconPickerFor, setSubIconPickerFor] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (event) {
      setTitle(event.title || "")
      setDescription(event.description || "")
      setLocation(event.location || "")
      setDetails(event.notes || "")
      setIcon(event.icon || "other")
      setIconPickerOpen(false)
      if (event.start_time) {
        const { date, hour, minute } = isoToDateTimeParts(event.start_time)
        setStartHour(hour)
        setStartMinute(minute)
        setIsWeddingDay(date === weddingDateShort)
        setCustomDate(date)
      }
      if (event.end_time) {
        const { hour, minute } = isoToDateTimeParts(event.end_time)
        setEndHour(hour)
        setEndMinute(minute)
        setHasEndTime(true)
      } else {
        setHasEndTime(false)
        setEndHour("13")
        setEndMinute("00")
      }
      // Pre-populate sub-events when editing a main event
      if (!event.parent_id && existingChildren?.length) {
        setSubEventRows(existingChildren.map(child => {
          const { hour, minute } = isoToDateTimeParts(child.start_time)
          return {
            tempId: child.id,
            id: child.id,
            title: child.title,
            startHour: hour,
            startMinute: minute,
            icon: child.icon || 'other',
            isEditing: false,
          }
        }))
      } else {
        setSubEventRows([])
      }
    } else {
      setTitle("")
      setDescription("")
      setLocation("")
      setDetails("")
      setIcon("other")
      setIconPickerOpen(false)
      setHasEndTime(false)
      setEndHour("13")
      setEndMinute("00")
      setSubEventRows([])

      if (parentEvent?.start_time) {
        const { date, hour, minute } = isoToDateTimeParts(parentEvent.start_time)
        setCustomDate(date)
        setIsWeddingDay(date === weddingDateShort)
        const totalMin = parseInt(hour) * 60 + parseInt(minute) + 30
        const h = String(Math.floor(totalMin / 60) % 24).padStart(2, '0')
        const m = String(Math.round((totalMin % 60) / 5) * 5 % 60).padStart(2, '0')
        setStartHour(h)
        setStartMinute(m)
      } else {
        setIsWeddingDay(true)
        setCustomDate(weddingDateShort || "")
        setStartHour("12")
        setStartMinute("00")
      }
    }
    setSubIconPickerFor(null)
  }, [event, open, weddingDateShort, parentEvent, existingChildren])

  const getActiveDate = () => isWeddingDay ? (weddingDateShort || customDate) : customDate
  const buildIso = (date: string, hour: string, minute: string) =>
    date ? new Date(`${date}T${hour}:${minute}:00`).toISOString() : ""

  const handleSave = () => {
    const date = getActiveDate()
    if (!title.trim() || !date) return
    const startIso = buildIso(date, startHour, startMinute)
    const endIso = hasEndTime ? buildIso(date, endHour, endMinute) : null

    const builtSubEvents: SubEventInput[] = !isChild
      ? subEventRows
          .filter(row => row.title.trim())
          .map(row => ({
            id: row.id,
            title: row.title.trim(),
            start_time: buildIso(date, row.startHour, row.startMinute),
            icon: row.icon,
          }))
      : []

    onSave({
      id: event?.id,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_time: startIso,
      end_time: endIso,
      notes: details.trim() || null,
      icon,
      parent_id: parentId || event?.parent_id || null,
      ...(builtSubEvents.length > 0 && { subEvents: builtSubEvents }),
    })
  }

  // Sub-event row helpers
  const addSubEventRow = () => {
    const tempId = `new-${Date.now()}`
    setSubEventRows(prev => [...prev, {
      tempId,
      title: '',
      startHour: startHour,
      startMinute: startMinute,
      icon: 'other',
      isEditing: true,
    }])
  }

  const updateSubRow = (tempId: string, updates: Partial<SubEventRow>) =>
    setSubEventRows(prev => prev.map(r => r.tempId === tempId ? { ...r, ...updates } : r))

  const commitSubRow = (tempId: string) => {
    setSubIconPickerFor(null)
    updateSubRow(tempId, { isEditing: false })
  }

  const removeSubRow = (tempId: string) =>
    setSubEventRows(prev => prev.filter(r => r.tempId !== tempId))

  const isChild = !!(parentId || event?.parent_id)
  const activeDate = getActiveDate()
  const canSave = !!title.trim() && !!activeDate

  const selectedIconDef = EVENT_ICONS.find(e => e.value === icon) ?? EVENT_ICONS[EVENT_ICONS.length - 1]
  const SelectedIconComp = LUCIDE_ICON_MAP[selectedIconDef.lucide] ?? CalendarDays
  const selectedColors = ICON_COLORS[icon] ?? ICON_COLORS.other

  const selectClass = "flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event
              ? t('admin.itinerary.editEvent')
              : isChild
                ? t('admin.itinerary.addSubEvent')
                : t('admin.itinerary.addEvent')
            }
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.itinerary.eventTitle')} *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.itinerary.eventTitlePlaceholder')}
              autoFocus
            />
          </div>

          {/* Icon picker — collapsible */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.itinerary.icon')}</label>
            <button
              type="button"
              onClick={() => setIconPickerOpen(v => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md border border-input hover:bg-muted/50 transition-colors"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selectedColors.bg}`}>
                <SelectedIconComp className={`w-3.5 h-3.5 ${selectedColors.text}`} />
              </span>
              <span className="flex-1 text-left text-sm">{selectedIconDef.label}</span>
              {iconPickerOpen
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {iconPickerOpen && (
              <div className="mt-2 grid grid-cols-5 gap-1.5 p-3 rounded-lg border border-input bg-muted/20">
                {EVENT_ICONS.map(ei => {
                  const IconComp = LUCIDE_ICON_MAP[ei.lucide] ?? CalendarDays
                  const colors = ICON_COLORS[ei.value] ?? ICON_COLORS.other
                  const isSelected = icon === ei.value
                  return (
                    <button key={ei.value} type="button"
                      onClick={() => { setIcon(ei.value); setIconPickerOpen(false) }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? `${colors.border} ${colors.bg}`
                          : 'border-transparent hover:border-input hover:bg-background'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center ${colors.bg}`}>
                        <IconComp className={`w-3.5 h-3.5 ${colors.text}`} />
                      </span>
                      <span className="truncate w-full text-center text-[9px] leading-tight text-muted-foreground">{ei.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('admin.itinerary.date')}</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setIsWeddingDay(true)}
                className={`flex-1 py-1.5 px-3 rounded-md border text-sm font-medium transition-colors ${isWeddingDay ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted/50'}`}>
                {t('admin.itinerary.weddingDay')}
              </button>
              <button type="button"
                onClick={() => { setIsWeddingDay(false); if (!customDate && weddingDateShort) setCustomDate(weddingDateShort) }}
                className={`flex-1 py-1.5 px-3 rounded-md border text-sm font-medium transition-colors ${!isWeddingDay ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted/50'}`}>
                {t('admin.itinerary.otherDay')}
              </button>
            </div>
            {!isWeddingDay && (
              <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            )}
          </div>

          {/* Start time */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('admin.itinerary.startTime')} *</label>
            <div className="flex items-center gap-2">
              <select value={startHour} onChange={(e) => setStartHour(e.target.value)} className={selectClass}>
                {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
              </select>
              <span className="text-muted-foreground font-medium">:</span>
              <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className={selectClass}>
                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* End time */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input id="hasEndTime" type="checkbox" checked={hasEndTime}
                onChange={(e) => setHasEndTime(e.target.checked)} className="rounded border-input" />
              <label htmlFor="hasEndTime" className="text-sm font-medium cursor-pointer">{t('admin.itinerary.endTime')}</label>
            </div>
            {hasEndTime && (
              <div className="flex items-center gap-2">
                <select value={endHour} onChange={(e) => setEndHour(e.target.value)} className={selectClass}>
                  {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
                <span className="text-muted-foreground font-medium">:</span>
                <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} className={selectClass}>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.itinerary.descriptionLabel')}</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.itinerary.descriptionPlaceholder')} />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.itinerary.location')}</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder={t('admin.itinerary.locationPlaceholder')} />
          </div>

          {/* Details (notes) */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.itinerary.details')}</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder={t('admin.itinerary.detailsPlaceholder')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y shadow-sm" />
          </div>

          {/* Sub-events section — only for main events */}
          {!isChild && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{t('admin.itinerary.subEvents')}</label>
                <button type="button" onClick={addSubEventRow}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {t('admin.itinerary.addSubEvent')}
                </button>
              </div>

              {subEventRows.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-input bg-muted/10 p-2">
                  {subEventRows.map(row => {
                    const rowIconDef = EVENT_ICONS.find(e => e.value === row.icon) ?? EVENT_ICONS[EVENT_ICONS.length - 1]
                    const RowIcon = LUCIDE_ICON_MAP[rowIconDef.lucide] ?? CalendarDays
                    const rowColors = ICON_COLORS[row.icon] ?? ICON_COLORS.other

                    if (row.isEditing) {
                      return (
                        <div key={row.tempId} className="space-y-1.5">
                          <div className="flex items-center gap-1.5 bg-background rounded-md border border-input p-2">
                            {/* Icon toggle */}
                            <button type="button"
                              onClick={() => setSubIconPickerFor(p => p === row.tempId ? null : row.tempId)}
                              className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${rowColors.bg} hover:opacity-80 transition-opacity`}>
                              <RowIcon className={`w-3.5 h-3.5 ${rowColors.text}`} />
                            </button>
                            {/* Title */}
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => updateSubRow(row.tempId, { title: e.target.value })}
                              placeholder={t('admin.itinerary.subEventTitlePlaceholder')}
                              className="flex-1 text-sm bg-transparent outline-none min-w-0"
                              onKeyDown={(e) => { if (e.key === 'Enter') commitSubRow(row.tempId) }}
                              autoFocus
                            />
                            {/* Time HH:MM */}
                            <select value={row.startHour}
                              onChange={(e) => updateSubRow(row.tempId, { startHour: e.target.value })}
                              className="w-14 text-xs rounded border border-input bg-background px-1 py-1 shadow-sm flex-shrink-0">
                              {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                            </select>
                            <span className="text-muted-foreground text-xs flex-shrink-0">:</span>
                            <select value={row.startMinute}
                              onChange={(e) => updateSubRow(row.tempId, { startMinute: e.target.value })}
                              className="w-12 text-xs rounded border border-input bg-background px-1 py-1 shadow-sm flex-shrink-0">
                              {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            {/* Actions */}
                            <button type="button" onClick={() => commitSubRow(row.tempId)}
                              className="text-primary hover:text-primary/80 flex-shrink-0 p-0.5">
                              <Check className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => removeSubRow(row.tempId)}
                              className="text-muted-foreground hover:text-destructive flex-shrink-0 p-0.5">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Inline icon picker for this sub-event row */}
                          {subIconPickerFor === row.tempId && (
                            <div className="grid grid-cols-5 gap-1 p-2 rounded-lg border border-input bg-background">
                              {EVENT_ICONS.map(ei => {
                                const EiIcon = LUCIDE_ICON_MAP[ei.lucide] ?? CalendarDays
                                const eiColors = ICON_COLORS[ei.value] ?? ICON_COLORS.other
                                return (
                                  <button key={ei.value} type="button"
                                    onClick={() => { updateSubRow(row.tempId, { icon: ei.value }); setSubIconPickerFor(null) }}
                                    className={`flex flex-col items-center gap-1 p-1.5 rounded-md border transition-colors ${
                                      row.icon === ei.value ? `${eiColors.border} ${eiColors.bg}` : 'border-transparent hover:border-input hover:bg-muted/30'
                                    }`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${eiColors.bg}`}>
                                      <EiIcon className={`w-3 h-3 ${eiColors.text}`} />
                                    </span>
                                    <span className="text-[9px] text-muted-foreground leading-tight text-center truncate w-full">{ei.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Read-only row
                    return (
                      <div key={row.tempId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors group">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${rowColors.bg}`}>
                          <RowIcon className={`w-3 h-3 ${rowColors.text}`} />
                        </span>
                        <span className="text-xs text-muted-foreground w-10 flex-shrink-0">
                          {formatTime(row.startHour, row.startMinute)}
                        </span>
                        <span className="flex-1 text-sm truncate">{row.title || <span className="text-muted-foreground italic text-xs">{t('admin.itinerary.subEventTitlePlaceholder')}</span>}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => updateSubRow(row.tempId, { isEditing: true })}
                            className="p-1 hover:text-primary transition-colors rounded">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => removeSubRow(row.tempId)}
                            className="p-1 hover:text-destructive transition-colors rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? t('admin.settings.saving') : event ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

