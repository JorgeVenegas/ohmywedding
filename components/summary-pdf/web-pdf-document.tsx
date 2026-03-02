'use client'

import React from 'react'
import {
  UtensilsCrossed, LayoutGrid, MapPin, CalendarDays, Handshake,
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
  suppliers?: Array<{ id: string; name: string; category: string; contact_info: string | null; contact_type: string; contract_url: string | null; total_amount: number; covered_amount: number; notes: string | null; payments: Array<{ id: string; amount: number; payment_date: string; notes: string | null }> }>
  guestList?: Array<{ name: string; groupName: string | null; groupId: string | null; status: string; phone: string | null; menuName: string | null; tableName: string | null; tableNumber: number | null }>
  venueMapDataUrl?: string; coverImageUrl?: string; closingImageUrl?: string; selectedSections?: string[]
  venueMapIsHorizontal?: boolean
  showSuppliersFinancial?: boolean
  bgSource?: 'primary' | 'accent'
  bgVariant?: 'original' | 'light' | 'lighter'
  hlSource?: 'primary' | 'accent'
  hlVariant?: 'original' | 'light' | 'lighter'
}

// A4 at 96dpi
const PAGE_W = 794
const PAGE_H = 1123
const CONTENT_TOP = 48

// Distinct colors for menu identification
const MENU_COLORS = [
  '#C17547', // terracotta
  '#7B9E6B', // sage
  '#B07B94', // dusty rose
  '#6B8BA4', // slate blue
  '#C4A34D', // goldenrod
  '#8B6B8A', // plum
  '#5F9E9E', // teal
  '#C27C6B', // coral
  '#8A9460', // olive
  '#A45A68', // cranberry
]

