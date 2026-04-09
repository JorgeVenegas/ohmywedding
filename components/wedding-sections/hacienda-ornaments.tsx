"use client"

import React from 'react'

/* ==========================================================================
   HACIENDA CHARRO — ORNAMENTAL LIBRARY
   Uses SVG assets from /assets/Ornaments/ rendered via CSS mask-image
   for dynamic color support with elegant ornamental designs.
   ========================================================================== */

const ORNAMENT = {
  corner: '/assets/Ornaments/Asset%201.svg',
  floralDivider: '/assets/Ornaments/Asset%202.svg',
  organicDivider: '/assets/Ornaments/Asset%203.svg',
  medallion: '/assets/Ornaments/Asset%204.svg',
  detailedDivider: '/assets/Ornaments/Asset%205.svg',
  vine: '/assets/Ornaments/Asset%206.svg',
  symmetricDivider: '/assets/Ornaments/Asset%207.svg',
  verticalBorder: '/assets/Ornaments/Asset%208.svg',
} as const

function ornamentMask(src: string, color: string, opacity: number = 1, extra?: React.CSSProperties): React.CSSProperties {
  return {
    maskImage: `url('${src}')`,
    WebkitMaskImage: `url('${src}')`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    backgroundColor: color,
    opacity,
    ...extra,
  } as React.CSSProperties
}

/* --------------------------------------------------------------------------
   1. CORNER FLOURISH — Asset 1 (corner ornament with scrollwork)
   -------------------------------------------------------------------------- */
export function BotanicalCorner({ position, color, size = 'lg' }: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeMap = {
    sm: 'w-20 h-20 sm:w-24 sm:h-24',
    md: 'w-24 h-24 sm:w-32 sm:h-32',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
    xl: 'w-40 h-40 sm:w-52 sm:h-52',
  }
  const posMap = {
    'top-left': 'top-3 left-3 sm:top-5 sm:left-5',
    'top-right': 'top-3 right-3 sm:top-5 sm:right-5',
    'bottom-left': 'bottom-3 left-3 sm:bottom-5 sm:left-5',
    'bottom-right': 'bottom-3 right-3 sm:bottom-5 sm:right-5',
  }
  /* Asset 1 is naturally a top-right corner ornament */
  const transforms: Record<string, string> = {
    'top-right': '',
    'top-left': 'scaleX(-1)',
    'bottom-right': 'scaleY(-1)',
    'bottom-left': 'scale(-1)',
  }

  return (
    <div
      className={`absolute ${posMap[position]} ${sizeMap[size]} pointer-events-none z-10`}
      style={ornamentMask(ORNAMENT.corner, color, 1.0, { transform: transforms[position] })}
    />
  )
}

/* --------------------------------------------------------------------------
   2. SCROLLWORK FRAME — composed from Assets 6 (top vine), 8 (sides), 7 (bottom)
   -------------------------------------------------------------------------- */
