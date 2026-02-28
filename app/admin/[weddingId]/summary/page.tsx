"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { toast } from "sonner"
import {
  Download, FileText, UtensilsCrossed, CalendarDays,
  LayoutGrid, MapPin, Clock, Users, ChevronDown, ChevronRight,
} from "lucide-react"

interface SummaryPageProps {
  params: Promise<{ weddingId: string }>
}

interface SummaryData {
  wedding: {
    partner1_first_name: string
    partner1_last_name: string
    partner2_first_name: string
    partner2_last_name: string
    wedding_date: string
    wedding_time: string
    reception_time: string
    ceremony_venue_name: string
    ceremony_venue_address: string
    reception_venue_name: string
    reception_venue_address: string
  }
  stats: {
    totalGuests: number
    confirmed: number
    declined: number
    pending: number
    totalTables: number
    assignedGuests: number
    unassignedGuests: number
    totalDishes: number
    totalCapacity: number
  }
  seating: Array<{
    tableNumber: number
    tableName: string
    shape: string
    capacity: number
    occupancy: number
    position_x: number
    position_y: number
    width: number
    height: number
    rotation: number
    guests: Array<{
      name: string
      groupName: string | null
      status: string
      dietaryRestrictions: string | null
      dish: { name: string; category: string } | null
      seatNumber: number | null
    }>
  }>
  venueElements: Array<{
    element_type: string
    element_shape: string
    label: string | null
    position_x: number
    position_y: number
    width: number
    height: number
    rotation: number
    color: string | null
  }>
  dishes: Array<{
    id: string
    name: string
    category: string
    description: string | null
    is_vegetarian: boolean
    is_vegan: boolean
    is_gluten_free: boolean
    allergens: string | null
    count: number
  }>
  itinerary: Array<{
    id: string
    title: string
    description: string | null
    location: string | null
    start_time: string
    end_time: string | null
    notes: string | null
    icon: string | null
    children: Array<{
      id: string
      title: string
      description: string | null
      location: string | null
      start_time: string
      end_time: string | null
      notes: string | null
      icon: string | null
    }>
  }>
}

