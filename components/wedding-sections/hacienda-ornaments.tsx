"use client"

import React from 'react'

/* ==========================================================================
   HACIENDA CHARRO — VICTORIAN SCROLLWORK ORNAMENTAL LIBRARY
   Inspired by formal wedding invitations with filigree, C-scrolls,
   acanthus flourishes, geometric rosettes, and damask patterns.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CORNER FLOURISH (scrollwork filigree)
   Replaces old botanical corners with Victorian curling ornaments.
   -------------------------------------------------------------------------- */
export function BotanicalCorner({ position, color, size = 'lg' }: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeMap = {
    sm: 'w-28 h-28 sm:w-36 sm:h-36',
    md: 'w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56',
    lg: 'w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72',
    xl: 'w-56 h-56 sm:w-72 sm:h-72 md:w-[22rem] md:h-[22rem]',
  }
  const posMap = {
    'top-left': '-top-2 -left-2',
    'top-right': '-top-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
  }
  const transforms = {
    'top-left': '',
    'top-right': 'scaleX(-1)',
    'bottom-left': 'scaleY(-1)',
    'bottom-right': 'scale(-1)',
  }

  return (
    <div className={`absolute ${posMap[position]} ${sizeMap[size]} pointer-events-none z-10`}>
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full" style={{ transform: transforms[position] }}>
        {/* Main C-scroll from corner going down */}
        <path d="M8 8 C8 30, 12 50, 18 68 C24 86, 22 100, 14 110 C8 118, 10 128, 18 132 C26 136, 30 130, 28 122"
          stroke={color} strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round" />
        {/* Main C-scroll from corner going right */}
        <path d="M8 8 C30 8, 50 12, 68 18 C86 24, 100 22, 110 14 C118 8, 128 10, 132 18 C136 26, 130 30, 122 28"
          stroke={color} strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round" />

        {/* Secondary scroll branch - vertical */}
        <path d="M20 55 C28 48, 38 50, 42 58 C46 66, 40 72, 32 70"
          stroke={color} strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d="M16 85 C24 78, 34 80, 38 88 C42 96, 36 102, 28 100"
          stroke={color} strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round" />

        {/* Secondary scroll branch - horizontal */}
        <path d="M55 20 C48 28, 50 38, 58 42 C66 46, 72 40, 70 32"
          stroke={color} strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d="M85 16 C78 24, 80 34, 88 38 C96 42, 102 36, 100 28"
          stroke={color} strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round" />

        {/* Acanthus leaf shapes along vertical scroll */}
        <path d="M10 35 C16 28, 26 30, 24 38 C22 44, 14 44, 10 35Z" fill={color} opacity="0.25" />
        <path d="M14 65 C20 58, 30 60, 28 68 C26 74, 18 74, 14 65Z" fill={color} opacity="0.22" />
        <path d="M12 95 C18 88, 28 90, 26 98 C24 104, 16 104, 12 95Z" fill={color} opacity="0.2" />

        {/* Acanthus leaf shapes along horizontal scroll */}
        <path d="M35 10 C28 16, 30 26, 38 24 C44 22, 44 14, 35 10Z" fill={color} opacity="0.25" />
        <path d="M65 14 C58 20, 60 30, 68 28 C74 26, 74 18, 65 14Z" fill={color} opacity="0.22" />
        <path d="M95 12 C88 18, 90 28, 98 26 C104 24, 104 16, 95 12Z" fill={color} opacity="0.2" />

        {/* Small curling tendrils */}
        <path d="M28 122 C26 116, 30 112, 34 115" stroke={color} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M122 28 C116 26, 112 30, 115 34" stroke={color} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />

        {/* Diagonal scroll accent */}
        <path d="M30 30 C42 38, 50 50, 48 62 C46 70, 38 72, 34 66"
          stroke={color} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M34 66 C32 60, 36 56, 40 60" stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Corner rosette */}
        <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.2" fill="none" opacity="0.5" />
        <circle cx="12" cy="12" r="2" fill={color} opacity="0.45" />
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <ellipse key={deg} cx="12" cy="6" rx="1.8" ry="3.5" fill={color} opacity="0.2"
            transform={`rotate(${deg} 12 12)`} />
        ))}

        {/* Terminal dots */}
        <circle cx="28" cy="122" r="2.5" fill={color} opacity="0.35" />
        <circle cx="122" cy="28" r="2.5" fill={color} opacity="0.35" />

        {/* Fine frame lines from corner */}
        <line x1="4" y1="4" x2="4" y2="155" stroke={color} strokeWidth="0.7" opacity="0.2" />
        <line x1="4" y1="4" x2="155" y2="4" stroke={color} strokeWidth="0.7" opacity="0.2" />
      </svg>
    </div>
  )
}

