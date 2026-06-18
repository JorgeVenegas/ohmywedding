"use client"

import React from 'react'
import { ThemeConfig } from '@/lib/wedding-config'

// ── Color palette constants ──────────────────────────────────────────────────

const IVORY = '#F5F0E6'
const INK = '#1A1815'
const GOLD = '#B8996A'
const SILVER = '#9CA8B2'
const BRONZE = '#A07840'

export type OldMoneyBgStyle = 'ivory' | 'cream' | 'navy' | 'forest' | 'wine' | 'charcoal' | 'themed'
export type OldMoneyAccentMetal = 'gold' | 'silver' | 'bronze'

export interface OldMoneyColors {
  bg: string
  fg: string
  fgMuted: string
  accent: string
  accentMuted: string
  borderColor: string
  ruleColor: string
  cardBg: string
  isDark: boolean
}

export function getOldMoneyColors(
  bgStyle: OldMoneyBgStyle = 'ivory',
  accentMetal: OldMoneyAccentMetal = 'gold',
  theme?: Partial<ThemeConfig>
): OldMoneyColors {
  const accent = accentMetal === 'silver' ? SILVER : accentMetal === 'bronze' ? BRONZE : GOLD

  let bg: string
  let fg: string
  let fgMuted: string
  let isDark: boolean

  switch (bgStyle) {
    case 'cream':
      bg = '#FDFAF2'; fg = INK; fgMuted = '#7A6B5A'; isDark = false; break
    case 'navy':
      bg = '#1A2535'; fg = '#EDE8DE'; fgMuted = '#8A96A4'; isDark = true; break
    case 'forest':
      bg = '#1C3020'; fg = '#EDE8DC'; fgMuted = '#7A8E76'; isDark = true; break
    case 'wine':
      bg = '#3E1824'; fg = '#EDE4DB'; fgMuted = '#9A8080'; isDark = true; break
    case 'charcoal':
      bg = '#252525'; fg = '#EDE8DE'; fgMuted = '#888888'; isDark = true; break
    case 'themed':
      bg = theme?.colors?.secondary || IVORY
      fg = theme?.colors?.primary || INK
      fgMuted = `${theme?.colors?.primary || INK}80`
      isDark = false
      break
    case 'ivory':
    default:
      bg = IVORY; fg = INK; fgMuted = '#7A6B5A'; isDark = false; break
  }

  const accentMutedVal = `${accent}80`
  const borderColor = isDark ? `${accent}25` : `${accent}35`
  const ruleColor = isDark ? `${accent}55` : `${accent}65`
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'

  return { bg, fg, fgMuted, accent, accentMuted: accentMutedVal, borderColor, ruleColor, cardBg, isDark }
}

// ── Ornament Components ──────────────────────────────────────────────────────

/**
 * Detailed botanical branch with individual leaf shapes.
 * Can be flipped horizontally to create a mirrored pair.
 */
export function OldMoneyBotanicalBranch({
  color = GOLD,
  flip = false,
  className = '',
}: {
  color?: string
  flip?: boolean
  className?: string
}) {
  return (
    <svg
      width="92"
      height="36"
      viewBox="0 0 92 36"
      fill="none"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* Main curved stem */}
      <path
        d="M 5 30 C 20 28 36 23 54 18 C 68 14 80 11 90 9"
        stroke={color}
        strokeWidth="0.65"
        fill="none"
        opacity="0.6"
      />
      {/* Upward branch stems */}
      <path d="M 18 27 C 15 21 10 12 6 5" stroke={color} strokeWidth="0.45" fill="none" opacity="0.45" />
      <path d="M 34 23 C 31 17 28 10 25 4" stroke={color} strokeWidth="0.42" fill="none" opacity="0.4" />
      <path d="M 50 19 C 48 14 46 9 44 5" stroke={color} strokeWidth="0.38" fill="none" opacity="0.35" />

      {/* Leaf cluster 1 */}
      <ellipse cx="8" cy="6" rx="8" ry="3" transform="rotate(-55 8 6)" fill={color} opacity="0.48" />
      <ellipse cx="6" cy="14" rx="7" ry="2.6" transform="rotate(-33 6 14)" fill={color} opacity="0.4" />
      <ellipse cx="13" cy="15" rx="6" ry="2.3" transform="rotate(-15 13 15)" fill={color} opacity="0.34" />

      {/* Leaf cluster 2 */}
      <ellipse cx="26" cy="5" rx="7.5" ry="2.8" transform="rotate(-58 26 5)" fill={color} opacity="0.44" />
      <ellipse cx="24" cy="13" rx="6.5" ry="2.4" transform="rotate(-35 24 13)" fill={color} opacity="0.36" />
      <ellipse cx="30" cy="14" rx="5.5" ry="2.1" transform="rotate(-16 30 14)" fill={color} opacity="0.3" />

      {/* Leaf cluster 3 */}
      <ellipse cx="44" cy="6" rx="7" ry="2.6" transform="rotate(-52 44 6)" fill={color} opacity="0.38" />
      <ellipse cx="43" cy="13" rx="5.5" ry="2.1" transform="rotate(-26 43 13)" fill={color} opacity="0.3" />

      {/* Lower drooping leaves */}
      <ellipse cx="18" cy="31" rx="6" ry="2.2" transform="rotate(30 18 31)" fill={color} opacity="0.36" />
      <ellipse cx="33" cy="27" rx="5.5" ry="2" transform="rotate(22 33 27)" fill={color} opacity="0.29" />
      <ellipse cx="50" cy="23" rx="5" ry="1.9" transform="rotate(16 50 23)" fill={color} opacity="0.22" />

      {/* Fading tail */}
      <ellipse cx="64" cy="18" rx="4" ry="1.5" transform="rotate(10 64 18)" fill={color} opacity="0.17" />
      <ellipse cx="76" cy="14" rx="3" ry="1.2" transform="rotate(5 76 14)" fill={color} opacity="0.12" />
      <ellipse cx="86" cy="10" rx="2.2" ry="1" transform="rotate(-2 86 10)" fill={color} opacity="0.08" />
    </svg>
  )
}