const EVENT_EMOJI_MAP: Record<string, string> = {
  ceremony: '💒', reception: '🎉', cocktail: '🍸', dinner: '🍽️',
  dancing: '💃', firstDance: '💕', entrance: '🚪', toast: '🥂',
  cake: '🎂', bouquet: '💐', photo: '📸', music: '🎵',
  transport: '🚐', preparation: '💄', other: '📋',
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function WeddingSummaryPage({ params }: SummaryPageProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()
  const printRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['seating', 'dishes', 'itinerary', 'venue']))
  const [exportProgress, setExportProgress] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/wedding-summary?weddingId=${encodeURIComponent(decodedWeddingId)}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Summary fetch error:', err)
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setLoading(false)
    }
  }, [decodedWeddingId, t])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const handleExportPDF = async () => {
    if (exportProgress !== null) return
    if (!printRef.current) {
      toast.error('Print container not ready, please try again')
      return
    }
    if (!data?.wedding) {
      toast.error(t('admin.seating.notifications.error'))
      console.error('handleExportPDF: data.wedding is null/undefined', { data })
      return
    }
    setExportProgress(5)

    try {
      // Dynamic import for client-side only
      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import('html-to-image'),
        import('jspdf'),
      ])

      setExportProgress(15)

      // Expand all sections so nothing is clipped
      setExpandedSections(new Set(['seating', 'dishes', 'itinerary', 'venue']))
      await new Promise(r => setTimeout(r, 250))
      setExportProgress(30)

      const element = printRef.current!
      // html-to-image handles modern CSS color functions (oklch/lab) that html2canvas cannot parse
      const imgData = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      })
      setExportProgress(65)

      // Derive canvas dimensions from the data URL by drawing to an off-screen image
      const img = new Image()
      await new Promise<void>((res) => { img.onload = () => res(); img.src = imgData })
      const canvasWidth  = img.naturalWidth
      const canvasHeight = img.naturalHeight
      setExportProgress(70)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Header branding
      pdf.setFillColor(24, 24, 27) // zinc-900
      pdf.rect(0, 0, pdfWidth, 28, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text('OhMyWedding', 15, 14)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(t('admin.summary.title'), 15, 22)

      // Wedding info
      const couple = `${data.wedding.partner1_first_name ?? ''} & ${data.wedding.partner2_first_name ?? ''}`
      pdf.setTextColor(24, 24, 27)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text(couple, 15, 38)
      if (data.wedding.wedding_date) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(formatDate(data.wedding.wedding_date), 15, 45)
      }

      // Content image
      const imgWidth = pdfWidth - 30
      let yPos = 52

      // If content exceeds one page, split across pages
      const pageContentHeight = pdfHeight - 35 // Leave margin at bottom
      let srcY = 0
      const srcWidth = canvasWidth
      const srcHeight = canvasHeight

      while (srcY < srcHeight) {
        const remainingImgHeight = ((srcHeight - srcY) * imgWidth) / srcWidth
        const drawHeight = Math.min(remainingImgHeight, pageContentHeight - yPos)
        const drawSrcHeight = (drawHeight * srcWidth) / imgWidth

        // Create a canvas slice from the img element
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = srcWidth
        sliceCanvas.height = drawSrcHeight
        const ctx = sliceCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, srcY, srcWidth, drawSrcHeight, 0, 0, srcWidth, drawSrcHeight)
          const sliceImg = sliceCanvas.toDataURL('image/png')
          pdf.addImage(sliceImg, 'PNG', 15, yPos, imgWidth, drawHeight)
        }

        srcY += drawSrcHeight
        if (srcY < srcHeight) {
          pdf.addPage()

          // Footer on each page
          pdf.setFillColor(24, 24, 27)
          pdf.rect(0, pdfHeight - 8, pdfWidth, 8, 'F')
          pdf.setTextColor(160, 160, 170)
          pdf.setFontSize(7)
          pdf.text('ohmy.wedding', pdfWidth - 30, pdfHeight - 3)

          yPos = 15
        }
      }

      // Footer on last page
      pdf.setFillColor(24, 24, 27)
      pdf.rect(0, pdfHeight - 8, pdfWidth, 8, 'F')
      pdf.setTextColor(160, 160, 170)
      pdf.setFontSize(7)
      pdf.text('ohmy.wedding', pdfWidth - 30, pdfHeight - 3)

      setExportProgress(95)
      pdf.save(`wedding-summary-${decodedWeddingId}.pdf`)
      setExportProgress(100)
      await new Promise(r => setTimeout(r, 600))
      toast.success(t('admin.summary.exported'))
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setExportProgress(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, 'dashboard')} title={t('admin.summary.title')} />
        <div className="page-container">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </main>
    )
  }

  if (!data) return null

  const { wedding, stats, seating, dishes, itinerary, venueElements } = data

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title={t('admin.summary.title')}
        rightContent={
          <div className="relative">
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={exportProgress !== null}
              className="min-w-[120px] relative overflow-hidden"
            >
              {exportProgress !== null ? (
                <>
                  {/* animated fill behind the text */}
                  <span
                    className="absolute inset-0 bg-primary/20 transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                  <span className="relative flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline text-xs tabular-nums">{exportProgress}%</span>
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{t('admin.summary.exportPDF')}</span>
                </>
              )}
            </Button>
          </div>
        }
      />
      <div className="page-container">
        {/* Print-friendly content */}
        <div ref={printRef} className="bg-white text-zinc-900">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border">
              <div className="text-2xl font-bold">{stats.totalGuests}</div>
              <div className="text-sm text-muted-foreground">{t('admin.summary.stats.totalGuests')}</div>
            </Card>
            <Card className="p-4 border">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-muted-foreground">{t('admin.summary.stats.confirmed')}</div>
            </Card>
            <Card className="p-4 border">
              <div className="text-2xl font-bold">{stats.totalTables}</div>
              <div className="text-sm text-muted-foreground">{t('admin.summary.stats.tables')}</div>
            </Card>
            <Card className="p-4 border">
              <div className="text-2xl font-bold">{stats.totalDishes}</div>
              <div className="text-sm text-muted-foreground">{t('admin.summary.stats.dishes')}</div>
            </Card>
          </div>

          {/* Venue Map Section */}
          <SectionHeader
            title={t('admin.summary.sections.venueMap')}
            icon={<LayoutGrid className="w-5 h-5" />}
            expanded={expandedSections.has('venue')}
            onToggle={() => toggleSection('venue')}
          />
          {expandedSections.has('venue') && (
            <Card className="mb-6 border overflow-hidden">
              {venueElements.length === 0 && seating.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('admin.summary.noVenueData')}</p>
              ) : (
                <FloorPlanMap tables={seating} venueElements={venueElements} />
              )}
            </Card>
          )}

          {/* Dishes Section */}
          <SectionHeader
            title={t('admin.summary.sections.dishes')}
            icon={<UtensilsCrossed className="w-5 h-5" />}
            expanded={expandedSections.has('dishes')}
            onToggle={() => toggleSection('dishes')}
          />
          {expandedSections.has('dishes') && (
            <Card className="mb-6 border overflow-hidden">
              {dishes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t('admin.summary.noDishData')}</p>
              ) : (
                <div className="divide-y">
                  {dishes.map(dish => (
                    <div key={dish.id} className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{dish.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-muted">{dish.category}</span>
                          {dish.is_vegetarian && <span className="text-xs">🌿</span>}
                          {dish.is_vegan && <span className="text-xs">🌱</span>}
                          {dish.is_gluten_free && <span className="text-xs font-medium text-yellow-600">GF</span>}
                        </div>
                        {dish.description && <p className="text-sm text-muted-foreground mt-0.5">{dish.description}</p>}
                        {dish.allergens && <p className="text-xs text-orange-600 mt-0.5">{t('admin.dishes.allergens')}: {dish.allergens}</p>}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold">{dish.count}</div>
                        <div className="text-xs text-muted-foreground">{t('admin.summary.servings')}</div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-muted/30">
                    <div className="flex justify-between font-medium">
                      <span>{t('admin.summary.totalServings')}</span>
                      <span>{dishes.reduce((sum, d) => sum + d.count, 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Seating Assignments Section */}
          <SectionHeader
            title={t('admin.summary.sections.seatingAssignments')}
            icon={<Users className="w-5 h-5" />}
            expanded={expandedSections.has('seating')}
            onToggle={() => toggleSection('seating')}
          />
          {expandedSections.has('seating') && (
            <Card className="mb-6 border overflow-hidden">
              {seating.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t('admin.summary.noSeatingData')}</p>
              ) : (
                <div className="divide-y">
                  {seating.map(table => (
                    <div key={table.tableNumber}>
                      <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
                        <div className="font-semibold">
                          {t('admin.summary.tableNumber', { number: String(table.tableNumber) })}: {table.tableName}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {table.guests.length}/{table.capacity}
                        </span>
                      </div>
                      {table.guests.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/10">
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('admin.summary.columns.guest')}</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('admin.summary.columns.group')}</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('admin.summary.columns.dish')}</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('admin.summary.columns.dietary')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {table.guests.map((guest, gi) => (
                                <tr key={gi} className="hover:bg-muted/20">
                                  <td className="px-4 py-2">{guest.name}</td>
                                  <td className="px-4 py-2 text-muted-foreground">{guest.groupName || '—'}</td>
                                  <td className="px-4 py-2">{guest.dish?.name || '—'}</td>
                                  <td className="px-4 py-2 text-muted-foreground text-xs">{guest.dietaryRestrictions || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-sm text-muted-foreground italic">{t('admin.seating.table.noGuests')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Itinerary Section */}
          <SectionHeader
            title={t('admin.summary.sections.itinerary')}
            icon={<CalendarDays className="w-5 h-5" />}
            expanded={expandedSections.has('itinerary')}
            onToggle={() => toggleSection('itinerary')}
          />
          {expandedSections.has('itinerary') && (
            <Card className="mb-6 border overflow-hidden">
              {itinerary.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t('admin.summary.noItineraryData')}</p>
              ) : (
                <div className="divide-y">
                  {itinerary.map(event => (
                    <div key={event.id}>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{EVENT_EMOJI_MAP[event.icon || 'other'] || '📋'}</span>
                          <div className="flex-1">
                            <div className="font-semibold">{event.title}</div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
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
                            {event.notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {event.notes}</p>}
                          </div>
                        </div>
                      </div>
                      {event.children && event.children.length > 0 && (
                        <div className="bg-muted/20 border-t">
                          {event.children.map(child => (
                            <div key={child.id} className="flex items-center gap-3 px-4 py-2.5 pl-12 border-b last:border-b-0">
                              <span className="text-base">{EVENT_EMOJI_MAP[child.icon || 'other'] || '📋'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{child.title}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatTime(child.start_time)}{child.end_time && <> — {formatTime(child.end_time)}</>}</span>
                                  {child.location && <span>· {child.location}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

// ─── Floor Plan Map ─────────────────────────────────────────────────────────

interface FloorTableItem {
  tableNumber: number
  tableName: string
  shape: string
  capacity: number
  occupancy: number
  position_x: number
  position_y: number
  width: number
  height: number
  rotation: number
}

interface FloorElementItem {
  element_type: string
  element_shape: string
  label: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  rotation: number
  color: string | null
}

// Exact colors from seating-canvas.tsx
const ELEMENT_FILL: Record<string, string> = {
  dance_floor: '#ddd6fe',
  stage:       '#fbcfe8',
  entrance:    '#bfdbfe',
  bar:         '#fed7aa',
  dj_booth:    '#d9f99d',
  periquera:   '#fde68a',
  lounge:      '#f5d0fe',
  area:        '#e0f2fe',
  custom:      '#e5e7eb',
}
const ELEMENT_STROKE: Record<string, string> = {
  dance_floor: '#8b5cf6',
  stage:       '#ec4899',
  entrance:    '#3b82f6',
  bar:         '#f97316',
  dj_booth:    '#84cc16',
  periquera:   '#d97706',
  lounge:      '#a855f7',
  area:        '#0369a1',
  custom:      '#6b7280',
}

function getStatusColor(occupancy: number, capacity: number): string {
  if (occupancy > capacity) return '#ef4444'
  if (occupancy >= capacity) return '#22c55e'
  if (occupancy > 0) return '#f59e0b'
  return '#d1d5db'
}

function FloorPlanMap({
  tables,
  venueElements,
}: {
  tables: FloorTableItem[]
  venueElements: FloorElementItem[]
}) {
  const CHAIR_EXTRA = 20 // space around tables for chairs
  const BORDER     = 50 // canvas border padding

  // Compute bounding box in original canvas coords, accounting for chairs
  const allBoxes = [
    ...tables.map(t => ({
      x: t.position_x - CHAIR_EXTRA,
      y: t.position_y - CHAIR_EXTRA,
      r: t.width  + CHAIR_EXTRA * 2,
      b: (t.shape === 'round' ? t.width : t.height) + CHAIR_EXTRA * 2,
    })),
    ...venueElements.map(e => ({
      x: e.position_x, y: e.position_y, r: e.width, b: e.height,
    })),
  ]

  if (allBoxes.length === 0) return null

  const originX = Math.min(...allBoxes.map(b => b.x)) - BORDER
  const originY = Math.min(...allBoxes.map(b => b.y)) - BORDER
  const extentX = Math.max(...allBoxes.map(b => b.x + b.r)) + BORDER
  const extentY = Math.max(...allBoxes.map(b => b.y + b.b)) + BORDER

  const dataW = extentX - originX
  const dataH = extentY - originY

  // SVG viewport — shrink to fit, max 800 wide
  const SVG_W   = 800
  const SVG_H   = Math.max(200, Math.round(SVG_W * (dataH / dataW)))
  const scale   = SVG_W / dataW
  const P       = (v: number) => v   // passthrough — we use a viewBox transform instead
  const VB      = `${originX} ${originY} ${dataW} ${dataH}`

  // Canvas-space helpers (no coordinate transform needed — SVG viewBox handles it)
  const sc = (v: number) => v // keep in canvas coords; SVG viewBox + scale handles it
  const statusDot = (cx: number, cy: number, occ: number, cap: number) => (
    <circle cx={cx} cy={cy} r={5} fill={getStatusColor(occ, cap)} stroke="white" strokeWidth={1.5} />
  )

  // Chair shape: small rounded rect pointing outward, like in canvas
  const Chair = ({ x, y, angle, occupied }: { x: number; y: number; angle: number; occupied: boolean }) => {
    const seatFill = occupied ? '#c4b5fd' : '#f5efe6'
    const stroke   = occupied ? '#7c3aed' : '#c4a87a'
    const backFill = occupied ? '#a78bfa' : '#e8d9c5'
    return (
      <g transform={`translate(${x},${y}) rotate(${angle * 180 / Math.PI + 90})`}>
        {/* seat cushion */}
        <rect x={-5.5} y={2} width={11} height={9} rx={2} fill={seatFill} stroke={stroke} strokeWidth={1} />
        {/* backrest */}
        <rect x={-6} y={-6} width={12} height={7} rx={2} fill={backFill} stroke={stroke} strokeWidth={1} />
      </g>
    )
  }

  const RectChair = ({ x, y, rotation, occupied }: { x: number; y: number; rotation: number; occupied: boolean }) => {
    const seatFill = occupied ? '#c4b5fd' : '#f5efe6'
    const stroke   = occupied ? '#7c3aed' : '#c4a87a'
    const backFill = occupied ? '#a78bfa' : '#e8d9c5'
    return (
      <g transform={`translate(${x},${y}) rotate(${rotation})`}>
        <rect x={-5.5} y={-9} width={11} height={9} rx={2} fill={seatFill} stroke={stroke} strokeWidth={1} />
        <rect x={-6}   y={1}  width={12} height={5} rx={2} fill={backFill} stroke={stroke} strokeWidth={1} />
      </g>
    )
  }

  return (
    <div className="w-full overflow-x-auto bg-[#f9f7f3]">
      <svg
        viewBox={VB}
        width="100%"
        style={{ display: 'block', maxHeight: `${SVG_H}px` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid */}
        <defs>
          <pattern id="fp-grid" width={20} height={20} patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e0d8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x={originX} y={originY} width={dataW} height={dataH} fill="url(#fp-grid)" />

        {/* ── Venue elements ── */}
        {venueElements.map((el, i) => {
          const hw = el.width / 2, hh = el.height / 2
          const cx = el.position_x + hw, cy = el.position_y + hh
          const fill   = el.color ?? ELEMENT_FILL[el.element_type]   ?? '#e5e7eb'
          const stroke = el.color ?? ELEMENT_STROKE[el.element_type] ?? '#9ca3af'
          const label  = el.label || el.element_type.replace(/_/g, ' ')
          const isCircle   = el.element_shape === 'circle'
          const isArea     = el.element_type === 'area'
          const isLounge   = el.element_type === 'lounge'
          const isPeriquera = el.element_type === 'periquera'

          // Font size proportional to element size
          const labelSize = Math.min(18, Math.max(9, el.height * 0.1))

          return (
            <g key={`el-${i}`} transform={el.rotation ? `rotate(${el.rotation},${cx},${cy})` : undefined}>
              {/* Main body */}
              {isCircle ? (
                <ellipse cx={cx} cy={cy} rx={hw} ry={hh}
                  fill={fill} stroke={stroke} strokeWidth={2}
                  strokeDasharray={isArea ? undefined : '6 4'}
                  opacity={isArea ? 0.35 : 0.85} />
              ) : (
                <rect x={el.position_x} y={el.position_y} width={el.width} height={el.height}
                  rx={isLounge ? 10 : isArea ? 6 : 8}
                  fill={fill} stroke={stroke} strokeWidth={2}
                  strokeDasharray={isArea ? '14 7' : isLounge ? undefined : '6 4'}
                  opacity={isArea ? 0.35 : isLounge ? 0.45 : 0.85} />
              )}

              {/* Lounge inner sofa detail (simplified U shape) */}
              {isLounge && !isCircle && (() => {
                const pad = Math.max(8, Math.min(14, Math.min(el.width, el.height) * 0.08))
                const backH = Math.max(16, Math.min(26, el.height * 0.14))
                const armW  = Math.max(16, Math.min(26, el.width  * 0.14))
                const sideH = el.height - pad * 2 - backH
                const coffeeW = Math.max(30, (el.width - pad * 2 - armW * 2) * 0.55)
                const coffeeH = Math.max(20, sideH * 0.45)
                return (
                  <g opacity={0.9}>
                    {/* backrest */}
                    <rect x={el.position_x + pad} y={el.position_y + pad}
                      width={el.width - pad * 2} height={backH}
                      rx={5} fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} />
                    {/* left arm */}
                    <rect x={el.position_x + pad} y={el.position_y + pad + backH}
                      width={armW} height={sideH}
                      rx={4} fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} />
                    {/* right arm */}
                    <rect x={el.position_x + el.width - pad - armW} y={el.position_y + pad + backH}
                      width={armW} height={sideH}
                      rx={4} fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} />
                    {/* coffee table */}
                    <rect
                      x={cx - coffeeW / 2} y={el.position_y + pad + backH + (sideH - coffeeH) / 2}
                      width={coffeeW} height={coffeeH}
                      rx={5} fill="#f3e8ff" stroke="#c084fc" strokeWidth={1.5} />
                  </g>
                )
              })()}

              {/* Periquera stool detail */}
              {isPeriquera && (() => {
                const stoolCount = el.width >= 160 ? 6 : 4
                const tableR = Math.min(hw, hh) * 0.32
                const stoolDist = Math.min(hw, hh) * 0.68
                return (
                  <>
                    <circle cx={cx} cy={cy} r={tableR}
                      fill="#fef9c3" stroke="#d97706" strokeWidth={2} />
                    {Array.from({ length: stoolCount }).map((_, j) => {
                      const a = (2 * Math.PI * j) / stoolCount - Math.PI / 2
                      return (
                        <g key={j} transform={`translate(${cx + stoolDist * Math.cos(a)},${cy + stoolDist * Math.sin(a)})`}>
                          <circle r={7} fill="#fde68a" stroke="#d97706" strokeWidth={1.5} />
                          <circle r={2.5} fill="#92400e" />
                        </g>
                      )
                    })}
                  </>
                )
              })()}

              {/* Front indicator line */}
              {!isArea && !isLounge && !isPeriquera && (() => {
                const indW = Math.min(36, el.width * 0.32)
                const indY = el.position_y + 3
                return (
                  <>
                    <line x1={cx - indW / 2} y1={indY} x2={cx + indW / 2} y2={indY}
                      stroke="white" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
                    <line x1={cx - indW / 2} y1={indY} x2={cx + indW / 2} y2={indY}
                      stroke={stroke} strokeWidth={4.5} strokeLinecap="round" />
                  </>
                )
              })()}

              {/* Label */}
              {el.width > 30 && (
                <text x={cx} y={isArea ? el.position_y + labelSize + 10 : cy}
                  textAnchor={isArea ? 'start' : 'middle'}
                  dominantBaseline="middle"
                  fontSize={labelSize}
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  fill={el.element_type === 'area' ? stroke : el.element_type === 'periquera' ? '#92400e' : '#374151'}
                  opacity={0.9}
                  transform={el.rotation ? `rotate(${-el.rotation},${cx},${cy})` : undefined}
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}

        {/* ── Tables ── */}
        {tables.map((table) => {
          const hw = table.width / 2
          const hh = table.shape === 'round' ? hw : table.height / 2
          const cx = table.position_x + hw
          const cy = table.position_y + hh
          const statusColor = getStatusColor(table.occupancy, table.capacity)
          const tableFill   = table.shape === 'sweetheart' ? '#fef9ee' : '#faf7f3'
          const tableStroke = table.shape === 'sweetheart' ? '#d97706' : '#d4a574'
          const nameColor   = '#78350f'
          const occColor    = '#a16207'
          const nameFontSize = Math.max(8, Math.min(12, hw * 0.25))

          const tableContent = (
            <g transform={table.rotation ? `rotate(${table.rotation},${cx},${cy})` : undefined}>
              {table.shape === 'round' ? (
                <>
                  {/* Chairs around round table */}
                  {Array.from({ length: table.capacity }).map((_, i) => {
                    const angle = (2 * Math.PI * i) / table.capacity - Math.PI / 2
                    const dist  = hw + 14
                    return (
                      <Chair
                        key={i}
                        x={cx + dist * Math.cos(angle)}
                        y={cy + dist * Math.sin(angle)}
                        angle={angle}
                        occupied={i < table.occupancy}
                      />
                    )
                  })}
                  {/* Circle body */}
                  <circle cx={cx} cy={cy} r={hw}
                    fill={tableFill} stroke={tableStroke} strokeWidth={2}
                    filter="drop-shadow(0 3px 6px rgba(0,0,0,0.10))" />
                  {/* Status dot — top-right of circle */}
                  {statusDot(cx + hw * 0.71, cy - hw * 0.71, table.occupancy, table.capacity)}
                </>
              ) : table.shape === 'sweetheart' ? (
                <>
                  {/* Chairs along top */}
                  {Array.from({ length: table.capacity }).map((_, i) => (
                    <RectChair
                      key={i}
                      x={table.position_x + ((i + 1) / (table.capacity + 1)) * table.width}
                      y={table.position_y - 14}
                      rotation={180}
                      occupied={i < table.occupancy}
                    />
                  ))}
                  {/* Sweetheart rect body */}
                  <rect x={table.position_x} y={table.position_y} width={table.width} height={table.height}
                    rx={12} fill={tableFill} stroke={tableStroke} strokeWidth={2}
                    filter="drop-shadow(0 3px rgba(217,119,6,0.2))" />
                  {statusDot(table.position_x + table.width - 8, table.position_y + 8, table.occupancy, table.capacity)}
                </>
              ) : (
                <>
                  {/* Rect table chairs — side A top, side B bottom */}
                  {(() => {
                    const sideA = Math.ceil(table.capacity / 2)
                    const sideB = Math.floor(table.capacity / 2)
                    const occupied = (i: number) => i < table.occupancy
                    let idx = 0
                    const chairs = []
                    for (let i = 0; i < sideA; i++) {
                      chairs.push(<RectChair key={`a${i}`} x={table.position_x + ((i + 1) / (sideA + 1)) * table.width} y={table.position_y - 14} rotation={180} occupied={occupied(idx++)} />)
                    }
                    for (let i = 0; i < sideB; i++) {
                      chairs.push(<RectChair key={`b${i}`} x={table.position_x + ((i + 1) / (sideB + 1)) * table.width} y={table.position_y + table.height + 14} rotation={0} occupied={occupied(idx++)} />)
                    }
                    return chairs
                  })()}
                  {/* Rect body */}
                  <rect x={table.position_x} y={table.position_y} width={table.width} height={table.height}
                    rx={8} fill={tableFill} stroke={tableStroke} strokeWidth={2}
                    filter="drop-shadow(0 3px 6px rgba(0,0,0,0.10))" />
                  {statusDot(table.position_x + table.width - 8, table.position_y + 8, table.occupancy, table.capacity)}
                </>
              )}

              {/* Table name + occupancy — rendered counter-rotated so text stays horizontal */}
              <g transform={table.rotation ? `rotate(${-table.rotation},${cx},${cy})` : undefined}>
                <text x={cx} y={cy - nameFontSize * 0.4}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={nameFontSize} fontWeight="bold"
                  fontFamily="system-ui, sans-serif" fill={nameColor}>
                  {table.tableName.length > 12 ? table.tableName.slice(0, 11) + '…' : table.tableName}
                </text>
                <text x={cx} y={cy + nameFontSize * 0.9}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.max(7, nameFontSize - 2)}
                  fontFamily="system-ui, sans-serif" fill={occColor}>
                  {table.occupancy}/{table.capacity}
                </text>
              </g>
            </g>
          )

          return <g key={`t-${table.tableNumber}`}>{tableContent}</g>
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-stone-200 text-xs text-muted-foreground flex-wrap bg-white">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 inline-block" style={{ borderColor: '#d1d5db' }} />
          Empty
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 inline-block" style={{ borderColor: '#f59e0b' }} />
          Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 inline-block" style={{ borderColor: '#22c55e' }} />
          Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 inline-block" style={{ borderColor: '#ef4444' }} />
          Over capacity
        </span>
        <span className="ml-auto">{tables.length} tables · {venueElements.length} elements</span>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon, expanded, onToggle }: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 mb-3 group"
    >
      <div className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </div>
      <div className="flex-1 border-b border-dashed" />
      {expanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  )
}