/* --------------------------------------------------------------------------
   2. SCROLLWORK FRAME (baroque/Victorian)
   -------------------------------------------------------------------------- */
export function BaroqueFrame({ children, color, className = '' }: {
  children: React.ReactNode
  color: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {/* TOP CREST — scrollwork crown */}
      <div className="absolute -top-10 sm:-top-14 left-1/2 -translate-x-1/2 w-[70%] sm:w-[65%] z-20 pointer-events-none">
        <svg viewBox="0 0 260 50" fill="none" className="w-full h-auto">
          {/* Central fleur-de-lis / crown */}
          <path d="M130 8 C130 4, 126 2, 124 6 C122 10, 126 14, 130 12 C134 14, 138 10, 136 6 C134 2, 130 4, 130 8Z"
            fill={color} opacity="0.5" />
          <path d="M130 12 L130 22" stroke={color} strokeWidth="1.5" opacity="0.6" />
          <path d="M124 14 C118 10, 112 14, 116 20 C118 24, 124 22, 126 18"
            stroke={color} strokeWidth="1.3" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d="M136 14 C142 10, 148 14, 144 20 C142 24, 136 22, 134 18"
            stroke={color} strokeWidth="1.3" fill="none" opacity="0.5" strokeLinecap="round" />

          {/* Left scrollwork */}
          <path d="M118 18 C108 14, 96 16, 88 22 C82 28, 72 26, 64 22"
            stroke={color} strokeWidth="1.5" fill="none" opacity="0.55" strokeLinecap="round" />
          <path d="M64 22 C56 18, 46 20, 40 26 C36 30, 32 28, 30 24"
            stroke={color} strokeWidth="1.2" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d="M30 24 C28 20, 24 18, 20 20 C18 22, 20 26, 24 26"
            stroke={color} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M88 16 Q94 10, 100 16 Q94 22, 88 16Z" fill={color} opacity="0.2" />

          {/* Right scrollwork */}
          <path d="M142 18 C152 14, 164 16, 172 22 C178 28, 188 26, 196 22"
            stroke={color} strokeWidth="1.5" fill="none" opacity="0.55" strokeLinecap="round" />
          <path d="M196 22 C204 18, 214 20, 220 26 C224 30, 228 28, 230 24"
            stroke={color} strokeWidth="1.2" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d="M230 24 C232 20, 236 18, 240 20 C242 22, 240 26, 236 26"
            stroke={color} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M172 16 Q166 10, 160 16 Q166 22, 172 16Z" fill={color} opacity="0.2" />

          {/* Extension lines */}
          <line x1="2" y1="38" x2="24" y2="38" stroke={color} strokeWidth="0.5" opacity="0.2" />
          <line x1="236" y1="38" x2="258" y2="38" stroke={color} strokeWidth="0.5" opacity="0.2" />
        </svg>
      </div>

      {/* LEFT SIDE SCROLLWORK */}
      <div className="absolute -left-3 sm:-left-5 top-[10%] bottom-[10%] w-5 sm:w-7 z-10 pointer-events-none">
        <svg viewBox="0 0 14 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <line x1="7" y1="0" x2="7" y2="200" stroke={color} strokeWidth="0.8" opacity="0.25" />
          <path d="M7 40 C2 46, 1 54, 3 60 C5 64, 8 62, 7 56" stroke={color} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M7 75 C2 81, 1 89, 3 95 C5 99, 8 97, 7 91" stroke={color} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
          <path d="M7 110 C2 116, 1 124, 3 130 C5 134, 8 132, 7 126" stroke={color} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
          <path d="M7 145 C2 151, 1 159, 3 165 C5 169, 8 167, 7 161" stroke={color} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <circle cx="5" cy="100" r="3" stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" />
          <circle cx="5" cy="100" r="1.2" fill={color} opacity="0.25" />
        </svg>
      </div>

      {/* RIGHT SIDE SCROLLWORK */}
      <div className="absolute -right-3 sm:-right-5 top-[10%] bottom-[10%] w-5 sm:w-7 z-10 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
        <svg viewBox="0 0 14 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <line x1="7" y1="0" x2="7" y2="200" stroke={color} strokeWidth="0.8" opacity="0.25" />
          <path d="M7 40 C2 46, 1 54, 3 60 C5 64, 8 62, 7 56" stroke={color} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M7 75 C2 81, 1 89, 3 95 C5 99, 8 97, 7 91" stroke={color} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
          <path d="M7 110 C2 116, 1 124, 3 130 C5 134, 8 132, 7 126" stroke={color} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
          <path d="M7 145 C2 151, 1 159, 3 165 C5 169, 8 167, 7 161" stroke={color} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <circle cx="5" cy="100" r="3" stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" />
          <circle cx="5" cy="100" r="1.2" fill={color} opacity="0.25" />
        </svg>
      </div>

      {/* BOTTOM ORNAMENT */}
      <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 w-[50%] sm:w-[45%] z-20 pointer-events-none">
        <svg viewBox="0 0 200 28" fill="none" className="w-full h-auto">
          <path d="M100 4 L106 14 L100 24 L94 14Z" stroke={color} strokeWidth="1" fill="none" opacity="0.45" />
          <circle cx="100" cy="14" r="2" fill={color} opacity="0.35" />
          <path d="M92 12 C82 8, 72 10, 66 16 C62 20, 54 18, 48 14" stroke={color} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M108 12 C118 8, 128 10, 134 16 C138 20, 146 18, 152 14" stroke={color} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
          <line x1="10" y1="10" x2="48" y2="10" stroke={color} strokeWidth="0.4" opacity="0.18" />
          <line x1="152" y1="10" x2="190" y2="10" stroke={color} strokeWidth="0.4" opacity="0.18" />
        </svg>
      </div>

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
   3. SCROLLWORK DIVIDER — with central crown motif
   -------------------------------------------------------------------------- */
export function FloralDivider({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div className={`w-56 sm:w-72 md:w-80 mx-auto ${className}`}>
      <svg viewBox="0 0 300 40" fill="none" className="w-full h-auto">
        {/* Central crown/fleur-de-lis */}
        <path d="M150 8 C150 4, 146 2, 144 6 C142 10, 146 14, 150 12 C154 14, 158 10, 156 6 C154 2, 150 4, 150 8Z"
          fill={color} opacity="0.5" />
        <path d="M150 12 L150 18" stroke={color} strokeWidth="1.2" opacity="0.5" />
        <path d="M144 13 C140 10, 136 12, 138 16 C139 18, 142 17, 143 15"
          stroke={color} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M156 13 C160 10, 164 12, 162 16 C161 18, 158 17, 157 15"
          stroke={color} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />

        {/* Left scrollwork */}
        <path d="M138 18 C128 16, 118 18, 110 22 C104 26, 96 24, 90 20"
          stroke={color} strokeWidth="1.3" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M90 20 C84 16, 76 18, 72 22 C68 26, 62 24, 58 22"
          stroke={color} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M58 22 C54 20, 50 18, 46 20 C44 22, 46 24, 48 24"
          stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" strokeLinecap="round" />
        <line x1="2" y1="20" x2="46" y2="20" stroke={color} strokeWidth="0.5" opacity="0.2" />
        <path d="M110 14 Q115 10, 118 14 Q115 18, 110 14Z" fill={color} opacity="0.15" />

        {/* Right scrollwork (mirror) */}
        <path d="M162 18 C172 16, 182 18, 190 22 C196 26, 204 24, 210 20"
          stroke={color} strokeWidth="1.3" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M210 20 C216 16, 224 18, 228 22 C232 26, 238 24, 242 22"
          stroke={color} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M242 22 C246 20, 250 18, 254 20 C256 22, 254 24, 252 24"
          stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" strokeLinecap="round" />
        <line x1="254" y1="20" x2="298" y2="20" stroke={color} strokeWidth="0.5" opacity="0.2" />
        <path d="M190 14 Q185 10, 182 14 Q185 18, 190 14Z" fill={color} opacity="0.15" />

        {/* End dots */}
        <circle cx="3" cy="20" r="1.5" fill={color} opacity="0.25" />
        <circle cx="297" cy="20" r="1.5" fill={color} opacity="0.25" />
      </svg>
    </div>
  )
}

/* --------------------------------------------------------------------------
   4. WROUGHT-IRON SCROLLWORK DIVIDER
   -------------------------------------------------------------------------- */
export function WroughtIronDivider({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div className={`w-52 sm:w-64 md:w-72 mx-auto ${className}`}>
      <svg viewBox="0 0 240 28" fill="none" className="w-full h-auto">
        <path d="M120 6 L126 14 L120 22 L114 14Z" stroke={color} strokeWidth="1" fill="none" opacity="0.45" />
        <circle cx="120" cy="14" r="2" fill={color} opacity="0.4" />
        <path d="M110 14 C105 14, 100 8, 94 8 C88 8, 85 14, 80 14" stroke={color} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M110 14 C105 14, 100 20, 94 20 C88 20, 85 14, 80 14" stroke={color} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M80 14 C75 14, 72 10, 66 10 C60 10, 58 14, 54 14" stroke={color} strokeWidth="0.8" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M80 14 C75 14, 72 18, 66 18 C60 18, 58 14, 54 14" stroke={color} strokeWidth="0.8" fill="none" opacity="0.35" strokeLinecap="round" />
        <line x1="2" y1="14" x2="54" y2="14" stroke={color} strokeWidth="0.4" opacity="0.2" />
        <circle cx="3" cy="14" r="1" fill={color} opacity="0.25" />
        <path d="M130 14 C135 14, 140 8, 146 8 C152 8, 155 14, 160 14" stroke={color} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M130 14 C135 14, 140 20, 146 20 C152 20, 155 14, 160 14" stroke={color} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M160 14 C165 14, 168 10, 174 10 C180 10, 182 14, 186 14" stroke={color} strokeWidth="0.8" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M160 14 C165 14, 168 18, 174 18 C180 18, 182 14, 186 14" stroke={color} strokeWidth="0.8" fill="none" opacity="0.35" strokeLinecap="round" />
        <line x1="186" y1="14" x2="238" y2="14" stroke={color} strokeWidth="0.4" opacity="0.2" />
        <circle cx="237" cy="14" r="1" fill={color} opacity="0.25" />
      </svg>
    </div>
  )
}

/* --------------------------------------------------------------------------
   5. ARROW LINE DIVIDER (for accordion items, cards)
   -------------------------------------------------------------------------- */
export function IronLineDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}30)` }} />
      <svg width="28" height="10" viewBox="0 0 28 10" fill="none" className="flex-shrink-0">
        <line x1="0" y1="5" x2="10" y2="5" stroke={color} strokeWidth="0.6" opacity="0.4" />
        <path d="M10 5 L14 2 L14 8 Z" fill={color} opacity="0.3" />
        <path d="M18 5 L14 2 L14 8 Z" fill={color} opacity="0.3" />
        <line x1="18" y1="5" x2="28" y2="5" stroke={color} strokeWidth="0.6" opacity="0.4" />
      </svg>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color}30)` }} />
    </div>
  )
}

