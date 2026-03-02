'use client'

import React from 'react'
import {
  UtensilsCrossed, LayoutGrid, MapPin, CalendarDays,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Color utilities
// ─────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').padEnd(6, '0')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function clampByte(v: number) { return Math.max(0, Math.min(255, Math.round(v))) }
function rgbToHex(r: number, g: number, b: number) {
  return `#${clampByte(r).toString(16).padStart(2, '0')}${clampByte(g).toString(16).padStart(2, '0')}${clampByte(b).toString(16).padStart(2, '0')}`
}
function darkenHex(hex: string, f: number) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - f), g * (1 - f), b * (1 - f))
}
function lightenHex(hex: string, f: number) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f)
}
function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export type BrandPalette = {
  dark: string; medium: string; accent: string
  accentLight: string; accentDark: string
  onDark: string; onDarkMuted: string; onDarkSubtle: string
}

export function buildPalette(primary = '#420c14', _secondary = '#732c2c', accent = '#DDA46F'): BrandPalette {
  const lum = luminance(primary)
  const isLight = lum > 0.55
  const dark = isLight ? darkenHex(primary, 0.45) : darkenHex(primary, 0.1)
  const medium = isLight ? darkenHex(primary, 0.25) : lightenHex(primary, 0.18)
  return {
    dark, medium, accent,
    accentLight: lightenHex(accent, 0.22),
    accentDark: darkenHex(accent, 0.15),
    onDark: '#ffffff',
    onDarkMuted: lightenHex(primary, 0.52),
    onDarkSubtle: lightenHex(primary, 0.32),
  }
}

// ─────────────────────────────────────────────
// Data types
// ─────────────────────────────────────────────
export interface WeddingPDFData {
  wedding: {
    partner1_first_name?: string; partner1_last_name?: string
    partner2_first_name?: string; partner2_last_name?: string
    wedding_date?: string; wedding_time?: string; reception_time?: string
    ceremony_venue_name?: string; ceremony_venue_address?: string
    reception_venue_name?: string; reception_venue_address?: string
    locale?: string; primary_color?: string; secondary_color?: string; accent_color?: string
  }
  stats: { totalGuests: number; confirmed: number; declined: number; pending: number; totalTables: number; assignedGuests: number; unassignedGuests: number; totalMenus: number; totalCapacity: number }
  menus: Array<{ id: string; name: string; description: string | null; image_url: string | null; count: number; courses: Array<{ id: string; course_number: number; course_name: string | null; dish_name: string | null }> }>
  seating: Array<{ tableNumber: number; tableName: string; shape: string; capacity: number; occupancy: number; position_x: number; position_y: number; width: number; height: number; rotation: number; guests: Array<{ name: string; groupName: string | null; status: string; dietaryRestrictions: string | null; menu: { name: string } | null; seatNumber: number | null }> }>
  itinerary: Array<{ id: string; title: string; description: string | null; location: string | null; start_time: string; end_time: string | null; notes: string | null; icon: string | null; children: Array<{ id: string; title: string; description: string | null; location: string | null; start_time: string; end_time: string | null; notes: string | null; icon: string | null }> }>
  venueMapDataUrl?: string; coverImageUrl?: string; selectedSections?: string[]
  venueMapIsHorizontal?: boolean
  bgSource?: 'primary' | 'accent'
  bgVariant?: 'original' | 'light' | 'lighter'
  hlSource?: 'primary' | 'accent'
  hlVariant?: 'original' | 'light' | 'lighter'
}

// A4 at 96dpi
const PAGE_W = 794
const PAGE_H = 1123
const CONTENT_TOP = 48
const CONTENT_BOTTOM = 60