export function BaroqueFrame({ children, color, className = '', showTop = true, showBottom = true }: {
  children: React.ReactNode
  color: string
  className?: string
  showTop?: boolean
  showBottom?: boolean
}) {
  return (
    <div className={`relative ${className}`}>
      {/* TOP CREST — Asset 6 vine ornament, flipped for symmetry */}
      {showTop && (
        <div
          className="absolute -top-8 sm:-top-12 left-1/2 -translate-x-1/2 w-[65%] sm:w-[60%] h-8 sm:h-12 z-20 pointer-events-none"
          style={ornamentMask(ORNAMENT.vine, color, 0.55, { transform: 'scaleY(-1)' })}
        />
      )}

      {/* LEFT SIDE — Asset 8 vertical border */}
      <div
        className="absolute -left-3 sm:-left-5 top-[8%] bottom-[8%] w-3 sm:w-4 z-10 pointer-events-none"
        style={ornamentMask(ORNAMENT.verticalBorder, color, 0.58, {
          maskSize: '100% 100%',
        })}
      />

      {/* RIGHT SIDE — Asset 8 vertical border, flipped */}
      <div
        className="absolute -right-3 sm:-right-5 top-[8%] bottom-[8%] w-3 sm:w-4 z-10 pointer-events-none"
        style={ornamentMask(ORNAMENT.verticalBorder, color, 0.58, {
          maskSize: '100% 100%',
          transform: 'scaleX(-1)',
        })}
      />

      {/* BOTTOM ORNAMENT — Asset 7 symmetric divider */}
      {showBottom && (
        <div
          className="absolute -bottom-5 sm:-bottom-7 left-1/2 -translate-x-1/2 w-[50%] sm:w-[45%] h-6 sm:h-8 z-20 pointer-events-none"
          style={ornamentMask(ORNAMENT.symmetricDivider, color, 0.45)}
        />
      )}

      {/* CONTENT with ornate border */}
      <div className="relative" style={{
        border: `2px solid ${color}45`,
        boxShadow: `0 0 0 1px ${color}18, 0 0 0 5px ${color}06, 0 10px 35px rgba(0,0,0,0.18), inset 0 0 50px ${color}06`,
      }}>
        <div className="absolute inset-2 pointer-events-none" style={{ border: `1px solid ${color}20` }} />
        {children}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   3. FLORAL DIVIDER — Asset 2 (ornate symmetric horizontal divider)
   -------------------------------------------------------------------------- */
export function FloralDivider({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div
      className={`w-56 sm:w-72 md:w-80 h-6 sm:h-8 mx-auto ${className}`}
      style={ornamentMask(ORNAMENT.floralDivider, color, 0.85)}
    />
  )
}

/* --------------------------------------------------------------------------
   4. WROUGHT-IRON DIVIDER — Asset 7 (symmetric S-curve scrollwork)
   -------------------------------------------------------------------------- */
export function WroughtIronDivider({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div
      className={`w-52 sm:w-64 md:w-72 h-5 sm:h-7 mx-auto ${className}`}
      style={ornamentMask(ORNAMENT.symmetricDivider, color, 0.78)}
    />
  )
}

/* --------------------------------------------------------------------------
   5. LINE DIVIDER — Asset 5 (detailed ornamental line with center motifs)
   -------------------------------------------------------------------------- */
export function IronLineDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}55)` }} />
      <div
        className="flex-shrink-0 w-36 sm:w-48 h-4 sm:h-5"
        style={ornamentMask(ORNAMENT.detailedDivider, color, 0.75)}
      />
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color}55)` }} />
    </div>
  )
}

/* --------------------------------------------------------------------------
   5b. DETAILED BORDER DIVIDER — Asset 5 at large scale (prominent horizontal ornament)
   -------------------------------------------------------------------------- */
export function DetailedBorderDivider({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div
      className={`w-full max-w-xs sm:max-w-sm h-8 sm:h-10 mx-auto ${className}`}
      style={ornamentMask(ORNAMENT.detailedDivider, color, 0.82)}
    />
  )
}

/* --------------------------------------------------------------------------
   5c. VINE ACCENT — Asset 6 at small scale for flanking text titles
   -------------------------------------------------------------------------- */
export function VineAccent({ color, flip = false, className = '' }: { color: string; flip?: boolean; className?: string }) {
  return (
    <div
      className={`flex-shrink-0 w-10 sm:w-14 h-4 sm:h-5 ${className}`}
      style={ornamentMask(ORNAMENT.vine, color, 0.65, { transform: flip ? 'scaleX(-1)' : undefined })}
    />
  )
}

/* --------------------------------------------------------------------------
   6. ORNATE CARD CORNERS — Asset 1 (corner ornament at smaller scale)
   -------------------------------------------------------------------------- */
export function OrnateCorner({ position, color, size = 'md' }: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeMap = {
    sm: 'w-14 h-14 sm:w-20 sm:h-20',
    md: 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32',
    lg: 'w-26 h-26 sm:w-34 sm:h-34 md:w-40 md:h-40',
  }
  const posMap = {
    'top-left': 'top-2 left-2 sm:top-3 sm:left-3',
    'top-right': 'top-2 right-2 sm:top-3 sm:right-3',
    'bottom-left': 'bottom-2 left-2 sm:bottom-3 sm:left-3',
    'bottom-right': 'bottom-2 right-2 sm:bottom-3 sm:right-3',
  }
  /* Asset 1 is naturally a top-right corner ornament */
  const transforms: Record<string, string> = {
    'top-right': '',
    'top-left': 'scaleX(-1)',
    'bottom-right': 'scaleY(-1)',
    'bottom-left': 'scale(-1)',
  }
  return (
    <div
      className={`absolute ${posMap[position]} ${sizeMap[size]} pointer-events-none`}
      style={ornamentMask(ORNAMENT.corner, color, 0.7, { transform: transforms[position] })}
    />
  )
}