function buildMenuColorMap(menus: Array<{ id: string; name: string }>): Record<string, string> {
  const map: Record<string, string> = {}
  menus.forEach((m, i) => { map[m.name] = MENU_COLORS[i % MENU_COLORS.length] })
  return map
}
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
function IndexPage({ wedding, weddingName, pal, t, locale, selectedSections, stats, hasDeclinedGuests }: {
  wedding: WeddingPDFData['wedding']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  locale: string; selectedSections?: string[]; stats: WeddingPDFData['stats']
  hasDeclinedGuests?: boolean
}) {
  const formatDate = (d: string) => {
    const parts = d.split('T')[0].split('-').map(Number)
    const local = new Date(parts[0], parts[1] - 1, parts[2])
    return local.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const sectionOrder = ['menus', 'guestsByGroup', 'guestsByMenu', 'guestsByTable', 'declinedGuests', 'itinerary', 'suppliers', 'venue'] as const
  const sectionLabels: Record<string, string> = {
    menus: t('admin.summary.sections.menus'),
    guestsByGroup: t('admin.summary.sections.guestsByGroup'),
    guestsByMenu: t('admin.summary.sections.guestsByMenu'),
    guestsByTable: t('admin.summary.sections.guestsByTable'),
    declinedGuests: t('admin.summary.pdf.declinedGuests'),
    itinerary: t('admin.summary.sections.itinerary'),
    suppliers: t('admin.summary.sections.suppliers'),
    venue: t('admin.summary.sections.venueMap'),
  }
  const sectionIconKeys: Record<string, string> = {
    menus: 'menus', guestsByGroup: 'seating', guestsByMenu: 'menus',
    guestsByTable: 'seating', declinedGuests: 'seating', itinerary: 'itinerary', suppliers: 'suppliers', venue: 'venue',
  }
  const visibleSections = sectionOrder.filter(k => {
    if (k === 'declinedGuests') {
      // Show in index only if declined guests exist AND any guest section is visible
      if (!hasDeclinedGuests) return false
      const guestSections = ['guestsByGroup', 'guestsByMenu', 'guestsByTable']
      return guestSections.some(gs => !selectedSections || selectedSections.includes(gs))
    }
    return !selectedSections || selectedSections.includes(k)
  })

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
          const iconKey = sectionIconKeys[key] || key
          const Icon = SECTION_ICONS[iconKey as keyof typeof SECTION_ICONS] || CalendarDays
          return (
            <div key={key} className="flex items-center" style={{
              padding: '16px 0',
              borderBottom: i < visibleSections.length - 1 ? '1px solid #e9e5e0' : 'none',
            }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{
                width: 36, height: 36, borderRadius: 18,
                border: `1.5px solid ${pal.accent}`, marginRight: 20,
              }}>
                <Icon size={17} color={pal.accent} strokeWidth={1.5} />
              </div>
              <span style={{
                fontFamily: "'Macker', serif", fontSize: 20, color: pal.dark,
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
  menus: UtensilsCrossed, seating: LayoutGrid, itinerary: CalendarDays, venue: MapPin, suppliers: Handshake,
}

function SectionDividerPage({ title, subtitle, iconType, pal, weddingName }: {
  title: string; subtitle?: string; iconType: string; pal: BrandPalette; weddingName: string
}) {
  const Icon = SECTION_ICONS[iconType] || CalendarDays

  return (
    <PageShell style={{ backgroundColor: '#f8f6f2' }}>
      {/* Dark column on the left */}
      <div className="absolute top-0 bottom-0 left-0" style={{ width: '45%', backgroundColor: pal.dark }} />

      {/* Dot pattern overlay on dark panel */}
      <svg className="absolute top-0 left-0" style={{ width: '45%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <pattern id="divider-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.2" fill="white" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#divider-dots)" />
      </svg>

      {/* Corner bracket — top-left of dark panel */}
      <div className="absolute" style={{ top: 48, left: 36 }}>
        <div style={{ width: 28, height: 3, backgroundColor: pal.accent, opacity: 0.7, borderRadius: 2 }} />
        <div style={{ width: 3, height: 28, backgroundColor: pal.accent, opacity: 0.7, borderRadius: 2 }} />
      </div>
      {/* Corner bracket — bottom-left of dark panel */}
      <div className="absolute" style={{ bottom: 48, left: 36 }}>
        <div style={{ width: 3, height: 28, backgroundColor: pal.accent, opacity: 0.7, borderRadius: 2 }} />
        <div style={{ width: 28, height: 3, backgroundColor: pal.accent, opacity: 0.7, borderRadius: 2, marginTop: 0 }} />
      </div>

      {/* Ornament centered on dark panel */}
      <div className="absolute" style={{ left: 24, width: '42%', top: '50%', transform: 'translateY(-50%)' }}>
        <Ornament color={`${pal.accent}55`} width={180} />
      </div>

      {/* Thick accent separator */}
      <div className="absolute top-0 bottom-0" style={{ left: '45%', width: 5, backgroundColor: pal.accent }} />
      {/* Soft glow to the right of separator */}
      <div className="absolute top-0 bottom-0" style={{ left: 'calc(45% + 5px)', width: 48, background: `linear-gradient(to right, ${pal.accent}28, transparent)` }} />

      {/* Content — right panel */}
      <div className="absolute flex flex-col items-end" style={{ bottom: 120, left: '52%', right: 56 }}>
        {/* Icon circle — with accent fill */}
        <div className="flex items-center justify-center" style={{
          width: 68, height: 68, borderRadius: 34,
          backgroundColor: `${pal.accent}22`,
          border: `2.5px solid ${pal.accent}`,
          marginBottom: 26,
        }}>
          <Icon size={30} color={pal.accent} strokeWidth={1.5} />
        </div>
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 48, color: pal.dark,
          lineHeight: 1.05, letterSpacing: 1, marginBottom: 14,
          textAlign: 'right',
        }}>
          {title}
        </h2>
        {/* Tiered accent lines */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginBottom: subtitle ? 14 : 0 }}>
          <div style={{ height: 3, width: 60, backgroundColor: pal.accent, borderRadius: 2 }} />
          <div style={{ height: 1.5, width: 40, backgroundColor: pal.accent, opacity: 0.5, borderRadius: 1 }} />
          <div style={{ height: 1, width: 22, backgroundColor: pal.accent, opacity: 0.3, borderRadius: 1 }} />
        </div>
        {subtitle && (
          <p style={{ fontFamily: "'Sinera', serif", fontSize: 15, color: pal.accent, textAlign: 'right', opacity: 0.85 }}>{subtitle}</p>
        )}
      </div>

      <PageFooter weddingName={weddingName} nameOnDark />
    </PageShell>
  )
}

// ─────────────────────────────────────────────
// Menus Page — minimalist
// ─────────────────────────────────────────────
function MenusPage({ menus, weddingName, pal, t, menuColorMap }: {
  menus: WeddingPDFData['menus']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
}) {
  return (
    <PageShell>
      <div style={{ padding: '48px 56px 60px 56px' }}>
        <h2 style={{
          fontFamily: "'Macker', serif", fontSize: 26, color: pal.accent,
          marginBottom: 2, letterSpacing: 1,
        }}>
          {t('admin.summary.sections.menus')}
        </h2>
        <Ornament color={pal.accent} width={100} />
        <div style={{ marginTop: 24 }}>
          {menus.map((menu, mi) => {
            const menuColor = menuColorMap[menu.name] || pal.accent
            return (
            <div key={menu.id} style={{
              marginBottom: 28, paddingBottom: 28,
              borderBottom: mi < menus.length - 1 ? `1px solid #e9e5e0` : 'none',
              borderLeft: `4px solid ${menuColor}`,
              paddingLeft: 16,
            }}>
              {/* Menu header row */}
              <div className="flex items-baseline justify-between" style={{ marginBottom: menu.courses.length > 0 ? 12 : 0 }}>
                <div className="flex items-center" style={{ gap: 10 }}>
                  {/* Color-coded index badge */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', backgroundColor: menuColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{mi + 1}</span>
                  </div>
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
                  fontSize: 10, color: menuColor, letterSpacing: 1,
                  flexShrink: 0, marginLeft: 16, fontWeight: 600,
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
                        fontSize: 9, color: menuColor, width: 22, flexShrink: 0,
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
            )
          })}

          {/* Menu legend */}
          <div className="flex flex-wrap items-center" style={{
            gap: 14, padding: '10px 12px', marginBottom: 16,
            backgroundColor: '#f5f2eb', borderRadius: 4,
            border: '1px solid #e9e5e0',
          }}>
            {menus.map((menu) => {
              const mc = menuColorMap[menu.name] || pal.accent
              return (
                <div key={menu.id} className="flex items-center" style={{ gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: mc, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: '#2c2c2c' }}>{menu.name}</span>
                </div>
              )
            })}
          </div>

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
function SeatingPages({ seating, weddingName, pal, t, menuColorMap }: {
  seating: WeddingPDFData['seating']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
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

  const TABLE_HEADER_H = 30
  const GUEST_ROW_H = 20
  const TABLE_COL_HEADER_H = 20
  const TABLE_GAP = 8
  const TITLE_AREA_H = 54
  const usableH = PAGE_H - CONTENT_TOP - CONTENT_BOTTOM - TITLE_AREA_H - 20
  const colFlex = [2.2, 1.2, 1.2]

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

  const truncStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <>
      {pages.map((pageContent, pi) => (
        <PageShell key={`seating-${pi}`}>
          <div style={{ padding: `${CONTENT_TOP}px 56px ${CONTENT_BOTTOM}px 56px`, overflow: 'hidden', height: PAGE_H - 0, boxSizing: 'border-box' }}>
            {pi === 0 && (
              <>
                <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: pal.accent, marginBottom: 4 }}>
                  {t('admin.summary.sections.seatingAssignments')}
                </h2>
                <div style={{ height: 3, width: 44, backgroundColor: pal.accent, marginBottom: 20 }} />
              </>
            )}
            {pi > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 9, color: '#a0988c', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('admin.summary.sections.seatingAssignments')} — {pi + 1}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: TABLE_GAP }}>
              {pageContent.map((entry, ei) => (
                <div key={`${entry.table.tableNumber}-${entry.startGuest}-${ei}`} style={{ borderRadius: 6, overflow: 'hidden' }}>
                  {entry.isHeader && (
                    <div style={{
                      display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
                      backgroundColor: '#f5f2eb', border: '1px solid #e9e5e0',
                      borderRadius: (entry.endGuest - entry.startGuest) > 0 ? '6px 6px 0 0' : '6px',
                      padding: '6px 12px 6px 16px',
                    }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: pal.accent }} />
                      <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: pal.dark, paddingLeft: 4, ...truncStyle }}>
                        {t('admin.summary.tableNumber', { number: String(entry.table.tableNumber) })}: {entry.table.tableName}
                      </span>
                      <div style={{
                        backgroundColor: '#f8f6f2', borderRadius: 4,
                        padding: '1px 8px', border: '1px solid #e9e5e0', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: pal.dark }}>
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
                      <div style={{ display: 'flex', backgroundColor: '#f8f6f2', borderBottom: '1px solid #e9e5e0' }}>
                        {[t('admin.summary.columns.guest'), t('admin.summary.columns.group'), t('admin.summary.columns.menu')].map((col, ci) => (
                          <span key={ci} style={{
                            flex: colFlex[ci], fontSize: 7, fontWeight: 700,
                            color: '#787167', padding: '4px 6px',
                            textTransform: 'uppercase', letterSpacing: 0.5, ...truncStyle,
                          }}>
                            {col}
                          </span>
                        ))}
                      </div>
                      {entry.table.guests.slice(entry.startGuest, entry.endGuest).map((guest, gi) => (
                        <div key={gi} style={{
                          display: 'flex', alignItems: 'center',
                          backgroundColor: gi % 2 === 0 ? '#fefdfb' : '#f8f6f2',
                          borderBottom: gi < (entry.endGuest - entry.startGuest) - 1 ? '1px solid #f0ede6' : 'none',
                        }}>
                          <span style={{ flex: colFlex[0], fontSize: 9, fontWeight: 600, color: '#2c2c2c', padding: '3px 6px', ...truncStyle }}>
                            {guest.name}
                          </span>
                          <span style={{ flex: colFlex[1], fontSize: 8, color: '#2c2c2c', padding: '3px 6px', ...truncStyle }}>
                            {guest.groupName || '—'}
                          </span>
                          <span style={{ flex: colFlex[2], fontSize: 8, color: guest.menu?.name ? (menuColorMap[guest.menu.name] || pal.medium) : '#a0988c', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3, fontWeight: guest.menu?.name ? 600 : 400, ...truncStyle }}>
                            {guest.menu?.name && (
                              <span style={{
                                display: 'inline-block', width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                                backgroundColor: menuColorMap[guest.menu.name] || pal.medium,
                              }} />
                            )}
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
// Guests by Group — grouped guest list with phone, table, menu
// ─────────────────────────────────────────────
type GuestItem = NonNullable<WeddingPDFData['guestList']>[number]

/** Format table display: "# - Name" when name exists, otherwise just "#" */
function fmtTable(g: GuestItem): string {
  if (!g.tableNumber) return '—'
  if (g.tableName) return `${g.tableNumber} - ${g.tableName}`
  return String(g.tableNumber)
}

function GuestsByGroupPages({ guestList, weddingName, pal, t, menuColorMap }: {
  guestList: GuestItem[]; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
}) {
  // Group by groupName (ungrouped = no group)
  const grouped = new Map<string, GuestItem[]>()
  for (const g of guestList) {
    const key = g.groupName || '—'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(g)
  }
  const groupEntries = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  // Paginate
  const GROUP_HEADER_H = 30
  const GUEST_ROW_H = 20
  const COL_HEADER_H = 20
  const GAP = 8
  const TITLE_AREA_H = 54
  const usableH = PAGE_H - CONTENT_TOP - CONTENT_BOTTOM - TITLE_AREA_H - 20 // extra margin
  const columns = [t('admin.summary.columns.guest'), t('admin.summary.pdf.phone'), t('admin.summary.pdf.table'), t('admin.summary.columns.menu')]
  const colFlex = [2.2, 1, 1.2, 1]

  type PageBlock = { groupName: string; guests: GuestItem[]; isStart: boolean }
  const pages: PageBlock[][] = []
  let currentPage: PageBlock[] = []
  let currentH = 0

  for (const [groupName, guests] of groupEntries) {
    const totalH = GROUP_HEADER_H + COL_HEADER_H + guests.length * GUEST_ROW_H + GAP
    if (currentH + totalH <= usableH) {
      currentPage.push({ groupName, guests, isStart: true })
      currentH += totalH
    } else {
      // Split across pages
      let idx = 0
      while (idx < guests.length) {
        const hdrH = GROUP_HEADER_H + COL_HEADER_H
        const availH = (currentPage.length === 0 ? usableH : usableH - currentH) - hdrH - GAP
        const fit = Math.max(1, Math.floor(availH / GUEST_ROW_H))
        const end = Math.min(idx + fit, guests.length)
        currentPage.push({ groupName, guests: guests.slice(idx, end), isStart: idx === 0 })
        currentH += hdrH + (end - idx) * GUEST_ROW_H + GAP
        idx = end
        if (idx < guests.length) { pages.push(currentPage); currentPage = []; currentH = 0 }
      }
    }
  }
  if (currentPage.length > 0) pages.push(currentPage)

  const truncStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <>
      {pages.map((pageBlocks, pi) => (
        <PageShell key={`gbg-${pi}`}>
          <div style={{ padding: `${CONTENT_TOP}px 56px ${CONTENT_BOTTOM}px 56px`, overflow: 'hidden', height: PAGE_H - 0, boxSizing: 'border-box' }}>
            {pi === 0 && (
              <>
                <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: pal.accent, marginBottom: 4 }}>
                  {t('admin.summary.sections.guestsByGroup')}
                </h2>
                <div style={{ height: 3, width: 44, backgroundColor: pal.accent, marginBottom: 20 }} />
              </>
            )}
            {pi > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 9, color: '#a0988c', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('admin.summary.sections.guestsByGroup')} — {pi + 1}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {pageBlocks.map((block, bi) => (
                <div key={`${block.groupName}-${bi}`} style={{ borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
                    backgroundColor: '#f5f2eb', border: '1px solid #e9e5e0',
                    borderRadius: '6px 6px 0 0', padding: '6px 12px 6px 16px',
                  }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: pal.accent }} />
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: pal.dark, paddingLeft: 4, ...truncStyle }}>
                      {block.groupName}
                    </span>
                    {block.isStart && (
                      <div style={{ backgroundColor: '#f8f6f2', borderRadius: 4, padding: '1px 8px', border: '1px solid #e9e5e0', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: pal.dark }}>
                          {grouped.get(block.groupName)?.length ?? block.guests.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ border: '1px solid #e9e5e0', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', backgroundColor: '#f8f6f2', borderBottom: '1px solid #e9e5e0' }}>
                      {columns.map((col, ci) => (
                        <span key={ci} style={{
                          flex: colFlex[ci], fontSize: 7, fontWeight: 700,
                          color: '#787167', padding: '4px 6px',
                          textTransform: 'uppercase', letterSpacing: 0.5, ...truncStyle,
                        }}>
                          {col}
                        </span>
                      ))}
                    </div>
                    {block.guests.map((guest, gi) => (
                      <div key={gi} style={{
                        display: 'flex', alignItems: 'center',
                        backgroundColor: gi % 2 === 0 ? '#fefdfb' : '#f8f6f2',
                        borderBottom: gi < block.guests.length - 1 ? '1px solid #f0ede6' : 'none',
                      }}>
                        <span style={{ flex: colFlex[0], fontSize: 9, fontWeight: 600, color: '#2c2c2c', padding: '3px 6px', ...truncStyle }}>{guest.name}</span>
                        <span style={{ flex: colFlex[1], fontSize: 8, color: '#787167', padding: '3px 6px', ...truncStyle }}>{guest.phone || '—'}</span>
                        <span style={{ flex: colFlex[2], fontSize: 8, color: '#2c2c2c', padding: '3px 6px', ...truncStyle }}>{fmtTable(guest)}</span>
                        <span style={{ flex: colFlex[3], fontSize: 8, color: guest.menuName ? (menuColorMap[guest.menuName] || pal.medium) : '#a0988c', padding: '3px 6px', fontWeight: guest.menuName ? 600 : 400, display: 'flex', alignItems: 'center', gap: 3, ...truncStyle }}>
                          {guest.menuName && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', flexShrink: 0, backgroundColor: menuColorMap[guest.menuName] || pal.medium }} />}
                          {guest.menuName || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
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
// Guests by Menu — grouped by menu with table and group columns
// ─────────────────────────────────────────────
function GuestsByMenuPages({ guestList, weddingName, pal, t, menuColorMap }: {
  guestList: GuestItem[]; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
}) {
  // Group by menuName (no menu = last)
  const grouped = new Map<string, GuestItem[]>()
  for (const g of guestList) {
    const key = g.menuName || '—'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(g)
  }
  const menuEntries = [...grouped.entries()].sort((a, b) => {
    if (a[0] === '—') return 1
    if (b[0] === '—') return -1
    return a[0].localeCompare(b[0])
  })

  const MENU_HEADER_H = 30
  const GUEST_ROW_H = 20
  const COL_HEADER_H = 20
  const GAP = 8
  const TITLE_AREA_H = 54
  const usableH = PAGE_H - CONTENT_TOP - CONTENT_BOTTOM - TITLE_AREA_H - 20
  const columns = [t('admin.summary.columns.guest'), t('admin.summary.columns.group'), t('admin.summary.pdf.table')]
  const colFlex = [2.2, 1.2, 1.2]

  type PageBlock = { menuName: string; guests: GuestItem[]; isStart: boolean }
  const pages: PageBlock[][] = []
  let currentPage: PageBlock[] = []
  let currentH = 0

  for (const [menuName, guests] of menuEntries) {
    const totalH = MENU_HEADER_H + COL_HEADER_H + guests.length * GUEST_ROW_H + GAP
    if (currentH + totalH <= usableH) {
      currentPage.push({ menuName, guests, isStart: true })
      currentH += totalH
    } else {
      let idx = 0
      while (idx < guests.length) {
        const hdrH = MENU_HEADER_H + COL_HEADER_H
        const availH = (currentPage.length === 0 ? usableH : usableH - currentH) - hdrH - GAP
        const fit = Math.max(1, Math.floor(availH / GUEST_ROW_H))
        const end = Math.min(idx + fit, guests.length)
        currentPage.push({ menuName, guests: guests.slice(idx, end), isStart: idx === 0 })
        currentH += hdrH + (end - idx) * GUEST_ROW_H + GAP
        idx = end
        if (idx < guests.length) { pages.push(currentPage); currentPage = []; currentH = 0 }
      }
    }
  }
  if (currentPage.length > 0) pages.push(currentPage)

  const truncStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <>
      {pages.map((pageBlocks, pi) => (
        <PageShell key={`gbm-${pi}`}>
          <div style={{ padding: `${CONTENT_TOP}px 56px ${CONTENT_BOTTOM}px 56px`, overflow: 'hidden', height: PAGE_H - 0, boxSizing: 'border-box' }}>
            {pi === 0 && (
              <>
                <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: pal.accent, marginBottom: 4 }}>
                  {t('admin.summary.sections.guestsByMenu')}
                </h2>
                <div style={{ height: 3, width: 44, backgroundColor: pal.accent, marginBottom: 20 }} />
              </>
            )}
            {pi > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 9, color: '#a0988c', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('admin.summary.sections.guestsByMenu')} — {pi + 1}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {pageBlocks.map((block, bi) => {
                const menuColor = block.menuName !== '—' ? (menuColorMap[block.menuName] || pal.accent) : '#a0988c'
                return (
                  <div key={`${block.menuName}-${bi}`} style={{ borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
                      backgroundColor: '#f5f2eb', border: '1px solid #e9e5e0',
                      borderRadius: '6px 6px 0 0', padding: '6px 12px 6px 16px',
                    }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: menuColor }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, paddingLeft: 4, overflow: 'hidden' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: menuColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: pal.dark, ...truncStyle }}>{block.menuName}</span>
                      </div>
                      {block.isStart && (
                        <div style={{ backgroundColor: '#f8f6f2', borderRadius: 4, padding: '1px 8px', border: '1px solid #e9e5e0', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: pal.dark }}>
                            {grouped.get(block.menuName)?.length ?? block.guests.length}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ border: '1px solid #e9e5e0', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', backgroundColor: '#f8f6f2', borderBottom: '1px solid #e9e5e0' }}>
                        {columns.map((col, ci) => (
                          <span key={ci} style={{
                            flex: colFlex[ci], fontSize: 7, fontWeight: 700,
                            color: '#787167', padding: '4px 6px',
                            textTransform: 'uppercase', letterSpacing: 0.5, ...truncStyle,
                          }}>
                            {col}
                          </span>
                        ))}
                      </div>
                      {block.guests.map((guest, gi) => (
                        <div key={gi} style={{
                          display: 'flex', alignItems: 'center',
                          backgroundColor: gi % 2 === 0 ? '#fefdfb' : '#f8f6f2',
                          borderBottom: gi < block.guests.length - 1 ? '1px solid #f0ede6' : 'none',
                        }}>
                          <span style={{ flex: colFlex[0], fontSize: 9, fontWeight: 600, color: '#2c2c2c', padding: '3px 6px', ...truncStyle }}>{guest.name}</span>
                          <span style={{ flex: colFlex[1], fontSize: 8, color: '#787167', padding: '3px 6px', ...truncStyle }}>{guest.groupName || '—'}</span>
                          <span style={{ flex: colFlex[2], fontSize: 8, color: '#2c2c2c', padding: '3px 6px', ...truncStyle }}>{fmtTable(guest)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <PageFooter weddingName={weddingName} />
        </PageShell>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────
// Guests by Table — same as seating but with i18n-aware headers
// ─────────────────────────────────────────────
function GuestsByTablePages({ seating, weddingName, pal, t, menuColorMap }: {
  seating: WeddingPDFData['seating']; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
}) {
  // Reuse the existing SeatingPages for "by table" view
  return <SeatingPages seating={seating} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
}

// ─────────────────────────────────────────────
// Declined Guests Page — simple name list
// ─────────────────────────────────────────────
function DeclinedGuestsPage({ declinedNames, weddingName, pal, t }: {
  declinedNames: string[]; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  const sorted = [...declinedNames].sort((a, b) => a.localeCompare(b))
  const ROW_H = 20
  const TITLE_AREA_H = 54
  const usableH = PAGE_H - CONTENT_TOP - CONTENT_BOTTOM - TITLE_AREA_H - 20
  const COLS = 2
  const perCol = Math.floor(usableH / ROW_H)
  const perPage = perCol * COLS

  const pages: string[][] = []
  for (let i = 0; i < sorted.length; i += perPage) {
    pages.push(sorted.slice(i, i + perPage))
  }

  const truncStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <>
      {pages.map((pageNames, pi) => {
        const col1 = pageNames.slice(0, perCol)
        const col2 = pageNames.slice(perCol)
        return (
          <PageShell key={`declined-${pi}`}>
            <div style={{ padding: `${CONTENT_TOP}px 56px ${CONTENT_BOTTOM}px 56px`, overflow: 'hidden', height: PAGE_H - 0, boxSizing: 'border-box' }}>
              {pi === 0 && (
                <>
                  <h2 style={{ fontFamily: "'Macker', serif", fontSize: 22, color: '#a0988c', marginBottom: 4 }}>
                    {t('admin.summary.pdf.declinedGuests')}
                  </h2>
                  <div style={{ height: 3, width: 44, backgroundColor: '#d4cfc8', marginBottom: 6 }} />
                  <p style={{ fontSize: 10, color: '#a0988c', marginBottom: 16 }}>
                    {sorted.length} {sorted.length === 1 ? t('admin.summary.pdf.guests.one') : t('admin.summary.pdf.guests.other')}
                  </p>
                </>
              )}
              {pi > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 9, color: '#a0988c', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {t('admin.summary.pdf.declinedGuests')} — {pi + 1}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 20 }}>
                {[col1, col2].map((col, ci) => (
                  <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {col.map((name, ni) => (
                      <div key={ni} style={{
                        padding: '3px 6px',
                        fontSize: 9,
                        color: '#787167',
                        borderBottom: ni < col.length - 1 ? '1px solid #f0ede6' : 'none',
                        backgroundColor: ni % 2 === 0 ? '#fefdfb' : '#f8f6f2',
                        ...truncStyle,
                      }}>
                        {name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <PageFooter weddingName={weddingName} />
          </PageShell>
        )
      })}
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
          fontFamily: "'Macker', serif", fontSize: 26, color: pal.accent,
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
// Suppliers Page
// ─────────────────────────────────────────────
// DB category values match i18n keys directly
const VALID_SUPPLIER_CATEGORIES = new Set([
  'catering', 'photography', 'videography', 'music', 'flowers', 'venue',
  'transport', 'decoration', 'cake', 'beauty', 'officiant', 'lighting', 'other',
])

function getSupplierCategoryLabel(category: string, t: (k: string) => string): string {
  const key = VALID_SUPPLIER_CATEGORIES.has(category) ? category : 'other'
  return t(`admin.suppliers.categories.${key}`)
}

function SuppliersPage({ suppliers, weddingName, pal, t, showFinancial = true }: {
  suppliers: NonNullable<WeddingPDFData['suppliers']>; weddingName: string; pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string; showFinancial?: boolean
}) {
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  const totalBudget = suppliers.reduce((s, sup) => s + (sup.total_amount ?? 0), 0)
  const totalCovered = suppliers.reduce((s, sup) => s + (sup.covered_amount ?? 0), 0)

  // Group suppliers by category for better organization
  const grouped = suppliers.reduce<Record<string, typeof suppliers>>((acc, sup) => {
    const cat = sup.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(sup)
    return acc
  }, {})
  const categories = Object.keys(grouped).sort((a, b) => {
    const order = ['venue', 'catering', 'photographer', 'videographer', 'florist', 'dj', 'band', 'cake', 'decoration', 'hair_makeup', 'officiant', 'transportation', 'other']
    return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
  })

  // Build flat list with category headers for pagination
  type Row = { type: 'category'; category: string; count: number } | { type: 'supplier'; supplier: typeof suppliers[number]; index: number }
  const rows: Row[] = []
  categories.forEach(cat => {
    rows.push({ type: 'category', category: cat, count: grouped[cat].length })
    grouped[cat].forEach((sup, i) => rows.push({ type: 'supplier', supplier: sup, index: i }))
  })

  // Estimate row heights and paginate (header area ~120px, each supplier ~85-120px depending on financial, category header ~28px)
  const PAGE_CONTENT_H = 980
  const HEADER_H = showFinancial ? 140 : 60
  const CATEGORY_ROW_H = 32
  const SUPPLIER_ROW_H = showFinancial ? 110 : 60
  const CONTINUATION_HEADER_H = 40

  type PageContent = { rows: Row[]; isFirst: boolean }
  const pages: PageContent[] = []
  let currentPage: Row[] = []
  let currentH = HEADER_H

  for (const row of rows) {
    const rowH = row.type === 'category' ? CATEGORY_ROW_H : SUPPLIER_ROW_H
    if (currentH + rowH > PAGE_CONTENT_H && currentPage.length > 0) {
      pages.push({ rows: currentPage, isFirst: pages.length === 0 })
      currentPage = []
      currentH = CONTINUATION_HEADER_H
    }
    currentPage.push(row)
    currentH += rowH
  }
  if (currentPage.length > 0) pages.push({ rows: currentPage, isFirst: pages.length === 0 })

  return (
    <>
      {pages.map((page, pi) => (
        <PageShell key={pi}>
          <div style={{ padding: '48px 56px 60px 56px' }}>
            {page.isFirst && (
              <>
                <h2 style={{ fontFamily: "'Macker', serif", fontSize: 26, color: pal.accent, marginBottom: 2, letterSpacing: 1 }}>
                  {t('admin.summary.sections.suppliers')}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showFinancial ? 16 : 20 }}>
                  <Ornament color={pal.accent} width={100} />
                  <span style={{ fontSize: 9, color: '#a0988c', letterSpacing: 0.5 }}>
                    {suppliers.length} {t(`admin.summary.pdf.suppliers.${suppliers.length === 1 ? 'one' : 'other'}`)} · {categories.length} {t(`admin.summary.pdf.categories.${categories.length === 1 ? 'one' : 'other'}`)}
                  </span>
                </div>
                {/* Summary totals row — only when financial is shown */}
                {showFinancial && (
                  <div className="flex" style={{ gap: 12, marginBottom: 22 }}>
                    {[
                      { label: t('admin.suppliers.stats.total'), value: String(suppliers.length), color: pal.accent },
                      { label: t('admin.suppliers.stats.budget'), value: fmt(totalBudget), color: pal.accent },
                      { label: t('admin.suppliers.stats.covered'), value: fmt(totalCovered), color: '#22c55e' },
                      { label: t('admin.suppliers.stats.remaining'), value: fmt(totalBudget - totalCovered), color: totalBudget - totalCovered > 0 ? '#e11d48' : '#22c55e' },
                    ].map((stat, i) => (
                      <div key={i} style={{ flex: 1, backgroundColor: `${stat.color}10`, borderRadius: 8, padding: '10px 12px', borderBottom: `3px solid ${stat.color}` }}>
                        <span style={{ fontSize: 8, color: '#a0988c', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 2 }}>{stat.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: pal.dark, fontFamily: "'Macker', serif" }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {!page.isFirst && (
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Macker', serif", fontSize: 18, color: pal.accent, marginBottom: 4, letterSpacing: 1 }}>
                  {t('admin.summary.sections.suppliers')}
                  <span style={{ fontSize: 11, color: '#a0988c', fontWeight: 400, marginLeft: 8 }}>({pi + 1})</span>
                </h2>
                <div style={{ height: 3, width: 44, backgroundColor: pal.accent, borderRadius: 2 }} />
              </div>
            )}

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {page.rows.map((row, ri) => {
                if (row.type === 'category') {
                  return (
                    <div key={`cat-${row.category}`} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginTop: ri > 0 ? 8 : 0, marginBottom: 2,
                      paddingBottom: 4, borderBottom: `1.5px solid ${pal.accent}30`,
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: `${pal.accent}30`, border: `1.5px solid ${pal.accent}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: pal.accentDark, flexShrink: 0 }}>
                        {getSupplierCategoryLabel(row.category, t).charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pal.dark, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {getSupplierCategoryLabel(row.category, t)}
                      </span>
                      <span style={{ fontSize: 9, color: '#a0988c', marginLeft: 4 }}>({row.count})</span>
                    </div>
                  )
                }

                const sup = row.supplier
                const pct = sup.total_amount > 0 ? Math.min(100, (sup.covered_amount / sup.total_amount) * 100) : 0
                const fullyPaid = sup.total_amount > 0 && sup.covered_amount >= sup.total_amount

                return (
                  <div key={sup.id} style={{
                    borderRadius: 8, padding: showFinancial ? '10px 14px' : '8px 14px',
                    backgroundColor: row.index % 2 === 0 ? '#fefdfb' : '#f8f6f2',
                    border: '1px solid #eae7e1',
                    borderLeft: showFinancial ? `3px solid ${fullyPaid ? '#22c55e' : pal.accent}` : `3px solid ${pal.accent}`,
                  }}>
                    {/* Top row: name + financial */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFinancial ? 6 : 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pal.dark, letterSpacing: 0.3 }}>{sup.name}</span>
                      {showFinancial && sup.total_amount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {fullyPaid && (
                            <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 9, backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              ✓ {t('admin.suppliers.fullyPaid')}
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, color: fullyPaid ? '#16a34a' : pal.dark, fontFamily: "'Macker', serif" }}>
                            {fmt(sup.covered_amount)} / {fmt(sup.total_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Progress bar */}
                    {showFinancial && sup.total_amount > 0 && (
                      <div style={{ height: 4, backgroundColor: '#e9e5e0', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                        <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, backgroundColor: fullyPaid ? '#22c55e' : pal.accent, transition: 'width 0.3s' }} />
                      </div>
                    )}
                    {/* Contact + notes in a compact row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {sup.contact_info && (
                        <span style={{ fontSize: 9, color: '#787167', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: pal.accent, flexShrink: 0, opacity: 0.7, display: 'inline-block' }} />
                          {sup.contact_info}
                        </span>
                      )}
                      {sup.notes && (
                        <span style={{ fontSize: 9, fontStyle: 'italic', color: '#a0988c', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#a0988c', flexShrink: 0, opacity: 0.6, display: 'inline-block' }} />
                          {sup.notes}
                        </span>
                      )}
                    </div>
                    {/* Payments — only when financial is shown */}
                    {showFinancial && sup.payments?.length > 0 && (
                      <div style={{ marginTop: 6, paddingTop: 5, borderTop: '1px dashed #e9e5e0' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {sup.payments.map((pay) => (
                            <span key={pay.id} style={{
                              fontSize: 8, backgroundColor: '#f0ede6', borderRadius: 4,
                              padding: '2px 6px', color: '#5c5550',
                            }}>
                              {pay.payment_date ? pay.payment_date.split('T')[0] : '—'}: <strong>{fmt(pay.amount)}</strong>
                              {pay.notes ? ` · ${pay.notes}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <PageFooter weddingName={weddingName} />
        </PageShell>
      ))}
    </>
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
    'La plataforma de gestión de bodas',
  ],
  en: [
    'This document was generated with OhMyWedding',
    'The wedding management platform',
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
  const menuColorMap = buildMenuColorMap(data.menus)
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

  // Plural helper
  const pl = (count: number, key: string) => `${count} ${t(`admin.summary.pdf.${key}.${count === 1 ? 'one' : 'other'}`)}`

  // Filter guests: confirmed only for main views, collect declined names
  // Exclude guests with no table AND no menu assignment
  const confirmedGuestList = data.guestList?.filter(g => g.status === 'confirmed' && (g.tableName || g.menuName)) ?? []
  const declinedNames = data.guestList?.filter(g => g.status === 'declined').map(g => g.name) ?? []

  // Filter seating: only confirmed guests per table, skip empty tables
  const confirmedSeating = data.seating
    .map(table => ({
      ...table,
      guests: table.guests.filter(g => g.status === 'confirmed'),
      occupancy: table.guests.filter(g => g.status === 'confirmed').length,
    }))
    .filter(table => table.guests.length > 0)

  // Whether any guest section is shown (for declined list placement)
  const anyGuestSection = (show('guestsByGroup') && confirmedGuestList.length > 0) ||
    (show('guestsByMenu') && confirmedGuestList.length > 0 && data.menus.length > 0) ||
    (show('guestsByTable') && confirmedSeating.length > 0)

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
          hasDeclinedGuests={declinedNames.length > 0}
        />
      )}
      {show('menus') && data.menus.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.menus')}
            subtitle={pl(data.menus.length, 'menus')}
            iconType="menus" pal={pal} weddingName={weddingName}
          />
          <MenusPage menus={data.menus} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
        </>
      )}
      {show('guestsByGroup') && confirmedGuestList.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.guestsByGroup')}
            subtitle={`${pl(confirmedGuestList.length, 'guests')} ${t('admin.summary.pdf.confirmedOnly')} · ${pl(new Set(confirmedGuestList.map(g => g.groupName || '—')).size, 'groups')}`}
            iconType="seating" pal={pal} weddingName={weddingName}
          />
          <GuestsByGroupPages guestList={confirmedGuestList} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
        </>
      )}
      {show('guestsByMenu') && confirmedGuestList.length > 0 && data.menus.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.guestsByMenu')}
            subtitle={`${pl(confirmedGuestList.length, 'guests')} ${t('admin.summary.pdf.confirmedOnly')} · ${pl(data.menus.length, 'menus')}`}
            iconType="menus" pal={pal} weddingName={weddingName}
          />
          <GuestsByMenuPages guestList={confirmedGuestList} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
        </>
      )}
      {show('guestsByTable') && confirmedSeating.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.guestsByTable')}
            subtitle={`${pl(confirmedSeating.length, 'tables')} · ${pl(confirmedSeating.reduce((sum, t) => sum + t.guests.length, 0), 'guests')} ${t('admin.summary.pdf.confirmedOnly')}`}
            iconType="seating" pal={pal} weddingName={weddingName}
          />
          <GuestsByTablePages seating={confirmedSeating} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
        </>
      )}
      {/* Declined guests list — shown after any guest view */}
      {anyGuestSection && declinedNames.length > 0 && (
        <DeclinedGuestsPage declinedNames={declinedNames} weddingName={weddingName} pal={pal} t={t} />
      )}
      {show('itinerary') && data.itinerary.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.itinerary')}
            subtitle={pl(data.itinerary.length, 'events')}
            iconType="itinerary" pal={pal} weddingName={weddingName}
          />
          <ItineraryPage itinerary={data.itinerary} locale={locale} weddingName={weddingName} pal={pal} t={t} />
        </>
      )}
      {show('suppliers') && data.suppliers && data.suppliers.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.suppliers')}
            subtitle={pl(data.suppliers.length, 'suppliers')}
            iconType="suppliers" pal={pal} weddingName={weddingName}
          />
          <SuppliersPage suppliers={data.suppliers} weddingName={weddingName} pal={pal} t={t} showFinancial={data.showSuppliersFinancial !== false} />
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
        coverImageUrl={data.closingImageUrl || data.coverImageUrl} locale={locale}
      />
    </div>
  )
}