'use client'

import React from 'react'
import {
  Document, Page, View, Text, Image, Font, Svg, Path, Circle, Polyline, Rect,
  StyleSheet, pdf,
} from '@react-pdf/renderer'

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

// ─────────────────────────────────────────────
// Brand palette (dynamic from wedding colors)
// ─────────────────────────────────────────────
type BrandPalette = {
  dark: string        // cover bg, section divider bg
  medium: string      // mid tone
  accent: string      // decorative lines, ornaments
  accentLight: string
  accentDark: string
  onDark: string      // text on dark backgrounds
  onDarkMuted: string
  onDarkSubtle: string
}

function buildPalette(primary = '#420c14', _secondary = '#732c2c', accent = '#DDA46F'): BrandPalette {
  const lum = luminance(primary)
  const isLight = lum > 0.55
  const dark = isLight ? darkenHex(primary, 0.45) : darkenHex(primary, 0.1)
  const medium = isLight ? darkenHex(primary, 0.25) : lightenHex(primary, 0.18)
  return {
    dark,
    medium,
    accent,
    accentLight: lightenHex(accent, 0.22),
    accentDark: darkenHex(accent, 0.15),
    onDark: '#ffffff',
    onDarkMuted: lightenHex(primary, 0.52),
    onDarkSubtle: lightenHex(primary, 0.32),
  }
}

// ─────────────────────────────────────────────
// Font registration (lazy, runs once)
// ─────────────────────────────────────────────
let _fontsRegistered = false
let _logoWhiteUrl = ''
let _logoGoldUrl = ''

function ensureFonts(origin: string) {
  if (_fontsRegistered) return
  _fontsRegistered = true
  Font.register({ family: 'Sinera', src: `${origin}/fonts/sinera/Sinera.ttf` })
  Font.register({ family: 'Macker', src: `${origin}/fonts/Macker.ttf` })
  Font.registerHyphenationCallback(word => [word])
  _logoWhiteUrl = `${origin}/images/logos/OMW%20Logo%20White.png`
  _logoGoldUrl = `${origin}/images/logos/OMW%20Logo%20Gold.png`
}

// ─────────────────────────────────────────────
// Fixed structural colors (not brand-impacted)
// ─────────────────────────────────────────────
const C = {
  warmWhite: '#fefdfb',
  cream:     '#f5f2eb',
  muted:     '#f8f6f2',
  border:    '#e9e5e0',
  charcoal:  '#2c2c2c',
  textMuted: '#787167',
  textLight: '#a0988c',
  white:     '#ffffff',
}

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

// ─────────────────────────────────────────────
// StyleSheet (structural / non-brand-colored)
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  // Pages
  page: {
    backgroundColor: C.warmWhite,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.charcoal,
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 44,
  },
  tocPage: {
    backgroundColor: C.warmWhite,
    fontFamily: 'Helvetica',
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 44,
  },

  // Card
  card: {
    backgroundColor: C.warmWhite,
    borderRadius: 4,
    borderWidth: 0.7,
    borderColor: C.border,
    marginBottom: 8,
  },
  cardCream: {
    backgroundColor: C.cream,
    borderRadius: 4,
    borderWidth: 0.7,
    borderColor: C.border,
    marginBottom: 8,
  },

  // Typography
  body: { fontSize: 8, fontFamily: 'Helvetica', color: C.charcoal, lineHeight: 1.5 },
  small: { fontSize: 6.5, fontFamily: 'Helvetica', color: C.textMuted },
  italic: { fontSize: 8, fontFamily: 'Helvetica-Oblique', color: C.textMuted },

  // Section heading
  sectionName: { fontSize: 15, fontFamily: 'Macker', color: C.charcoal, marginBottom: 2 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 44,
    right: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, fontFamily: 'Helvetica', color: C.textLight },
  footerPage: { fontSize: 6.5, fontFamily: 'Helvetica', color: C.textLight },
})