/* --------------------------------------------------------------------------
   7. DAMASK / ORNATE TILE PATTERN
   -------------------------------------------------------------------------- */
export function HaciendaTilePattern({ color = '#C0A882', opacity = 0.06 }: { color?: string; opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'><g fill='none' stroke='${color}' stroke-width='0.6'><path d='M40 4 C44 12, 52 16, 52 24 C52 30, 46 34, 40 36 C34 34, 28 30, 28 24 C28 16, 36 12, 40 4Z'/><path d='M40 76 C44 68, 52 64, 52 56 C52 50, 46 46, 40 44 C34 46, 28 50, 28 56 C28 64, 36 68, 40 76Z'/><path d='M4 40 C12 36, 16 28, 24 28 C30 28, 34 34, 36 40 C34 46, 30 52, 24 52 C16 52, 12 44, 4 40Z'/><path d='M76 40 C68 36, 64 28, 56 28 C50 28, 46 34, 44 40 C46 46, 50 52, 56 52 C64 52, 68 44, 76 40Z'/><circle cx='40' cy='40' r='3'/><circle cx='40' cy='40' r='8'/><circle cx='0' cy='0' r='2'/><circle cx='80' cy='0' r='2'/><circle cx='0' cy='80' r='2'/><circle cx='80' cy='80' r='2'/><path d='M12 12 L28 28'/><path d='M68 12 L52 28'/><path d='M12 68 L28 52'/><path d='M68 68 L52 52'/></g></svg>`
        )}")`,
        backgroundSize: '80px 80px',
      }}
    />
  )
}

/* --------------------------------------------------------------------------
   8. DAMASK PATTERN — Asset 4 medallion as repeating tile background
   -------------------------------------------------------------------------- */
export function DamaskPattern({ color = '#C0A882', opacity = 0.08 }: { color?: string; opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundColor: color,
        maskImage: `url('${ORNAMENT.medallion}'), linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)`,
        WebkitMaskImage: `url('${ORNAMENT.medallion}'), linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)`,
        maskSize: '90px 90px, 100% 100%',
        WebkitMaskSize: '90px 90px, 100% 100%',
        maskRepeat: 'repeat, no-repeat',
        WebkitMaskRepeat: 'repeat, no-repeat',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      } as React.CSSProperties}
    />
  )
}

/* --------------------------------------------------------------------------
   9. CANDLE GLOW
   -------------------------------------------------------------------------- */
export function CandleGlow({ position = 'center', intensity = 'medium' }: {
  position?: 'center' | 'top' | 'bottom' | 'top-left' | 'top-right'
  intensity?: 'subtle' | 'medium' | 'strong'
}) {
  const posMap: Record<string, string> = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    top: '-top-20 left-1/2 -translate-x-1/2',
    bottom: '-bottom-20 left-1/2 -translate-x-1/2',
    'top-left': '-top-10 -left-10',
    'top-right': '-top-10 -right-10',
  }
  const opacityMap: Record<string, number> = { subtle: 0.07, medium: 0.13, strong: 0.22 }
  return (
    <div
      className={`absolute ${posMap[position]} w-[350px] h-[350px] sm:w-[550px] sm:h-[550px] rounded-full pointer-events-none`}
      style={{
        background: `radial-gradient(circle, rgba(212,180,131,${opacityMap[intensity]}) 0%, rgba(192,168,130,${opacityMap[intensity] * 0.4}) 40%, transparent 70%)`,
      }}
    />
  )
}

/* --------------------------------------------------------------------------
   10. STAR ROSETTE — Asset 4 (medallion ornament at small size)
   -------------------------------------------------------------------------- */
export function CharroStar({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <div
      className="flex-shrink-0"
      style={{
        width: size,
        height: size,
        ...ornamentMask(ORNAMENT.medallion, color, 0.78),
      }}
    />
  )
}

/* --------------------------------------------------------------------------
   11. ROPE LINE — Asset 3 (organic flowing divider)
   -------------------------------------------------------------------------- */
export function RopeLine({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div
      className={`h-3 sm:h-4 w-full ${className}`}
      style={ornamentMask(ORNAMENT.organicDivider, color, 0.3, {
        maskSize: 'contain',
        maskPosition: 'center',
      })}
    />
  )
}

/* --------------------------------------------------------------------------
   12. SCRAPBOOK PHOTO
   -------------------------------------------------------------------------- */