/* --------------------------------------------------------------------------
   6. ORNATE CARD CORNERS (scrollwork for cards)
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
    'top-left': 'top-1 left-1 sm:top-2 sm:left-2',
    'top-right': 'top-1 right-1 sm:top-2 sm:right-2',
    'bottom-left': 'bottom-1 left-1 sm:bottom-2 sm:left-2',
    'bottom-right': 'bottom-1 right-1 sm:bottom-2 sm:right-2',
  }
  const transforms = {
    'top-left': '',
    'top-right': 'scaleX(-1)',
    'bottom-left': 'scaleY(-1)',
    'bottom-right': 'scale(-1)',
  }
  return (
    <div className={`absolute ${posMap[position]} ${sizeMap[size]} pointer-events-none`}>
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full" style={{ transform: transforms[position] }}>
        {/* L-shaped frame lines */}
        <path d="M6 4 L6 48" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        <path d="M4 6 L48 6" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        {/* Corner scroll */}
        <path d="M12 12 C12 22, 16 28, 24 30 C28 32, 28 38, 24 40 C22 42, 24 44, 26 43"
          stroke={color} strokeWidth="0.9" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M12 12 C22 12, 28 16, 30 24 C32 28, 38 28, 40 24 C42 22, 44 24, 43 26"
          stroke={color} strokeWidth="0.9" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Corner dot */}
        <circle cx="6" cy="6" r="2.5" fill={color} opacity="0.5" />
        <circle cx="6" cy="48" r="1.5" fill={color} opacity="0.3" />
        <circle cx="48" cy="6" r="1.5" fill={color} opacity="0.3" />
      </svg>
    </div>
  )
}