/**
 * Full botanical separator: two branches meeting at a center ornament.
 */
export function OldMoneyBotanicalSeparator({
  color = GOLD,
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <OldMoneyBotanicalBranch color={color} flip />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <polygon
          points="7,0 8.4,5.2 14,7 8.4,8.8 7,14 5.6,8.8 0,7 5.6,5.2"
          fill={color}
          opacity="0.75"
        />
      </svg>
      <OldMoneyBotanicalBranch color={color} />
    </div>
  )
}

/**
 * Circular medallion / engraved seal.
 */
export function OldMoneyMedallion({
  color = GOLD,
  size = 56,
  className = '',
}: {
  color?: string
  size?: number
  className?: string
}) {
  const c = size / 2
  const r1 = size * 0.46
  const r2 = size * 0.37
  const r3 = size * 0.26

  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = ((i * 15) - 90) * (Math.PI / 180)
    return {
      x1: c + r2 * Math.cos(a),
      y1: c + r2 * Math.sin(a),
      x2: c + r1 * Math.cos(a),
      y2: c + r1 * Math.sin(a),
    }
  })

  const starPoints = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 - 90) * (Math.PI / 180)
    const r = i % 2 === 0 ? r3 * 0.6 : r3 * 0.3
    return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className={className}>
      <circle cx={c} cy={c} r={r1} stroke={color} strokeWidth="0.75" opacity="0.55" />
      <circle cx={c} cy={c} r={r2} stroke={color} strokeWidth="0.4" opacity="0.35" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth="0.35" opacity="0.28" />
      ))}
      <circle cx={c} cy={c} r={r3} stroke={color} strokeWidth="0.4" opacity="0.4" />
      <polygon points={starPoints} fill={color} opacity="0.65" />
    </svg>
  )
}

/** Double horizontal hairline rule with an 8-pointed star center */
export function OldMoneyRule({
  color = GOLD,
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg width="100%" height="16" viewBox="0 0 400 16" preserveAspectRatio="none" fill="none">
        <line x1="0" y1="2" x2="186" y2="2" stroke={color} strokeWidth="0.55" opacity="0.7" />
        <line x1="214" y1="2" x2="400" y2="2" stroke={color} strokeWidth="0.55" opacity="0.7" />
        <line x1="0" y1="14" x2="186" y2="14" stroke={color} strokeWidth="0.55" opacity="0.5" />
        <line x1="214" y1="14" x2="400" y2="14" stroke={color} strokeWidth="0.55" opacity="0.5" />
        {/* 8-pointed star */}
        <polygon
          points="200,3 201.8,6.8 206,8 201.8,9.2 200,13 198.2,9.2 194,8 198.2,6.8"
          fill={color}
          opacity="0.8"
        />
        {/* Flanking dots */}
        <circle cx="188" cy="8" r="1.2" fill={color} opacity="0.45" />
        <circle cx="212" cy="8" r="1.2" fill={color} opacity="0.45" />
      </svg>
    </div>
  )
}