export function ScrapbookPhoto({ children, rotation = 0, className = '', accentColor = '#C0A882', showTape = true }: {
  children: React.ReactNode
  rotation?: number
  className?: string
  accentColor?: string
  showTape?: boolean
}) {
  return (
    <div className={`relative group ${className}`}
      style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease' }}>
      {showTape && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-5 sm:h-6 z-20 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${accentColor}50, ${accentColor}75, ${accentColor}50)`,
            transform: `rotate(${rotation > 0 ? -6 : 6}deg)`,
            clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)',
            backdropFilter: 'blur(1px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      )}
      <div className="bg-white p-2 sm:p-2.5 shadow-xl transition-all duration-500 group-hover:shadow-2xl"
        style={{ boxShadow: '0 6px 25px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)' }}>
        {children}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   13. TORN PAPER EDGE
   -------------------------------------------------------------------------- */
export function TornPaperEdge({ children, side = 'bottom', bgColor = '#FAF6EF', className = '' }: {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'right'
  bgColor?: string
  className?: string
}) {
  const tornBottom = 'polygon(0 0, 100% 0, 100% 85%, 97% 88%, 94% 84%, 90% 87%, 87% 83%, 83% 86%, 80% 82%, 76% 88%, 73% 84%, 70% 87%, 66% 83%, 63% 86%, 60% 82%, 56% 88%, 53% 84%, 50% 87%, 46% 83%, 43% 85%, 40% 82%, 36% 88%, 33% 84%, 30% 86%, 26% 83%, 23% 87%, 20% 84%, 16% 86%, 13% 82%, 10% 87%, 7% 84%, 3% 88%, 0 85%)'
  const tornTop = 'polygon(0 15%, 3% 12%, 7% 16%, 10% 13%, 13% 18%, 16% 14%, 20% 16%, 23% 13%, 26% 17%, 30% 14%, 33% 16%, 36% 12%, 40% 18%, 43% 15%, 46% 17%, 50% 13%, 53% 16%, 56% 12%, 60% 18%, 63% 14%, 66% 17%, 70% 13%, 73% 16%, 76% 12%, 80% 18%, 83% 14%, 87% 17%, 90% 13%, 94% 16%, 97% 12%, 100% 15%, 100% 100%, 0 100%)'
  const tornRight = 'polygon(0 0, 85% 0, 88% 3%, 84% 7%, 87% 10%, 83% 13%, 86% 16%, 82% 20%, 88% 23%, 84% 26%, 87% 30%, 83% 33%, 86% 36%, 82% 40%, 88% 43%, 84% 46%, 87% 50%, 83% 53%, 85% 56%, 82% 60%, 88% 63%, 84% 66%, 86% 70%, 83% 73%, 87% 76%, 84% 80%, 86% 83%, 82% 87%, 87% 90%, 84% 94%, 88% 97%, 85% 100%, 0 100%)'
  const clipPaths = { bottom: tornBottom, top: tornTop, right: tornRight }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ clipPath: clipPaths[side] }}>
      {children}
      <div className="absolute pointer-events-none" style={{
        ...(side === 'bottom' ? { bottom: 0, left: 0, right: 0, height: '20%' } :
          side === 'top' ? { top: 0, left: 0, right: 0, height: '20%' } :
          { top: 0, right: 0, bottom: 0, width: '20%' }),
        background: side === 'bottom'
          ? `linear-gradient(to top, ${bgColor}60, transparent)`
          : side === 'top'
            ? `linear-gradient(to bottom, ${bgColor}60, transparent)`
            : `linear-gradient(to left, ${bgColor}60, transparent)`,
      }} />
    </div>
  )
}

/* --------------------------------------------------------------------------
   14. GOLD TAPE ACCENT
   -------------------------------------------------------------------------- */
export function GoldTapeAccent({ color, rotation = 0, className = '' }: {
  color: string; rotation?: number; className?: string
}) {
  return (
    <div className={`w-12 sm:w-14 h-4 sm:h-5 pointer-events-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}65, ${color}40)`,
        transform: `rotate(${rotation}deg)`,
        clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}
    />
  )
}

/* --------------------------------------------------------------------------
   15. SECTION TITLE WITH SCROLLWORK DIVIDER
   -------------------------------------------------------------------------- */
export function HaciendaSectionTitle({
  title, subtitle, titleColor, subtitleColor, accentColor, className = '',
}: {
  title: string; subtitle?: string; titleColor: string; subtitleColor: string; accentColor: string; className?: string
}) {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="text-4xl sm:text-5xl md:text-6xl mb-3"
        style={{ fontFamily: 'var(--font-display, cursive)', color: titleColor, fontWeight: 400 }}>
        {title}
      </h2>
      <FloralDivider color={accentColor} className="mb-3" />
      {subtitle && (
        <p className="text-base sm:text-lg font-light italic max-w-lg mx-auto"
          style={{ color: subtitleColor, fontFamily: 'var(--font-body, sans-serif)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
   16. DECORATIVE QUOTE BLOCK
   -------------------------------------------------------------------------- */
export function DecorativeQuoteBlock({ children, color, bgColor, className = '' }: {
  children: React.ReactNode; color: string; bgColor?: string; className?: string
}) {
  return (
    <div className={`relative px-8 sm:px-12 py-6 sm:py-8 ${className}`} style={{ backgroundColor: bgColor }}>
      <div className="absolute left-0 top-4 bottom-4 w-px" style={{ backgroundColor: `${color}30` }} />
      <div className="absolute left-2 top-6 bottom-6 w-px" style={{ backgroundColor: `${color}15` }} />
      <div className="absolute right-0 top-4 bottom-4 w-px" style={{ backgroundColor: `${color}30` }} />
      <div className="absolute right-2 top-6 bottom-6 w-px" style={{ backgroundColor: `${color}15` }} />
      <div className="absolute top-2 left-4 pointer-events-none">
        <svg width="28" height="24" viewBox="0 0 24 20" fill="none">
          <path d="M10 0 L10 8 Q10 14, 4 16 L2 12 Q6 10, 6 8 L0 8 L0 0Z" fill={color} opacity="0.15" />
          <path d="M24 0 L24 8 Q24 14, 18 16 L16 12 Q20 10, 20 8 L14 8 L14 0Z" fill={color} opacity="0.15" />
        </svg>
      </div>
      <div className="absolute bottom-2 right-4 pointer-events-none rotate-180">
        <svg width="28" height="24" viewBox="0 0 24 20" fill="none">
          <path d="M10 0 L10 8 Q10 14, 4 16 L2 12 Q6 10, 6 8 L0 8 L0 0Z" fill={color} opacity="0.15" />
          <path d="M24 0 L24 8 Q24 14, 18 16 L16 12 Q20 10, 20 8 L14 8 L14 0Z" fill={color} opacity="0.15" />
        </svg>
      </div>
      {['top-0 left-0', 'top-0 right-0 -scale-x-100', 'bottom-0 left-0 -scale-y-100', 'bottom-0 right-0 scale-[-1]'].map((cls, i) => (
        <div key={i} className={`absolute ${cls} w-4 h-4 pointer-events-none`}>
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M0 0 L16 0" stroke={color} strokeWidth="1.5" opacity="0.4" />
            <path d="M0 0 L0 16" stroke={color} strokeWidth="1.5" opacity="0.4" />
            <circle cx="0" cy="0" r="2.5" fill={color} opacity="0.3" />
          </svg>
        </div>
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   17. CENTER MEDALLION — Asset 4 (intricate medallion/mandala ornament)
   -------------------------------------------------------------------------- */
export function CenterMedallion({ children, color, size = 'md', className = '' }: {
  children?: React.ReactNode
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeMap = { sm: 'w-32 h-32 sm:w-40 sm:h-40', md: 'w-44 h-44 sm:w-56 sm:h-56', lg: 'w-56 h-56 sm:w-72 sm:h-72' }

  return (
    <div className={`relative ${sizeMap[size]} ${className}`}>
      <div
        className="absolute inset-0 w-full h-full"
        style={ornamentMask(ORNAMENT.medallion, color, 0.7)}
      />
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {children}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   18. SIDE BORDER SCROLLWORK — Asset 8 (vertical ornamental border)
   -------------------------------------------------------------------------- */
export function SideBorderScrollwork({ color, side = 'left', className = '' }: {
  color: string
  side?: 'left' | 'right'
  className?: string
}) {
  return (
    <div
      className={`absolute ${side === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} top-[8%] bottom-[8%] w-3 sm:w-4 pointer-events-none z-10 ${className}`}
      style={ornamentMask(ORNAMENT.verticalBorder, color, 0.58, {
        maskSize: '100% 100%',
        transform: side === 'right' ? 'scaleX(-1)' : undefined,
      })}
    />
  )
}