/* --------------------------------------------------------------------------
   7. DAMASK / ORNATE TILE PATTERN
   -------------------------------------------------------------------------- */
export function HaciendaTilePattern({ color = '#C0A882', opacity = 0.03 }: { color?: string; opacity?: number }) {
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
   8. DAMASK PATTERN — Full ornate damask for section backgrounds
   -------------------------------------------------------------------------- */
export function DamaskPattern({ color = '#C0A882', opacity = 0.04 }: { color?: string; opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg width='100' height='120' viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg'><g fill='none' stroke='${color}' stroke-width='0.5'><path d='M50 10 C54 18, 60 22, 64 28 C68 36, 60 42, 50 44 C40 42, 32 36, 36 28 C40 22, 46 18, 50 10Z'/><path d='M50 10 C50 6, 48 3, 50 0'/><path d='M50 44 L50 50'/><path d='M36 28 C30 26, 26 22, 20 24 C16 26, 18 32, 22 34 C26 36, 30 34, 36 28Z'/><path d='M64 28 C70 26, 74 22, 80 24 C84 26, 82 32, 78 34 C74 36, 70 34, 64 28Z'/><path d='M50 50 C46 54, 42 56, 40 60 C38 66, 42 70, 50 70 C58 70, 62 66, 60 60 C58 56, 54 54, 50 50Z'/><circle cx='50' cy='30' r='4'/><circle cx='50' cy='60' r='3'/><path d='M40 60 C34 62, 30 66, 28 72 C26 78, 30 82, 36 80 C40 78, 42 74, 40 68'/><path d='M60 60 C66 62, 70 66, 72 72 C74 78, 70 82, 64 80 C60 78, 58 74, 60 68'/><path d='M50 70 C50 76, 48 82, 50 90 C52 98, 56 104, 50 110 C44 104, 48 98, 50 90'/><path d='M50 110 L50 120'/><circle cx='0' cy='60' r='2.5'/><circle cx='100' cy='60' r='2.5'/><path d='M0 60 C6 56, 10 50, 14 52 C18 54, 16 60, 12 62 C8 64, 4 62, 0 60Z'/><path d='M100 60 C94 56, 90 50, 86 52 C82 54, 84 60, 88 62 C92 64, 96 62, 100 60Z'/></g></svg>`
        )}")`,
        backgroundSize: '100px 120px',
      }}
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
  const opacityMap: Record<string, number> = { subtle: 0.04, medium: 0.08, strong: 0.14 }
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
   10. STAR ROSETTE (geometric Victorian medallion)
   -------------------------------------------------------------------------- */