/** Fine centered divider — hairlines flanking a botanical rosette */
export function OldMoneyDivider({
  color = GOLD,
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        className="flex-1 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${color}80)` }}
      />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        {/* Outer ring */}
        <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="0.5" opacity="0.4" />
        {/* Inner 6-petaled rosette */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const a = (deg - 90) * (Math.PI / 180)
          return (
            <ellipse
              key={deg}
              cx={9 + 3.5 * Math.cos(a)}
              cy={9 + 3.5 * Math.sin(a)}
              rx="2.2"
              ry="1.1"
              transform={`rotate(${deg} ${9 + 3.5 * Math.cos(a)} ${9 + 3.5 * Math.sin(a)})`}
              fill={color}
              opacity="0.55"
            />
          )
        })}
        <circle cx="9" cy="9" r="1.3" fill={color} opacity="0.7" />
      </svg>
      <div
        className="flex-1 h-px"
        style={{ background: `linear-gradient(to left, transparent, ${color}80)` }}
      />
    </div>
  )
}

/** L-shaped triple-line corner mark with a decorative dot */
export function OldMoneyCorner({
  position,
  color = GOLD,
  size = 'md',
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 36 : 28
  const posClass = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  }[position]
  const rotation = { 'top-left': 0, 'top-right': 90, 'bottom-right': 180, 'bottom-left': 270 }[position]

  return (
    <div className={`absolute ${posClass} pointer-events-none`}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 28 28"
        fill="none"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Outer L */}
        <path d="M 0 28 L 0 0 L 28 0" stroke={color} strokeWidth="0.9" fill="none" opacity="0.7" />
        {/* Middle L */}
        <path d="M 0 23 L 0 5 L 23 5" stroke={color} strokeWidth="0.5" fill="none" opacity="0.4" />
        {/* Inner L */}
        <path d="M 0 19 L 0 9 L 19 9" stroke={color} strokeWidth="0.3" fill="none" opacity="0.25" />
        {/* Corner accent dot */}
        <circle cx="0" cy="0" r="1.8" fill={color} opacity="0.65" />
        {/* Small secondary dot */}
        <circle cx="5" cy="5" r="0.8" fill={color} opacity="0.3" />
      </svg>
    </div>
  )
}

/** Outer border frame with ornate triple-L corner marks */
export function OldMoneyBorderFrame({
  color = GOLD,
  className = '',
  cornerSize = 'md',
}: {
  color?: string
  className?: string
  cornerSize?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <OldMoneyCorner position="top-left" color={color} size={cornerSize} />
      <OldMoneyCorner position="top-right" color={color} size={cornerSize} />
      <OldMoneyCorner position="bottom-left" color={color} size={cornerSize} />
      <OldMoneyCorner position="bottom-right" color={color} size={cornerSize} />
    </div>
  )
}

/** Detailed heraldic laurel branch — pair them with flip for a wreath */
export function OldMoneyLaurel({
  color = GOLD,
  flip = false,
  className = '',
}: {
  color?: string
  flip?: boolean
  className?: string
}) {
  return (
    <svg
      width="72"
      height="28"
      viewBox="0 0 72 28"
      fill="none"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* Stem */}
      <path d="M 4 14 Q 22 12 40 14 Q 56 16 68 14" stroke={color} strokeWidth="0.65" fill="none" opacity="0.55" />
      {/* Upper leaves */}
      <ellipse cx="14" cy="10" rx="7" ry="2.8" transform="rotate(-30 14 10)" fill={color} opacity="0.44" />
      <ellipse cx="25" cy="8.5" rx="6.8" ry="2.6" transform="rotate(-18 25 8.5)" fill={color} opacity="0.38" />
      <ellipse cx="36" cy="9" rx="6.2" ry="2.4" transform="rotate(-8 36 9)" fill={color} opacity="0.32" />
      <ellipse cx="46" cy="10.5" rx="5.5" ry="2.2" transform="rotate(4 46 10.5)" fill={color} opacity="0.26" />
      <ellipse cx="56" cy="12.5" rx="5" ry="2" transform="rotate(12 56 12.5)" fill={color} opacity="0.2" />
      {/* Lower leaves */}
      <ellipse cx="15" cy="18" rx="6" ry="2.4" transform="rotate(24 15 18)" fill={color} opacity="0.38" />
      <ellipse cx="26" cy="18.5" rx="5.8" ry="2.2" transform="rotate(15 26 18.5)" fill={color} opacity="0.32" />
      <ellipse cx="37" cy="18" rx="5.2" ry="2" transform="rotate(7 37 18)" fill={color} opacity="0.26" />
      <ellipse cx="47" cy="17" rx="4.5" ry="1.8" transform="rotate(2 47 17)" fill={color} opacity="0.2" />
    </svg>
  )
}