// ─────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────
function PageShell({ children, className = '', style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      data-pdf-page
      className={`relative overflow-hidden ${className}`}
      style={{
        width: PAGE_W, height: PAGE_H,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 11, color: '#2c2c2c', backgroundColor: '#fefdfb',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Ornament({ color, width = 100 }: { color: string; width?: number }) {
  const half = (width - 16) / 2
  return (
    <div className="flex items-center justify-center" style={{ margin: '8px 0' }}>
      <div style={{ height: 1, backgroundColor: color, width: half }} />
      <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, margin: '0 5px' }} />
      <div style={{ height: 1, backgroundColor: color, width: half }} />
    </div>
  )
}

function PageFooter({ weddingName, onDark = false, nameOnDark = false }: {
  weddingName: string; onDark?: boolean; nameOnDark?: boolean
}) {
  const nameColor = (onDark || nameOnDark) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
  return (
    <>
      {/* Vertical wedding name on left edge — same style as section dividers */}
      <div className="absolute" style={{
        bottom: 52, left: 18, transform: 'rotate(-90deg)', transformOrigin: 'left bottom',
      }}>
        <span style={{
          fontSize: 8, color: nameColor, letterSpacing: 4,
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          {weddingName}
        </span>
      </div>
      {/* Small logo bottom-right */}
      <div className="absolute" style={{ bottom: 18, right: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={onDark ? '/images/logos/OMW%20Logo%20White.png' : '/images/logos/OMW%20Logo%20Gold.png'}
          alt="OhMyWedding"
          style={{ width: 28, height: 'auto', opacity: onDark ? 0.38 : 0.48 }}
        />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Cover Page
// ─────────────────────────────────────────────
function CoverPage({ partnerNames, weddingDate, locale, ceremonyVenue, receptionVenue, coverImageUrl, pal }: {
  partnerNames: string; weddingDate?: string; locale: string
  ceremonyVenue?: string; receptionVenue?: string
  coverImageUrl?: string; pal: BrandPalette
}) {
  // Parse date parts directly from the ISO string to avoid UTC→local timezone shift
  const shortDate = (() => {
    if (!weddingDate) return undefined
    const parts = weddingDate.split('T')[0].split('-')
    if (parts.length < 3) return undefined
    const [y, m, d] = parts.map(Number)
    const local = new Date(y, m - 1, d) // local midnight — no timezone shift
    return local.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  // Use only the reception venue (primary) when it starts with or contains the ceremony venue name,
  // otherwise show both separated by a dot. Trim to max 60 chars to avoid overflow.
  const venueLabel = (() => {
    const c = ceremonyVenue?.trim()
    const r = receptionVenue?.trim()
    if (!c && !r) return undefined
    if (!c) return r!.slice(0, 60)
    if (!r || r === c) return c.slice(0, 60)
    // If reception starts with ceremony name, just show the longer one (reception)
    if (r.startsWith(c)) return r.slice(0, 60)
    const combined = `${c}  ·  ${r}`
    return combined.length <= 60 ? combined : r.slice(0, 60)
  })()

  // Adaptive font: shorter name = bigger font
  const nameFontSize = partnerNames.length <= 10 ? 54
    : partnerNames.length <= 14 ? 48
    : partnerNames.length <= 20 ? 42
    : 34

  // Usable text width at padding 72px each side = 794 - 144 = 650px
  const TEXT_W = PAGE_W - 144

  return (
    <PageShell style={{ backgroundColor: pal.dark }}>
      {coverImageUrl && (
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${coverImageUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{
        background: coverImageUrl
          ? `linear-gradient(135deg, ${pal.dark}BB 0%, ${pal.dark}66 50%, ${pal.accent}55 100%)`
          : `linear-gradient(135deg, ${pal.dark} 0%, ${pal.accent}88 100%)`,
      }} />
      {/* Dark vignette at bottom */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 560, background: `linear-gradient(to top, ${pal.dark}EE 0%, transparent 100%)` }} />

      {/* Text block — each element strictly one line, no overflow */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center" style={{ padding: '0 72px 88px' }}>
        {/* Partner names */}
        <h1 style={{
          fontFamily: "'Macker', serif",
          fontSize: nameFontSize,
          color: '#ffffff', textAlign: 'center',
          width: TEXT_W, maxWidth: TEXT_W,
          letterSpacing: 1, lineHeight: 1.1,
          margin: 0,
          textShadow: '0 4px 40px rgba(0,0,0,0.7)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {partnerNames}
        </h1>
        {/* Date — single line guaranteed */}
        {shortDate && (
          <p style={{
            fontFamily: "'Sinera', serif", fontSize: 14,
            color: 'rgba(255,255,255,0.82)', textAlign: 'center',
            marginTop: 10, letterSpacing: 2, lineHeight: 1,
            width: TEXT_W, maxWidth: TEXT_W,
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {shortDate}
          </p>
        )}
        {/* Venue — single line, trimmed */}
        {venueLabel && (
          <p style={{
            fontSize: 11, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.5)', marginTop: 7,
            textAlign: 'center', lineHeight: 1,
            width: TEXT_W, maxWidth: TEXT_W,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {venueLabel}
          </p>
        )}
      </div>
      <PageFooter weddingName={partnerNames} onDark />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Index Page (Table of Contents)
// ─────────────────────────────────────────────
function IndexPage({ wedding, weddingName, pal, t, locale, selectedSections, stats }: {
  wedding: WeddingPDFData['wedding']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  locale: string; selectedSections?: string[]; stats: WeddingPDFData['stats']
}) {
  const formatDate = (d: string) => {
    const parts = d.split('T')[0].split('-').map(Number)
    const local = new Date(parts[0], parts[1] - 1, parts[2])
    return local.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const sectionOrder = ['menus', 'seating', 'itinerary', 'venue'] as const
  const sectionLabels: Record<string, string> = {
    menus: t('admin.summary.sections.menus'),
    seating: t('admin.summary.sections.seatingAssignments'),
    itinerary: t('admin.summary.sections.itinerary'),
    venue: t('admin.summary.sections.venueMap'),
  }
  const visibleSections = sectionOrder.filter(k => !selectedSections || selectedSections.includes(k))

  return (
    <PageShell>
      {/* Dark header band */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 300, backgroundColor: pal.dark }} />

      {/* Header content on dark band */}
      <div className="absolute" style={{ top: 56, left: 56, right: 56 }}>
        <span style={{
          fontSize: 9, color: pal.accent, letterSpacing: 4,
          textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 16,
        }}>
          {t('admin.summary.sections.overview')}
        </span>
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 44, color: pal.onDark,
          lineHeight: 1.05, letterSpacing: 1,
        }}>
          {weddingName}
        </h2>
        {wedding.wedding_date && (
          <p style={{
            fontFamily: "'Sinera', serif", fontSize: 15, color: pal.accent,
            marginTop: 14, letterSpacing: 1,
          }}>
            {formatDate(wedding.wedding_date)}
          </p>
        )}
      </div>

      {/* Stats row at base of dark band — confirmed guests only, no non-confirmed data */}
      <div className="absolute flex gap-5" style={{ top: 232, left: 56, right: 56 }}>
        {[
          { value: stats.confirmed, label: t('admin.summary.stats.confirmed') },
          { value: stats.totalTables, label: t('admin.summary.stats.tables') },
          { value: stats.totalMenus, label: t('admin.summary.stats.menus') },
        ].map((item, i) => (
          <div key={i} className="flex-1 flex items-baseline gap-2">
            <span style={{
              fontFamily: "'Macker', serif", fontSize: 28, color: '#ffffff',
              lineHeight: 1,
            }}>{item.value}</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Section list */}
      <div className="absolute" style={{ top: 340, left: 56, right: 56, bottom: 70 }}>
        {visibleSections.map((key, i) => {
          const Icon = SECTION_ICONS[key as keyof typeof SECTION_ICONS] || CalendarDays
          return (
            <div key={key} className="flex items-center" style={{
              padding: '22px 0',
              borderBottom: i < visibleSections.length - 1 ? '1px solid #e9e5e0' : 'none',
            }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{
                width: 44, height: 44, borderRadius: 22,
                border: `1.5px solid ${pal.accent}`, marginRight: 24,
              }}>
                <Icon size={20} color={pal.accent} strokeWidth={1.5} />
              </div>
              <span style={{
                fontFamily: "'Macker', serif", fontSize: 24, color: pal.dark,
                flex: 1, letterSpacing: 0.5,
              }}>
                {sectionLabels[key]}
              </span>
              <span style={{
                fontSize: 10, color: '#c0b8b0', letterSpacing: 2,
              }}>
                {String(i + 2).padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>

      <PageFooter weddingName={weddingName} />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Section Divider — colored rectangle + light bg
// ─────────────────────────────────────────────
const SECTION_ICONS: Record<string, React.FC<{size?: number; color?: string; strokeWidth?: number}>> = {
  menus: UtensilsCrossed, seating: LayoutGrid, itinerary: CalendarDays, venue: MapPin,
}

function SectionDividerPage({ title, subtitle, iconType, pal, weddingName }: {
  title: string; subtitle?: string; iconType: string; pal: BrandPalette; weddingName: string
}) {
  const Icon = SECTION_ICONS[iconType] || CalendarDays

  return (
    <PageShell style={{ backgroundColor: '#f8f6f2' }}>
      {/* Clean dark column on the left — no diagonal */}
      <div className="absolute top-0 bottom-0 left-0" style={{ width: '45%', backgroundColor: pal.dark }} />

      {/* Thin accent line separating panels */}
      <div className="absolute top-0 bottom-0" style={{ left: '45%', width: 2, backgroundColor: pal.accent, opacity: 0.6 }} />

      {/* Content bottom-right */}
      <div className="absolute flex flex-col items-end" style={{
        bottom: 100, left: '50%', right: 56,
      }}>
        <div className="flex items-center justify-center" style={{
          width: 52, height: 52, borderRadius: 26,
          border: `1.5px solid ${pal.accent}`, marginBottom: 20,
        }}>
          <Icon size={22} color={pal.accent} strokeWidth={1.5} />
        </div>
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 44, color: pal.dark,
          lineHeight: 1.1, letterSpacing: 1, marginBottom: 8,
          textAlign: 'right',
        }}>
          {title}
        </h2>
        <div style={{ height: 2, width: 44, backgroundColor: pal.accent, marginBottom: 12 }} />
        {subtitle && (
          <p style={{ fontSize: 13, color: '#787167', fontStyle: 'italic', textAlign: 'right' }}>{subtitle}</p>
        )}
      </div>

      {/* PageFooter handles the vertical name; nameOnDark since it sits over the dark left panel */}
      <PageFooter weddingName={weddingName} nameOnDark />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Menus Page — minimalist
// ─────────────────────────────────────────────
function MenusPage({ menus, weddingName, pal, t }: {
  menus: WeddingPDFData['menus']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  return (
    <PageShell>
      <div style={{ padding: '48px 56px 60px 56px' }}>
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 26, color: pal.dark,
          marginBottom: 2, letterSpacing: 1,
        }}>
          {t('admin.summary.sections.menus')}
        </h2>
        <Ornament color={pal.accent} width={100} />
        <div style={{ marginTop: 24 }}>
          {menus.map((menu, mi) => (
            <div key={menu.id} style={{
              marginBottom: 28, paddingBottom: 28,
              borderBottom: mi < menus.length - 1 ? `1px solid #e9e5e0` : 'none',
            }}>
              {/* Menu header row */}
              <div className="flex items-baseline justify-between" style={{ marginBottom: menu.courses.length > 0 ? 12 : 0 }}>
                <div>
                  <span style={{
                    fontFamily: "'Macker', serif", fontSize: 20, color: pal.dark,
                    letterSpacing: 0.5,
                  }}>
                    {menu.name}
                  </span>
                  {menu.description && (
                    <span style={{ fontSize: 10, color: '#787167', fontStyle: 'italic', marginLeft: 10 }}>
                      {menu.description}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 10, color: pal.accent, letterSpacing: 1,
                  flexShrink: 0, marginLeft: 16,
                }}>
                  {menu.count} pax
                </span>
              </div>

              {/* Courses */}
              {menu.courses.length > 0 && (
                <div className="flex flex-col" style={{ gap: 5 }}>
                  {menu.courses.map((course) => (
                    <div key={course.id} className="flex items-baseline" style={{ paddingLeft: 0 }}>
                      <span style={{
                        fontSize: 9, color: pal.accent, width: 22, flexShrink: 0,
                        fontWeight: 600, letterSpacing: 0.5,
                      }}>
                        {course.course_number}.
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#2c2c2c' }}>
                        {course.course_name || `${t('admin.dishes.course')} ${course.course_number}`}
                      </span>
                      {course.dish_name && (
                        <span style={{ fontSize: 10, color: '#787167', marginLeft: 6 }}>
                          — {course.dish_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center justify-between" style={{
            borderTop: '2px solid #e9e5e0', paddingTop: 14,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#787167',
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              {t('admin.summary.totalAssigned')}
            </span>
            <span style={{
              fontFamily: "'Macker', serif", fontSize: 22, color: pal.dark,
            }}>
              {menus.reduce((s, m) => s + m.count, 0)}
            </span>
          </div>
        </div>
      </div>
      <PageFooter weddingName={weddingName} />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Seating Pages — auto-paginate across multiple A4 pages
// ─────────────────────────────────────────────
function SeatingPages({ seating, weddingName, pal, t }: {
  seating: WeddingPDFData['seating']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  const sorted = [...seating].sort((a, b) => {
    const sw = (tbl: typeof seating[0]) =>
      tbl.shape === 'sweetheart' ||
      tbl.tableName.toLowerCase().includes('sweet') ||
      tbl.tableName.toLowerCase().includes('novia') ||
      tbl.tableName.toLowerCase().includes('head')
    if (sw(a) && !sw(b)) return -1
    if (!sw(a) && sw(b)) return 1
    return a.tableNumber - b.tableNumber
  })

  const TABLE_HEADER_H = 34
  const GUEST_ROW_H = 22
  const TABLE_COL_HEADER_H = 22
  const TABLE_GAP = 12
  const TITLE_AREA_H = 54
  const usableH = PAGE_H - CONTENT_TOP - CONTENT_BOTTOM - TITLE_AREA_H

  type PageEntry = {
    table: typeof sorted[0]
    startGuest: number
    endGuest: number
    isHeader: boolean
  }

  const pages: PageEntry[][] = []
  let currentPage: PageEntry[] = []
  let currentH = 0

  for (const table of sorted) {
    const headerH = TABLE_HEADER_H + TABLE_COL_HEADER_H
    const totalTableH = headerH + table.guests.length * GUEST_ROW_H + TABLE_GAP

    if (currentH + totalTableH <= usableH) {
      currentPage.push({ table, startGuest: 0, endGuest: table.guests.length, isHeader: true })
      currentH += totalTableH
    } else {
      const minH = headerH + 2 * GUEST_ROW_H
      if (currentH + minH > usableH && currentPage.length > 0) {
        pages.push(currentPage)
        currentPage = []
        currentH = 0
      }

      let guestIdx = 0
      while (guestIdx < table.guests.length) {
        const hdrH = headerH
        const availableH = (currentPage.length === 0 ? usableH : usableH - currentH) - hdrH - TABLE_GAP
        const fitCount = Math.max(1, Math.floor(availableH / GUEST_ROW_H))
        const end = Math.min(guestIdx + fitCount, table.guests.length)

        currentPage.push({ table, startGuest: guestIdx, endGuest: end, isHeader: true })
        currentH += hdrH + (end - guestIdx) * GUEST_ROW_H + TABLE_GAP
        guestIdx = end

        if (guestIdx < table.guests.length) {
          pages.push(currentPage)
          currentPage = []
          currentH = 0
        }
      }
    }
  }
  if (currentPage.length > 0) pages.push(currentPage)

  return (
    <>
      {pages.map((pageContent, pi) => (
        <PageShell key={`seating-${pi}`}>
          <div style={{ padding: `${CONTENT_TOP}px 56px ${CONTENT_BOTTOM}px 56px` }}>
            {pi === 0 && (
              <>
                <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: '#2c2c2c', marginBottom: 4 }}>
                  {t('admin.summary.sections.seatingAssignments')}
                </h2>
                <div style={{ height: 2, width: 40, backgroundColor: pal.accent, marginBottom: 24 }} />
              </>
            )}
            {pi > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 9, color: '#a0988c', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('admin.summary.sections.seatingAssignments')} — {pi + 1}
                </span>
              </div>
            )}
            <div className="flex flex-col" style={{ gap: TABLE_GAP }}>
              {pageContent.map((entry, ei) => (
                <div key={`${entry.table.tableNumber}-${entry.startGuest}-${ei}`} style={{ borderRadius: 6, overflow: 'hidden' }}>
                  {entry.isHeader && (
                    <div className="flex items-center relative overflow-hidden" style={{
                      backgroundColor: '#f5f2eb', border: '1px solid #e9e5e0',
                      borderRadius: (entry.endGuest - entry.startGuest) > 0 ? '6px 6px 0 0' : '6px',
                      padding: '8px 12px 8px 16px',
                    }}>
                      <div className="absolute top-0 bottom-0 left-0" style={{ width: 3, backgroundColor: pal.accent }} />
                      <span className="flex-1" style={{ fontSize: 11, fontWeight: 700, color: pal.dark, paddingLeft: 4 }}>
                        {t('admin.summary.tableNumber', { number: String(entry.table.tableNumber) })}: {entry.table.tableName}
                      </span>
                      <div style={{
                        backgroundColor: '#f8f6f2', borderRadius: 4,
                        padding: '2px 10px', border: '1px solid #e9e5e0',
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: pal.dark }}>
                          {entry.table.guests.length}
                        </span>
                      </div>
                    </div>
                  )}
                  {(entry.endGuest - entry.startGuest) > 0 && (
                    <div style={{
                      border: '1px solid #e9e5e0', borderTop: entry.isHeader ? 'none' : '1px solid #e9e5e0',
                      borderRadius: entry.isHeader ? '0 0 6px 6px' : '6px', overflow: 'hidden',
                    }}>
                      <div className="flex" style={{ backgroundColor: '#f8f6f2', borderBottom: '1px solid #e9e5e0' }}>
                        {[t('admin.summary.columns.guest'), t('admin.summary.columns.group'), t('admin.summary.columns.menu')].map((col, ci) => (
                          <span key={ci} style={{
                            flex: ci === 0 ? 2 : 1.5, fontSize: 8, fontWeight: 700,
                            color: '#787167', padding: '5px 8px',
                            textTransform: 'uppercase', letterSpacing: 0.5,
                          }}>
                            {col}
                          </span>
                        ))}
                      </div>
                      {entry.table.guests.slice(entry.startGuest, entry.endGuest).map((guest, gi) => (
                        <div key={gi} className="flex items-center" style={{
                          backgroundColor: gi % 2 === 0 ? '#fefdfb' : '#f8f6f2',
                          borderBottom: gi < (entry.endGuest - entry.startGuest) - 1 ? '1px solid #f0ede6' : 'none',
                        }}>
                          <span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: '#2c2c2c', padding: '4px 8px' }}>
                            {guest.name}
                          </span>
                          <span style={{ flex: 1.5, fontSize: 9, color: '#2c2c2c', padding: '4px 8px' }}>
                            {guest.groupName || '—'}
                          </span>
                          <span style={{ flex: 1.5, fontSize: 9, color: pal.medium, padding: '4px 8px' }}>
                            {guest.menu?.name || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <PageFooter weddingName={weddingName} />
        </PageShell>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────
// Itinerary Page — minimalist two-column
// ─────────────────────────────────────────────
function ItineraryPage({ itinerary, locale, weddingName, pal, t }: {
  itinerary: WeddingPDFData['itinerary']; locale: string; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  const formatTime = (d: string) => new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  return (
    <PageShell>
      <div style={{ padding: '48px 56px 60px 56px' }}>
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 26, color: pal.dark,
          marginBottom: 2, letterSpacing: 1,
        }}>
          {t('admin.summary.sections.itinerary')}
        </h2>
        <Ornament color={pal.accent} width={100} />
        <div style={{ marginTop: 24 }}>
          {itinerary.map((event, ei) => (
            <div key={event.id} className="flex" style={{ minHeight: 0 }}>
              {/* Time column — right-aligned Macker */}
              <div style={{
                width: 88, paddingRight: 20, textAlign: 'right',
                flexShrink: 0, paddingTop: 16,
              }}>
                <span style={{
                  fontFamily: "'Macker', serif",
                  fontSize: 14, color: pal.dark,
                  display: 'block', lineHeight: 1,
                }}>
                  {formatTime(event.start_time)}
                </span>
                {event.end_time && (
                  <span style={{ fontSize: 9, color: '#a0988c', display: 'block', marginTop: 2 }}>
                    {formatTime(event.end_time)}
                  </span>
                )}
              </div>

              {/* Vertical accent line */}
              <div style={{
                width: 1, backgroundColor: `${pal.accent}35`,
                flexShrink: 0, marginTop: 12,
              }} />

              {/* Event content */}
              <div style={{
                flex: 1, padding: '12px 0 12px 20px',
                borderBottom: ei < itinerary.length - 1 ? '1px solid #f0ede6' : 'none',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: pal.dark,
                  letterSpacing: 0.8, textTransform: 'uppercase', display: 'block',
                }}>
                  {event.title}
                </span>
                {event.location && (
                  <span style={{
                    fontSize: 9, color: '#a0988c', display: 'flex',
                    alignItems: 'center', gap: 3, marginTop: 3,
                  }}>
                    <MapPin size={8} color="#a0988c" strokeWidth={1.5} />
                    {event.location}
                  </span>
                )}
                {event.description && (
                  <span style={{
                    fontSize: 10, fontStyle: 'italic', color: '#787167',
                    display: 'block', marginTop: 3,
                  }}>
                    {event.description}
                  </span>
                )}
                {event.notes && (
                  <span style={{ fontSize: 9, color: '#a0988c', display: 'block', marginTop: 3 }}>
                    {event.notes}
                  </span>
                )}
                {event.children?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {event.children.map((child) => (
                      <div key={child.id} className="flex items-baseline" style={{ marginBottom: 4 }}>
                        <span style={{
                          fontSize: 9, color: pal.accent,
                          width: 48, marginRight: 8, flexShrink: 0,
                          fontFamily: "'Macker', serif",
                        }}>
                          {formatTime(child.start_time)}
                        </span>
                        <span style={{ fontSize: 9, color: '#5c5550' }}>{child.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <PageFooter weddingName={weddingName} />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Venue Map Page
// ─────────────────────────────────────────────
function VenueMapPage({ mapDataUrl, venueName, weddingName, pal, t, isHorizontal = false }: {
  mapDataUrl: string; venueName?: string; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string; isHorizontal?: boolean
}) {
  // For horizontal maps, rotate the content 90° to maximize page usage
  if (isHorizontal) {
    return (
      <PageShell>
        {/* Rotated container: swap width/height, rotate contents */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: PAGE_H - 80, height: PAGE_W - 80,
          transform: 'translate(-50%, -50%) rotate(90deg)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: '#2c2c2c', marginBottom: 2 }}>
                {t('admin.summary.sections.venueMap')}
              </h2>
              {venueName && (
                <p style={{ fontSize: 10, fontStyle: 'italic', color: '#787167' }}>{venueName}</p>
              )}
            </div>
            <div style={{ height: 2, width: 40, backgroundColor: pal.accent }} />
          </div>
          <div style={{
            flex: 1, border: '1px solid #e9e5e0', borderRadius: 8,
            overflow: 'hidden', padding: 6, backgroundColor: '#fefdfb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mapDataUrl} alt="Venue map" style={{
              maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4,
            }} />
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ padding: '48px 40px 60px 40px' }}>
        <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: '#2c2c2c', marginBottom: 4 }}>
          {t('admin.summary.sections.venueMap')}
        </h2>
        {venueName && (
          <p style={{ fontSize: 11, fontStyle: 'italic', color: '#787167', marginTop: 2 }}>{venueName}</p>
        )}
        <div style={{ height: 2, width: 40, backgroundColor: pal.accent, marginBottom: 16 }} />
        <div style={{
          border: '1px solid #e9e5e0', borderRadius: 8,
          overflow: 'hidden', padding: 6, backgroundColor: '#fefdfb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: PAGE_H - 240,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mapDataUrl} alt="Venue map" style={{
            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4,
          }} />
        </div>
      </div>
      <PageFooter weddingName={weddingName} />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Closing Page
// ─────────────────────────────────────────────
const CLOSING_DISC: Record<string, [string, string]> = {
  es: [
    'Este documento fue generado con OhMyWedding',
    'La plataforma de gestión de bodas para listas, asientos, menús e itinerario',
  ],
  en: [
    'This document was generated with OhMyWedding',
    'The wedding management platform for guest lists, seating, menus & itinerary',
  ],
}

function ClosingPage({ partnerNames, date, pal, coverImageUrl, locale }: {
  partnerNames: string; date?: string; pal: BrandPalette
  coverImageUrl?: string; locale: string
}) {
  const [disc1, disc2] = CLOSING_DISC[locale] ?? CLOSING_DISC.en
  return (
    <PageShell style={{ backgroundColor: pal.dark }}>
      {/* Background image — very subtle, mostly transparent */}
      {coverImageUrl && (
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${coverImageUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.25,
        }} />
      )}
      {/* Transparent accent tint overlay */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(160deg, ${pal.dark}EE 0%, ${pal.accent}55 60%, ${pal.dark}CC 100%)`,
      }} />
      {/* Dark vignette edges */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, transparent 30%, ${pal.dark}BB 90%)`,
      }} />

      {/* Centered OhMyWedding logo — paddingBottom clears the bottom disclaimer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 0, paddingLeft: 80, paddingRight: 80, paddingBottom: 120 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/OMW%20Logo%20White.png"
          alt="OhMyWedding"
          style={{ width: 240, opacity: 0.92, marginBottom: 36 }}
        />
        <Ornament color="rgba(255,255,255,0.35)" width={200} />
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 38, color: '#ffffff',
          textAlign: 'center', marginTop: 16, marginBottom: 8, letterSpacing: 1,
          textShadow: '0 3px 20px rgba(0,0,0,0.3)',
        }}>
          {partnerNames}
        </h2>
        {date && (
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center',
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20,
            textShadow: '0 1px 8px rgba(0,0,0,0.2)',
          }}>
            {date}
          </p>
        )}
        <Ornament color="rgba(255,255,255,0.35)" width={90} />
      </div>

      {/* Disclaimer — credits OhMyWedding as creator of the document */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center" style={{
        padding: '20px 60px 24px',
        background: `linear-gradient(to top, ${pal.dark}DD, transparent)`,
      }}>
        <p style={{
          fontSize: 8, color: 'rgba(255,255,255,0.35)', textAlign: 'center',
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
        }}>
          {disc1}
        </p>
        <p style={{
          fontSize: 8, color: 'rgba(255,255,255,0.22)', textAlign: 'center',
          letterSpacing: 1, marginBottom: 2,
        }}>
          {disc2}
        </p>
        <p style={{
          fontSize: 8, color: 'rgba(255,255,255,0.3)', textAlign: 'center',
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          ohmy.wedding
        </p>
      </div>
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Main document
// ─────────────────────────────────────────────
export function WebPDFDocument({ data, t }: {
  data: WeddingPDFData
  t: (k: string, p?: Record<string, string>) => string
}) {
  const locale = data.wedding.locale || 'en'

  // Apply palette variant (tint) to primary and/or accent color
  const applyVariant = (hex: string | undefined, variant?: 'original' | 'light' | 'lighter'): string => {
    if (!hex) return hex ?? '#420c14'
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255
    const tint = (a: number) => `#${[r, g, b].map(c => Math.round(c + (255 - c) * a).toString(16).padStart(2, '0')).join('')}`
    if (variant === 'light') return tint(0.5)
    if (variant === 'lighter') return tint(0.88)
    return hex
  }

  const pal = buildPalette(
    applyVariant(
      (data.bgSource ?? 'primary') === 'primary' ? data.wedding.primary_color : data.wedding.accent_color,
      data.bgVariant,
    ),
    data.wedding.secondary_color,
    applyVariant(
      (data.hlSource ?? 'accent') === 'accent' ? data.wedding.accent_color : data.wedding.primary_color,
      data.hlVariant,
    ),
  )
  const show = (key: string) => !data.selectedSections || data.selectedSections.includes(key)
  const p1 = data.wedding.partner1_first_name ?? ''
  const p2 = data.wedding.partner2_first_name ?? ''
  const partnerNames = `${p1} & ${p2}`
  const weddingName = partnerNames

  const formatDate = (d: string) => {
    const parts = d.split('T')[0].split('-').map(Number)
    const local = new Date(parts[0], parts[1] - 1, parts[2])
    return local.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }
  const formattedDate = data.wedding.wedding_date ? formatDate(data.wedding.wedding_date) : undefined

  return (
    <div data-pdf-container>
      <CoverPage
        partnerNames={partnerNames} weddingDate={data.wedding.wedding_date ?? undefined}
        locale={locale}
        ceremonyVenue={data.wedding.ceremony_venue_name}
        receptionVenue={data.wedding.reception_venue_name}
        coverImageUrl={data.coverImageUrl} pal={pal}
      />
      {show('overview') && (
        <IndexPage
          wedding={data.wedding} weddingName={weddingName}
          locale={locale} pal={pal} t={t} stats={data.stats}
          selectedSections={data.selectedSections}
        />
      )}
      {show('menus') && data.menus.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.menus')}
            subtitle={`${data.menus.length} ${data.menus.length === 1 ? 'menu' : 'menus'}`}
            iconType="menus" pal={pal} weddingName={weddingName}
          />
          <MenusPage menus={data.menus} weddingName={weddingName} pal={pal} t={t} />
        </>
      )}
      {show('seating') && data.seating.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.seatingAssignments')}
            subtitle={`${data.seating.length} tables · ${data.stats.confirmed} guests`}
            iconType="seating" pal={pal} weddingName={weddingName}
          />
          <SeatingPages seating={data.seating} weddingName={weddingName} pal={pal} t={t} />
        </>
      )}
      {show('itinerary') && data.itinerary.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.itinerary')}
            subtitle={`${data.itinerary.length} events`}
            iconType="itinerary" pal={pal} weddingName={weddingName}
          />
          <ItineraryPage itinerary={data.itinerary} locale={locale} weddingName={weddingName} pal={pal} t={t} />
        </>
      )}
      {show('venue') && data.venueMapDataUrl && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.venueMap')}
            subtitle={data.wedding.reception_venue_name}
            iconType="venue" pal={pal} weddingName={weddingName}
          />
          <VenueMapPage
            mapDataUrl={data.venueMapDataUrl} venueName={data.wedding.reception_venue_name}
            weddingName={weddingName} pal={pal} t={t} isHorizontal={data.venueMapIsHorizontal}
          />
        </>
      )}
      <ClosingPage
        partnerNames={partnerNames} date={formattedDate} pal={pal}
        coverImageUrl={data.coverImageUrl} locale={locale}
      />
    </div>
  )
}