// ─────────────────────────────────────────────
// Lucide icon SVG paths
// ─────────────────────────────────────────────
function LucideIcon({ type, size = 16, color }: { type: string; size?: number; color: string }) {
  const vb = `0 0 24 24`
  const stroke = color
  const sw = '1.8'
  const fill = 'none'
  const lc = 'round'
  const lj = 'round'

  const icons: Record<string, React.ReactNode> = {
    menus: (
      <Svg width={size} height={size} viewBox={vb}>
        <Path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Path d="m2.1 21.8 6.4-6.3" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
    seating: (
      <Svg width={size} height={size} viewBox={vb}>
        <Rect x="3" y="3" width="7" height="7" rx="1" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Rect x="14" y="3" width="7" height="7" rx="1" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Rect x="14" y="14" width="7" height="7" rx="1" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Rect x="3" y="14" width="7" height="7" rx="1" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
    itinerary: (
      <Svg width={size} height={size} viewBox={vb}>
        <Circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth={sw} fill={fill}/>
        <Polyline points="12 6 12 12 16 14" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
    venue: (
      <Svg width={size} height={size} viewBox={vb}>
        <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Circle cx="12" cy="10" r="3" stroke={stroke} strokeWidth={sw} fill={fill}/>
      </Svg>
    ),
    users: (
      <Svg width={size} height={size} viewBox={vb}>
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Circle cx="9" cy="7" r="4" stroke={stroke} strokeWidth={sw} fill={fill}/>
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
    calendar: (
      <Svg width={size} height={size} viewBox={vb}>
        <Rect x="3" y="4" width="18" height="18" rx="2" stroke={stroke} strokeWidth={sw} fill={fill}/>
        <Path d="M8 2v4M16 2v4M3 10h18" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
    fileText: (
      <Svg width={size} height={size} viewBox={vb}>
        <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
        <Path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
    check: (
      <Svg width={size} height={size} viewBox={vb}>
        <Path d="M20 6 9 17l-5-5" stroke={stroke} strokeWidth={sw} fill={fill} strokeLinecap={lc} strokeLinejoin={lj}/>
      </Svg>
    ),
  }
  return icons[type] ?? null
}

// ─────────────────────────────────────────────
// Shared decorative components
// ─────────────────────────────────────────────

/** Line — circle dot — Line ornament (no Unicode characters) */
function Ornament({ width = 80, color }: { width?: number; color: string }) {
  const half = (width - 16) / 2
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 7 }}>
      <View style={{ height: 0.7, backgroundColor: color, width: half }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginHorizontal: 5 }} />
      <View style={{ height: 0.7, backgroundColor: color, width: half }} />
    </View>
  )
}

function AccentBar({ color, bottom = false }: { color: string; bottom?: boolean }) {
  return (
    <View style={{
      position: 'absolute', [bottom ? 'bottom' : 'top']: 0,
      left: 0, right: 0, height: 3, backgroundColor: color,
    }} />
  )
}

function LeftRule({ color }: { color: string }) {
  return <View style={{ position: 'absolute', top: 0, bottom: 0, left: 42, width: 0.8, backgroundColor: color }} />
}

function PageFooter({ weddingName, accentColor, onDark = false }: { weddingName: string; accentColor: string; onDark?: boolean }) {
  const textColor = onDark ? 'rgba(255,255,255,0.45)' : C.textLight
  const logoSrc = onDark ? _logoWhiteUrl : _logoGoldUrl
  return (
    <View style={s.footer} fixed>
      <View style={{ height: 0.5, backgroundColor: accentColor, opacity: onDark ? 0.5 : 0.35, position: 'absolute', top: 0, left: 0, right: 0 }} />
      <Text style={[s.footerText, { color: textColor }]}>{weddingName}</Text>
      <Text style={[s.footerPage, { color: textColor }]} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      {logoSrc ? (
        <Image src={logoSrc} style={{ width: 32, height: 20, opacity: 0.7 }} />
      ) : (
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Oblique', color: accentColor }}>ohmy.wedding</Text>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────
// Cover Page
// ─────────────────────────────────────────────
function CoverPage({
  partnerNames, date, ceremonyVenue, receptionVenue, coverImageUrl, pal,
}: {
  partnerNames: string
  date?: string
  ceremonyVenue?: string
  receptionVenue?: string
  coverImageUrl?: string
  pal: BrandPalette
}) {
  return (
    // A4 = 595.28 × 841.89 pt
    // All children are absolutely positioned so nothing creates page overflow
    <Page size="A4" style={{ backgroundColor: pal.dark, width: 595.28, height: 841.89 }}>

      {/* Background image — absolute, does not affect flow */}
      {coverImageUrl && (
        <Image src={coverImageUrl} style={{
          position: 'absolute', top: 0, left: 0,
          width: 595.28, height: 841.89,
          objectFit: 'cover',
        }} />
      )}

      {/* Color overlay layers — heavier when no image */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: pal.dark, opacity: coverImageUrl ? 0.6 : 0 }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 350, backgroundColor: pal.dark, opacity: coverImageUrl ? 0.45 : 0 }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130, backgroundColor: pal.dark, opacity: coverImageUrl ? 0.35 : 0 }} />

      {/* Accent bars */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: pal.accent }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: pal.accent }} />

      {/* Top-right label */}
      <View style={{ position: 'absolute', top: 30, right: 48 }}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5 }}>WEDDING DAY SUMMARY</Text>
      </View>

      {/* Center content — absolutely positioned, vertically centered */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 60, paddingBottom: 50 }}>
        <Ornament width={120} color={pal.accent} />
        <Text style={{ fontSize: 36, fontFamily: 'Macker', color: pal.onDark, textAlign: 'center', letterSpacing: 1, lineHeight: 1.1 }}>
          {partnerNames}
        </Text>
        <Ornament width={120} color={pal.accent} />
        {date && (
          <Text style={{ fontSize: 11, fontFamily: 'Sinera', color: pal.accent, textAlign: 'center', marginTop: 8 }}>
            {date}
          </Text>
        )}
        {(ceremonyVenue || receptionVenue) && (
          <View style={{ marginTop: 14, alignItems: 'center' }}>
            {ceremonyVenue && (
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Oblique', color: pal.onDarkMuted, textAlign: 'center', marginBottom: 2 }}>
                {ceremonyVenue}
              </Text>
            )}
            {receptionVenue && receptionVenue !== ceremonyVenue && (
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Oblique', color: pal.onDarkMuted, textAlign: 'center' }}>
                {receptionVenue}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Consistent footer — logo at bottom right, same position as all pages */}
      <PageFooter weddingName={partnerNames} accentColor={pal.accent} onDark />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Table of Contents Page
// ─────────────────────────────────────────────
interface TocEntry { title: string; page: number }
function TocPage({ entries, weddingName, pal }: { entries: TocEntry[]; weddingName: string; pal: BrandPalette }) {
  return (
    <Page size="A4" style={s.tocPage}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />
      <LeftRule color={pal.dark} />

      <View style={{ paddingLeft: 14 }}>
        <Text style={[s.sectionName, { marginBottom: 4 }]}>Contents</Text>
        <View style={{ height: 1, backgroundColor: pal.accent, width: 40, marginBottom: 14 }} />
      </View>

      {entries.map((entry, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, paddingLeft: 14 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica', color: C.charcoal, flex: 1 }}>{entry.title}</Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: C.border, marginHorizontal: 6, marginBottom: 2 }} />
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: pal.dark, textAlign: 'right' }}>
            {entry.page}
          </Text>
        </View>
      ))}

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Section Divider Page
// ─────────────────────────────────────────────
const SECTION_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI']
function SectionDividerPage({ title, subtitle, iconType, index, pal, weddingName }: {
  title: string; subtitle?: string; iconType: string; index: number; pal: BrandPalette; weddingName: string
}) {
  // Lightly tinted bg — color hint without full dark
  const tintedBg = lightenHex(pal.dark, 0.88)
  return (
    <Page size="A4" style={{ backgroundColor: tintedBg, justifyContent: 'center', alignItems: 'center' }}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />
      {/* Subtle left accent strip */}
      <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: pal.accent, opacity: 0.6 }} />

      {/* Watermark numeral */}
      <View style={{ position: 'absolute', bottom: 50, right: 40, opacity: 0.06 }}>
        <Text style={{ fontSize: 180, fontFamily: 'Macker', color: pal.dark }}>
          {SECTION_NUMERALS[index % SECTION_NUMERALS.length]}
        </Text>
      </View>

      {/* Centered content */}
      <View style={{ alignItems: 'center', paddingHorizontal: 70 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: pal.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 6, opacity: 0.9 }}>
          <LucideIcon type={iconType} size={22} color={pal.accent} />
        </View>
        <Ornament width={80} color={pal.accent} />
        <Text style={{ fontSize: 24, fontFamily: 'Macker', color: pal.dark, textAlign: 'center', letterSpacing: 1 }}>
          {title}
        </Text>
        <Ornament width={80} color={pal.accent} />
        {subtitle && (
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Oblique', color: darkenHex(tintedBg, 0.45), textAlign: 'center', marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Executive Overview Page
// ─────────────────────────────────────────────
function OverviewPage({ stats, wedding, locale, weddingName, pal, t }: {
  stats: { confirmed: number; totalTables: number; totalMenus: number }
  wedding: {
    wedding_date?: string
    ceremony_venue_name?: string; reception_venue_name?: string
    ceremony_venue_address?: string; reception_venue_address?: string
  }
  locale: string
  weddingName: string
  pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const statCards = [
    { value: stats.confirmed, label: t('admin.summary.stats.confirmed'), icon: 'users' as const },
    { value: stats.totalTables, label: t('admin.summary.stats.tables'), icon: 'seating' as const },
    { value: stats.totalMenus, label: t('admin.summary.stats.menus'), icon: 'menus' as const },
  ]

  const detPairs: [string, string][] = []
  if (wedding.wedding_date)         detPairs.push([t('admin.summary.weddingDate'), formatDate(wedding.wedding_date)])
  if (wedding.ceremony_venue_name)  detPairs.push([t('admin.summary.ceremony'), wedding.ceremony_venue_name])
  if (wedding.reception_venue_name && wedding.reception_venue_name !== wedding.ceremony_venue_name)
    detPairs.push([t('admin.summary.reception'), wedding.reception_venue_name])
  if (wedding.ceremony_venue_address) detPairs.push(['', wedding.ceremony_venue_address])

  return (
    <Page size="A4" style={s.page}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />
      <LeftRule color={pal.dark} />

      <View style={{ paddingLeft: 14 }}>
        <Text style={s.sectionName}>{t('admin.summary.sections.overview')}</Text>
        <View style={{ height: 1, backgroundColor: pal.accent, width: 40, marginBottom: 12 }} />
      </View>

      {/* Stat cards row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, paddingLeft: 14 }}>
        {statCards.map((card, i) => (
          <View key={i} style={{
            flex: 1, backgroundColor: C.warmWhite, borderRadius: 4,
            borderWidth: 0.7, borderColor: C.border, padding: 10,
          }}>
            <View style={{ height: 2, backgroundColor: pal.dark, borderRadius: 1, marginBottom: 8 }} />
            <View style={{ alignItems: 'center' }}>
              <LucideIcon type={card.icon} size={18} color={pal.accent} />
              <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: pal.dark, marginTop: 4 }}>
                {String(card.value)}
              </Text>
              <Text style={{ fontSize: 6, fontFamily: 'Helvetica', color: C.textMuted, textAlign: 'center', letterSpacing: 0.5 }}>
                {card.label.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Date / venue detail card */}
      {detPairs.length > 0 && (
        <View style={[s.cardCream, { padding: 14, paddingLeft: 14, marginLeft: 14 }]}>
          {detPairs.map(([label, value], i) => (
            <View key={i} style={{ marginBottom: i < detPairs.length - 1 ? 8 : 0 }}>
              {label !== '' && (
                <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: pal.accent, letterSpacing: 0.8, marginBottom: 1 }}>
                  {label.toUpperCase()}
                </Text>
              )}
              <Text style={[s.body, { marginTop: 1 }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Menus Pages
// ─────────────────────────────────────────────
function MenusPage({ menus, weddingName, pal, t, menuColorMap }: {
  menus: Array<{
    id: string; name: string; description: string | null; count: number
    courses: Array<{ id: string; course_number: number; course_name: string | null; dish_name: string | null }>
  }>
  weddingName: string
  pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
}) {
  return (
    <Page size="A4" style={s.page}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />
      <LeftRule color={pal.dark} />

      <View style={{ paddingLeft: 14 }}>
        <Text style={s.sectionName}>{t('admin.summary.sections.menus')}</Text>
        <View style={{ height: 1, backgroundColor: pal.accent, width: 40, marginBottom: 12 }} />
      </View>

      {menus.map((menu, mi) => {
        const menuColor = menuColorMap[menu.name] || pal.accent
        return (
        <View key={menu.id} wrap={false} style={{
          backgroundColor: C.warmWhite,
          borderRadius: 4,
          borderWidth: 0.7,
          borderColor: C.border,
          marginBottom: 10,
          marginLeft: 14,
          overflow: 'hidden',
        }}>
          {/* Accent left bar — unique per menu */}
          <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: menuColor }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, paddingLeft: 14 }}>
            {/* Color-coded index badge */}
            <View style={{
              width: 20, height: 20, borderRadius: 10, backgroundColor: menuColor,
              alignItems: 'center', justifyContent: 'center', marginRight: 8,
            }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>{String(mi + 1)}</Text>
            </View>
            {/* Name */}
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.charcoal, flex: 1 }}>{menu.name}</Text>
            {/* Guest count badge */}
            <View style={{
              backgroundColor: C.muted, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.charcoal }}>{String(menu.count)}</Text>
              <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica', color: C.textLight }}>guests</Text>
            </View>
          </View>

          {/* Description */}
          {menu.description && (
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Oblique', color: C.textMuted, paddingHorizontal: 14, paddingBottom: 6 }}>
              {menu.description}
            </Text>
          )}

          {/* Courses */}
          {menu.courses.length > 0 && (
            <View style={{ borderTopWidth: 0.5, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopColor: C.border }}>
              {menu.courses.map((course, ci) => (
                <View key={course.id} style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 5, paddingLeft: 14, paddingRight: 10,
                  borderTopWidth: 0, borderRightWidth: 0,
                  borderBottomWidth: ci < menu.courses.length - 1 ? 0.3 : 0,
                  borderLeftWidth: 0, borderBottomColor: C.border,
                  backgroundColor: ci % 2 === 0 ? C.warmWhite : C.muted,
                }}>
                  {/* Course number — tinted with menu color */}
                  <View style={{
                    width: 16, height: 16, borderRadius: 8, backgroundColor: lightenHex(menuColor, 0.85),
                    alignItems: 'center', justifyContent: 'center', marginRight: 8,
                  }}>
                    <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: menuColor }}>
                      {String(course.course_number)}
                    </Text>
                  </View>
                  {/* Course name */}
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.charcoal }}>
                    {course.course_name || `${t('admin.dishes.course')} ${course.course_number}`}
                  </Text>
                  {/* Dish name */}
                  {course.dish_name && (
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica', color: C.textMuted, marginLeft: 4 }}>
                      — {course.dish_name}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        )
      })}

      {/* Menu legend */}
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap', gap: 8,
        marginLeft: 14, marginTop: 4, marginBottom: 12,
        padding: 8, backgroundColor: C.cream, borderRadius: 3,
        borderWidth: 0.5, borderColor: C.border,
      }}>
        {menus.map((menu) => {
          const mc = menuColorMap[menu.name] || pal.accent
          return (
            <View key={menu.id} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mc, marginRight: 4 }} />
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica', color: C.charcoal }}>{menu.name}</Text>
            </View>
          )
        })}
      </View>

      {/* Total row */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.cream, borderRadius: 3, padding: 10, marginLeft: 14,
        borderWidth: 0.5, borderColor: C.border,
      }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.charcoal, flex: 1 }}>
          {t('admin.summary.totalAssigned')}
        </Text>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: pal.dark }}>
          {String(menus.reduce((s, m) => s + m.count, 0))}
        </Text>
      </View>

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Seating Pages
// ─────────────────────────────────────────────
function SeatingPage({ seating, weddingName, pal, t, menuColorMap }: {
  seating: Array<{
    tableNumber: number; tableName: string; shape: string; capacity: number; occupancy: number
    guests: Array<{ name: string; groupName: string | null; status: string; dietaryRestrictions: string | null; menu: { name: string } | null; seatNumber: number | null }>
  }>
  weddingName: string
  pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
  menuColorMap: Record<string, string>
}) {
  return (
    <Page size="A4" style={s.page}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />
      <LeftRule color={pal.dark} />

      <View style={{ paddingLeft: 14 }}>
        <Text style={s.sectionName}>{t('admin.summary.sections.seatingAssignments')}</Text>
        <View style={{ height: 1, backgroundColor: pal.accent, width: 40, marginBottom: 12 }} />
      </View>

      {[...seating].sort((a, b) => {
        // sweetheart / head table always first
        const sw = (t: typeof seating[0]) => t.shape === 'sweetheart' ||
          t.tableName.toLowerCase().includes('sweet') ||
          t.tableName.toLowerCase().includes('novia') ||
          t.tableName.toLowerCase().includes('head')
        if (sw(a) && !sw(b)) return -1
        if (!sw(a) && sw(b)) return 1
        return a.tableNumber - b.tableNumber
      }).map((table) => (
        <View key={table.tableNumber} wrap={false} style={{ marginBottom: 12, marginLeft: 14 }}>
          {/* Table header */}
          <View style={{
            backgroundColor: C.cream, borderRadius: 3,
            borderWidth: 0.5, borderColor: C.border,
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 6, paddingHorizontal: 10,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, backgroundColor: pal.accent, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: pal.dark, flex: 1, paddingLeft: 4 }}>
              {t('admin.summary.tableNumber', { number: String(table.tableNumber) })}: {table.tableName}
            </Text>
            {/* Guest count badge */}
            <View style={{
              backgroundColor: C.muted, borderRadius: 3,
              paddingHorizontal: 8, paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: pal.dark }}>
                {String(table.guests.length)}
              </Text>
            </View>
          </View>

          {/* Guests table */}
          {table.guests.length > 0 ? (
            <View style={{ borderTopWidth: 0, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderLeftWidth: 0.5, borderColor: C.border }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', backgroundColor: C.muted, borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0.5, borderLeftWidth: 0, borderBottomColor: C.border }}>
                {[t('admin.summary.columns.guest'), t('admin.summary.columns.group'), t('admin.summary.columns.menu')].map((col, ci) => (
                  <Text key={ci} style={{
                    flex: ci === 0 ? 2 : 1.5,
                    fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.textMuted,
                    padding: 4,
                  }}>{col.toUpperCase()}</Text>
                ))}
              </View>

              {/* Rows */}
              {table.guests.map((guest, gi) => (
                <View key={gi} style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: gi % 2 === 0 ? C.warmWhite : C.muted,
                  borderTopWidth: 0, borderRightWidth: 0,
                  borderBottomWidth: gi < table.guests.length - 1 ? 0.3 : 0,
                  borderLeftWidth: 0, borderBottomColor: C.border,
                }}>
                  <Text style={{ flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.charcoal, padding: 4 }}>
                    {guest.name}
                  </Text>
                  <Text style={{ flex: 1.5, fontSize: 7.5, fontFamily: 'Helvetica', color: C.charcoal, padding: 4 }}>
                    {guest.groupName || '—'}
                  </Text>
                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', padding: 4 }}>
                    {guest.menu?.name && (
                      <View style={{
                        width: 6, height: 6, borderRadius: 3, marginRight: 4,
                        backgroundColor: menuColorMap[guest.menu.name] || pal.medium,
                      }} />
                    )}
                    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica', color: guest.menu?.name ? (menuColorMap[guest.menu.name] || pal.medium) : C.textLight }}>
                      {guest.menu?.name || '—'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: 8, backgroundColor: C.muted, borderTopWidth: 0, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderLeftWidth: 0.5, borderColor: C.border }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Oblique', color: C.textLight }}>
                {t('admin.seating.table.noGuests')}
              </Text>
            </View>
          )}
        </View>
      ))}

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Itinerary Page — elegant timeline
// ─────────────────────────────────────────────
const KEY_EVENTS = new Set(['ceremony', 'firstDance', 'entrance', 'toast', 'cake', 'bouquet'])

function ItineraryPage({ itinerary, locale, weddingName, pal, t }: {
  itinerary: Array<{
    id: string; title: string; description: string | null; location: string | null
    start_time: string; end_time: string | null; notes: string | null; icon: string | null
    children: Array<{
      id: string; title: string; description: string | null; location: string | null
      start_time: string; end_time: string | null; notes: string | null; icon: string | null
    }>
  }>
  locale: string
  weddingName: string
  pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  const formatTime = (d: string) => new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  return (
    <Page size="A4" style={s.page}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />

      <View style={{ marginBottom: 18 }}>
        <Text style={s.sectionName}>{t('admin.summary.sections.itinerary')}</Text>
        <View style={{ height: 1, backgroundColor: pal.accent, width: 40, marginTop: 4 }} />
      </View>

      {itinerary.map((event, ei) => {
        const isKey = KEY_EVENTS.has(event.icon || '')

        return (
          <View key={event.id} wrap={false} style={{ flexDirection: 'row', paddingBottom: 12, marginBottom: 0 }}>

            {/* Left time column */}
            <View style={{ width: 56, paddingTop: 1 }}>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: pal.accent, letterSpacing: 0.2 }}>
                {formatTime(event.start_time)}
              </Text>
              {event.end_time && (
                <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica', color: C.textLight, marginTop: 1 }}>
                  {formatTime(event.end_time)}
                </Text>
              )}
            </View>

            {/* Center ornament column */}
            <View style={{ width: 24, alignItems: 'center' }}>
              <View style={{
                width: isKey ? 10 : 7,
                height: isKey ? 10 : 7,
                borderRadius: isKey ? 5 : 3.5,
                backgroundColor: isKey ? pal.accent : C.warmWhite,
                borderTopWidth: isKey ? 0 : 1.5,
                borderRightWidth: isKey ? 0 : 1.5,
                borderBottomWidth: isKey ? 0 : 1.5,
                borderLeftWidth: isKey ? 0 : 1.5,
                borderColor: pal.accent,
                marginTop: 3,
              }} />
              {ei < itinerary.length - 1 && (
                <View style={{ width: 1, flex: 1, backgroundColor: C.border, marginTop: 3 }} />
              )}
            </View>

            {/* Event details */}
            <View style={{ flex: 1, paddingTop: 1 }}>
              <Text style={{
                fontSize: isKey ? 9.5 : 8.5,
                fontFamily: isKey ? 'Helvetica-Bold' : 'Helvetica',
                color: isKey ? pal.dark : C.charcoal,
                letterSpacing: isKey ? 0.3 : 0,
              }}>
                {event.title}
              </Text>
              {event.location && (
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica', color: C.textMuted, marginTop: 2 }}>
                  {event.location}
                </Text>
              )}
              {event.description && (
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Oblique', color: C.textMuted, marginTop: 2 }}>
                  {event.description}
                </Text>
              )}
              {event.notes && (
                <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica', color: C.textLight, marginTop: 2 }}>
                  {event.notes}
                </Text>
              )}
              {event.children?.length > 0 && (
                <View style={{ marginTop: 5, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: lightenHex(pal.accent, 0.5) }}>
                  {event.children.map((child, ci) => (
                    <View key={child.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: ci > 0 ? 4 : 0 }}>
                      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: pal.accent, width: 40, marginRight: 8 }}>
                        {formatTime(child.start_time)}
                      </Text>
                      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica', color: C.charcoal, flex: 1 }}>
                        {child.title}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )
      })}

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Venue Map Page
// ─────────────────────────────────────────────
function VenueMapPage({ mapDataUrl, venueName, weddingName, pal, t }: {
  mapDataUrl: string
  venueName?: string
  weddingName: string
  pal: BrandPalette
  t: (k: string, p?: Record<string, string>) => string
}) {
  return (
    <Page size="A4" style={s.page}>
      <AccentBar color={pal.accent} />
      <AccentBar color={pal.accent} bottom />
      <LeftRule color={pal.dark} />

      <View style={{ paddingLeft: 14 }}>
        <Text style={s.sectionName}>{t('admin.summary.sections.venueMap')}</Text>
        {venueName && <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Oblique', color: C.textMuted, marginTop: 1 }}>{venueName}</Text>}
        <View style={{ height: 1, backgroundColor: pal.accent, width: 40, marginBottom: 12 }} />
      </View>

      <View style={[s.card, { marginLeft: 14, padding: 4 }]}>
        <Image src={mapDataUrl} style={{ width: '100%', objectFit: 'contain' }} />
      </View>

      <PageFooter weddingName={weddingName} accentColor={pal.accent} />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Closing Page
// ─────────────────────────────────────────────
function ClosingPage({ partnerNames, date, pal }: { partnerNames: string; date?: string; pal: BrandPalette }) {
  return (
    <Page size="A4" style={{ backgroundColor: pal.dark, width: 595.28, height: 841.89 }}>
      {/* Top/bottom accent strips */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: pal.accent }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, backgroundColor: pal.accent }} />

      {/* Corner bracket decoratives */}
      <View style={{ position: 'absolute', top: 28, left: 28, width: 28, height: 28, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopColor: pal.accent, borderLeftColor: pal.accent, opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 28, right: 28, width: 28, height: 28, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopColor: pal.accent, borderRightColor: pal.accent, opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 28, left: 28, width: 28, height: 28, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomColor: pal.accent, borderLeftColor: pal.accent, opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 28, right: 28, width: 28, height: 28, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomColor: pal.accent, borderRightColor: pal.accent, opacity: 0.5 }} />

      {/* Centered content — all absolute so page height is fixed */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 70 }}>
        <Ornament color={pal.accent} width={120} />
        <Text style={{
          fontSize: 26, fontFamily: 'Macker', color: pal.onDark,
          textAlign: 'center', marginTop: 12, marginBottom: 8, letterSpacing: 1,
        }}>
          {partnerNames}
        </Text>
        {date && (
          <Text style={{
            fontSize: 10, fontFamily: 'Helvetica', color: pal.accent,
            textAlign: 'center', marginTop: 4, marginBottom: 16, letterSpacing: 2,
          }}>
            {date.toUpperCase()}
          </Text>
        )}
        <Ornament color={pal.accent} width={80} />
        <Text style={{
          fontSize: 8.5, fontFamily: 'Helvetica-Oblique', color: pal.onDarkMuted,
          textAlign: 'center', marginTop: 20,
        }}>
          Crafted with love for your perfect day.
        </Text>
        <Text style={{
          fontSize: 7.5, fontFamily: 'Helvetica', color: pal.onDarkSubtle,
          textAlign: 'center', marginTop: 6, letterSpacing: 1,
        }}>
          ohmy.wedding
        </Text>
      </View>

      {/* Consistent footer */}
      <PageFooter weddingName={partnerNames} accentColor={pal.accent} onDark />
    </Page>
  )
}

// ─────────────────────────────────────────────
// Main PDF Document
// ─────────────────────────────────────────────
export interface WeddingPDFData {
  wedding: {
    partner1_first_name?: string; partner1_last_name?: string
    partner2_first_name?: string; partner2_last_name?: string
    wedding_date?: string; wedding_time?: string; reception_time?: string
    ceremony_venue_name?: string; ceremony_venue_address?: string
    reception_venue_name?: string; reception_venue_address?: string
    locale?: string
    primary_color?: string
    secondary_color?: string
    accent_color?: string
  }
  stats: { totalGuests: number; confirmed: number; declined: number; pending: number; totalTables: number; assignedGuests: number; unassignedGuests: number; totalMenus: number; totalCapacity: number }
  menus: Array<{ id: string; name: string; description: string | null; image_url: string | null; count: number; courses: Array<{ id: string; course_number: number; course_name: string | null; dish_name: string | null }> }>
  seating: Array<{ tableNumber: number; tableName: string; shape: string; capacity: number; occupancy: number; position_x: number; position_y: number; width: number; height: number; rotation: number; guests: Array<{ name: string; groupName: string | null; status: string; dietaryRestrictions: string | null; menu: { name: string } | null; seatNumber: number | null }> }>
  itinerary: Array<{ id: string; title: string; description: string | null; location: string | null; start_time: string; end_time: string | null; notes: string | null; icon: string | null; children: Array<{ id: string; title: string; description: string | null; location: string | null; start_time: string; end_time: string | null; notes: string | null; icon: string | null }> }>
  venueMapDataUrl?: string
  /** URL of the cover image (overrides hero default) */
  coverImageUrl?: string
  /** Section keys to include; if undefined all are shown */
  selectedSections?: string[]
}

function WeddingPDFDoc({ data, t }: { data: WeddingPDFData; t: (k: string, p?: Record<string, string>) => string }) {
  const locale = data.wedding.locale || 'en'
  const pal = buildPalette(data.wedding.primary_color, data.wedding.secondary_color, data.wedding.accent_color)
  const show = (key: string) => !data.selectedSections || data.selectedSections.includes(key)
  const menuColorMap = buildMenuColorMap(data.menus)

  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const p1 = data.wedding.partner1_first_name ?? ''
  const p2 = data.wedding.partner2_first_name ?? ''
  const partnerNames = `${p1} & ${p2}`
  const weddingName = partnerNames
  const formattedDate = data.wedding.wedding_date ? formatDate(data.wedding.wedding_date) : undefined

  // Build TOC entries
  const tocEntries: TocEntry[] = []
  let pageNum = 3 // Cover(1) + TOC(2)
  if (show('overview')) {
    tocEntries.push({ title: t('admin.summary.sections.overview'), page: pageNum })
    pageNum += 1
  }
  if (show('menus') && data.menus.length > 0) {
    tocEntries.push({ title: t('admin.summary.sections.menus'), page: pageNum })
    pageNum += 2
  }
  if (show('seating') && data.seating.length > 0) {
    tocEntries.push({ title: t('admin.summary.sections.seatingAssignments'), page: pageNum })
    pageNum += 2
  }
  if (show('itinerary') && data.itinerary.length > 0) {
    tocEntries.push({ title: t('admin.summary.sections.itinerary'), page: pageNum })
    pageNum += 2
  }
  if (show('venue') && data.venueMapDataUrl) {
    tocEntries.push({ title: t('admin.summary.sections.venueMap'), page: pageNum })
  }

  let sectionIndex = 0

  return (
    <Document title={`Wedding Summary — ${partnerNames}`} author="OhMyWedding" creator="ohmy.wedding">
      {/* Cover */}
      <CoverPage
        partnerNames={partnerNames}
        date={formattedDate}
        ceremonyVenue={data.wedding.ceremony_venue_name}
        receptionVenue={data.wedding.reception_venue_name}
        coverImageUrl={data.coverImageUrl}
        pal={pal}
      />

      {/* Table of Contents */}
      <TocPage entries={tocEntries} weddingName={weddingName} pal={pal} />

      {/* Overview */}
      {show('overview') && (
        <OverviewPage stats={data.stats} wedding={data.wedding} locale={locale} weddingName={weddingName} pal={pal} t={t} />
      )}

      {/* Menus */}
      {show('menus') && data.menus.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.menus')}
            subtitle={`${data.menus.length} ${data.menus.length === 1 ? 'menu' : 'menus'}`}
            iconType="menus"
            index={sectionIndex++}
            pal={pal}
            weddingName={weddingName}
          />
          <MenusPage menus={data.menus} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
        </>
      )}

      {/* Seating */}
      {show('seating') && data.seating.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.seatingAssignments')}
            subtitle={`${data.seating.length} tables · ${data.stats.confirmed} guests`}
            iconType="seating"
            index={sectionIndex++}
            pal={pal}
            weddingName={weddingName}
          />
          <SeatingPage seating={data.seating} weddingName={weddingName} pal={pal} t={t} menuColorMap={menuColorMap} />
        </>
      )}

      {/* Itinerary */}
      {show('itinerary') && data.itinerary.length > 0 && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.itinerary')}
            subtitle={`${data.itinerary.length} events`}
            iconType="itinerary"
            index={sectionIndex++}
            pal={pal}
            weddingName={weddingName}
          />
          <ItineraryPage itinerary={data.itinerary} locale={locale} weddingName={weddingName} pal={pal} t={t} />
        </>
      )}

      {/* Venue Map */}
      {show('venue') && data.venueMapDataUrl && (
        <>
          <SectionDividerPage
            title={t('admin.summary.sections.venueMap')}
            subtitle={data.wedding.reception_venue_name}
            iconType="venue"
            index={sectionIndex++}
            pal={pal}
            weddingName={weddingName}
          />
          <VenueMapPage mapDataUrl={data.venueMapDataUrl} venueName={data.wedding.reception_venue_name} weddingName={weddingName} pal={pal} t={t} />
        </>
      )}

      {/* Closing */}
      <ClosingPage partnerNames={partnerNames} date={formattedDate} pal={pal} />
    </Document>
  )
}

// ─────────────────────────────────────────────
// Public export: generate PDF blob
// ─────────────────────────────────────────────
export async function generateWeddingPDF(
  data: WeddingPDFData,
  t: (k: string, p?: Record<string, string>) => string,
): Promise<Blob> {
  ensureFonts(window.location.origin)
  const doc = <WeddingPDFDoc data={data} t={t} />
  return await pdf(doc).toBlob()
}