/** Small heraldic shield with internal detail and crown */
export function OldMoneyCrest({
  color = GOLD,
  size = 32,
  className = '',
}: {
  color?: string
  size?: number
  className?: string
}) {
  const s = size / 40
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none" className={className}>
      {/* Crown */}
      <path d="M 12 10 L 12 6" stroke={color} strokeWidth="0.6" opacity="0.5" />
      <path d="M 20 10 L 20 3" stroke={color} strokeWidth="0.6" opacity="0.55" />
      <path d="M 28 10 L 28 6" stroke={color} strokeWidth="0.6" opacity="0.5" />
      <path d="M 10 10 L 30 10" stroke={color} strokeWidth="0.6" opacity="0.45" />
      <circle cx="12" cy="5.5" r="1.4" fill={color} opacity="0.45" />
      <circle cx="20" cy="3" r="1.8" fill={color} opacity="0.5" />
      <circle cx="28" cy="5.5" r="1.4" fill={color} opacity="0.45" />
      {/* Outer shield */}
      <path
        d="M 20 12 L 36 18 L 36 32 Q 36 44 20 50 Q 4 44 4 32 L 4 18 Z"
        stroke={color}
        strokeWidth="0.9"
        fill="none"
        opacity="0.6"
      />
      {/* Inner shield */}
      <path
        d="M 20 15 L 33 20 L 33 32 Q 33 42 20 47 Q 7 42 7 32 L 7 20 Z"
        stroke={color}
        strokeWidth="0.45"
        fill="none"
        opacity="0.3"
      />
      {/* Horizontal divider */}
      <line x1="7" y1="30" x2="33" y2="30" stroke={color} strokeWidth="0.4" opacity="0.22" />
      {/* Vertical divider */}
      <line x1="20" y1="20" x2="20" y2="47" stroke={color} strokeWidth="0.4" opacity="0.22" />
      {/* Quarter motifs */}
      <circle cx="13.5" cy="25" r="2.5" fill="none" stroke={color} strokeWidth="0.4" opacity="0.18" />
      <circle cx="26.5" cy="25" r="2.5" fill="none" stroke={color} strokeWidth="0.4" opacity="0.18" />
      <polygon points="13.5,36 15,39.5 13.5,43 12,39.5" fill={color} opacity="0.12" />
      <polygon points="26.5,36 28,39.5 26.5,43 25,39.5" fill={color} opacity="0.12" />
    </svg>
  )
}

/** Laurel wreath: two mirrored branches flanking a central ornament */
export function OldMoneyLaurelWreath({
  color = GOLD,
  className = '',
  children,
}: {
  color?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <OldMoneyLaurel color={color} flip />
      {children ?? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <polygon
            points="6,0 7.3,4.5 12,6 7.3,7.5 6,12 4.7,7.5 0,6 4.7,4.5"
            fill={color}
            opacity="0.8"
          />
        </svg>
      )}
      <OldMoneyLaurel color={color} />
    </div>
  )
}

/**
 * Editorial section title — botanical branch separator above and below,
 * larger display heading, refined tracking on subtitle.
 */
export function OldMoneySectionTitle({
  title,
  subtitle,
  accentColor = GOLD,
  titleColor = INK,
  subtitleColor = '#7A6B5A',
  className = '',
}: {
  title: string
  subtitle?: string
  accentColor?: string
  titleColor?: string
  subtitleColor?: string
  className?: string
}) {
  return (
    <div className={`text-center ${className}`}>
      {/* Top botanical separator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${accentColor}45)` }} />
        <OldMoneyMedallion color={accentColor} size={32} />
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${accentColor}45)` }} />
      </div>

      {subtitle && (
        <p
          className="text-[9px] sm:text-[10px] uppercase tracking-[0.55em] font-light mb-4"
          style={{ color: subtitleColor, fontFamily: 'var(--font-heading, serif)', letterSpacing: '0.55em' }}
        >
          {subtitle}
        </p>
      )}

      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-extralight leading-tight"
        style={{
          color: titleColor,
          fontFamily: 'var(--font-display, serif)',
          letterSpacing: '0.07em',
        }}
      >
        {title}
      </h2>

      {/* Bottom botanical separator */}
      <div className="mt-7">
        <OldMoneyBotanicalSeparator color={accentColor} />
      </div>
    </div>
  )
}