export function CharroStar({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      {/* 8-pointed star/snowflake */}
      {[0, 45, 90, 135].map(deg => (
        <line key={deg} x1="12" y1="3" x2="12" y2="21"
          stroke={color} strokeWidth="0.8" opacity="0.3"
          transform={`rotate(${deg} 12 12)`} />
      ))}
      {/* Petal shapes at cardinal points */}
      {[0, 90, 180, 270].map(deg => (
        <path key={`p${deg}`}
          d="M12 3 C14 6, 14 8, 12 9 C10 8, 10 6, 12 3Z"
          fill={color} opacity="0.2"
          transform={`rotate(${deg} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="0.8" fill="none" opacity="0.35" />
      <circle cx="12" cy="12" r="1.5" fill={color} opacity="0.5" />
    </svg>
  )
}

/* --------------------------------------------------------------------------
   11. ROPE LINE
   -------------------------------------------------------------------------- */
export function RopeLine({ color, className = '' }: { color: string; className?: string }) {
  return (
    <div className={`h-1 w-full ${className}`}
      style={{
        opacity: 0.25,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg width='16' height='4' viewBox='0 0 16 4' xmlns='http://www.w3.org/2000/svg'><path d='M0 2 Q4 0, 8 2 Q12 4, 16 2' stroke='${color}' stroke-width='1.5' fill='none'/></svg>`
        )}")`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '16px 4px',
      }}
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
   17. CENTER MEDALLION / WREATH — Circular ornate frame
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
      <svg viewBox="0 0 200 200" fill="none" className="absolute inset-0 w-full h-full">
        {/* Outer wreath ring of petals */}
        {Array.from({ length: 24 }).map((_, i) => {
          const deg = i * 15
          return (
            <path key={`petal-${i}`}
              d="M100 18 C104 26, 106 32, 100 38 C94 32, 96 26, 100 18Z"
              fill={color} opacity={i % 2 === 0 ? "0.25" : "0.18"}
              transform={`rotate(${deg} 100 100)`} />
          )
        })}
        {/* Inner circle */}
        <circle cx="100" cy="100" r="55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.45" />
        <circle cx="100" cy="100" r="50" stroke={color} strokeWidth="0.5" fill="none" opacity="0.25" />
        {/* Small dots at cardinal points */}
        {[0, 90, 180, 270].map(deg => (
          <circle key={`cd-${deg}`} cx="100" cy="16" r="2" fill={color} opacity="0.35"
            transform={`rotate(${deg} 100 100)`} />
        ))}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {children}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   18. SIDE BORDER SCROLLWORK — Vertical ornamental border
   -------------------------------------------------------------------------- */
export function SideBorderScrollwork({ color, side = 'left', className = '' }: {
  color: string
  side?: 'left' | 'right'
  className?: string
}) {
  return (
    <div className={`absolute ${side === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} top-[8%] bottom-[8%] w-6 sm:w-8 pointer-events-none z-10 ${className}`}
      style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}>
      <svg viewBox="0 0 16 300" fill="none" preserveAspectRatio="none" className="w-full h-full">
        {/* Main vertical line */}
        <line x1="8" y1="0" x2="8" y2="300" stroke={color} strokeWidth="0.7" opacity="0.2" />
        {/* Scrollwork curls at intervals */}
        {[30, 80, 130, 180, 230].map(y => (
          <React.Fragment key={y}>
            <path d={`M8 ${y} C3 ${y + 6}, 1 ${y + 14}, 3 ${y + 20} C5 ${y + 24}, 8 ${y + 22}, 8 ${y + 16}`}
              stroke={color} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
          </React.Fragment>
        ))}
        {/* Center rosette */}
        <circle cx="6" cy="150" r="4" stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" />
        <circle cx="6" cy="150" r="1.5" fill={color} opacity="0.25" />
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <ellipse key={`sb-${deg}`} cx="6" cy="146" rx="1" ry="2.5" fill={color} opacity="0.12"
            transform={`rotate(${deg} 6 150)`} />
        ))}
      </svg>
    </div>
  )
}
