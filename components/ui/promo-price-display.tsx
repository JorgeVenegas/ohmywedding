'use client'

import React from 'react'
import { Tag } from 'lucide-react'

interface PromoPriceDisplayProps {
  originalPriceCents: number
  discountedPriceCents: number
  discountPercent: number
  discountLabel: string
  currency?: string
  /** 'light' for dark backgrounds, 'dark' for light backgrounds */
  variant?: 'light' | 'dark' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PromoPriceDisplay({
  originalPriceCents,
  discountedPriceCents,
  discountPercent,
  discountLabel,
  currency = 'MXN',
  variant = 'dark',
  size = 'lg',
  showBadge = true,
}: PromoPriceDisplayProps) {
  const hasDiscount = discountPercent > 0 && discountedPriceCents < originalPriceCents

  const colors = {
    light: {
      original: 'text-[#f5f2eb]/40',
      discounted: 'text-[#f5f2eb]',
      badge: 'bg-green-500/20 text-green-300 border-green-400/30',
      period: 'text-[#f5f2eb]/60',
    },
    dark: {
      original: 'text-[#420c14]/40',
      discounted: 'text-[#420c14]',
      badge: 'bg-green-50 text-green-700 border-green-200',
      period: 'text-[#420c14]/60',
    },
    gold: {
      original: 'text-[#420c14]/40',
      discounted: 'text-[#420c14]',
      badge: 'bg-[#DDA46F]/10 text-[#DDA46F] border-[#DDA46F]/30',
      period: 'text-[#420c14]/70',
    },
  }

  const sizes = {
    sm: { price: 'text-2xl sm:text-3xl', original: 'text-sm sm:text-base', badge: 'text-[10px]', period: 'text-xs' },
    md: { price: 'text-3xl sm:text-4xl', original: 'text-base sm:text-lg', badge: 'text-xs', period: 'text-sm' },
    lg: { price: 'text-4xl sm:text-6xl', original: 'text-lg sm:text-xl', badge: 'text-xs', period: 'text-sm sm:text-base' },
  }

  const c = colors[variant]
  const s = sizes[size]

  if (!hasDiscount) {
    return (
      <div>
        <span className={`${s.price} font-serif ${c.discounted}`}>
          {formatPrice(originalPriceCents)}
        </span>
        <span className={`ml-2 sm:ml-3 ${s.period} ${c.period}`}>{currency}</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {showBadge && (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] sm:${s.badge} font-medium tracking-wide ${c.badge}`}>
          <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          {discountLabel} &mdash; {discountPercent}% off
        </div>
      )}
      <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
        <span className={`${s.price} font-serif ${c.discounted}`}>
          {formatPrice(discountedPriceCents)}
        </span>
        <span className={`${s.original} ${c.original} line-through`}>
          {formatPrice(originalPriceCents)}
        </span>
        <span className={`${s.period} ${c.period}`}>{currency}</span>
      </div>
    </div>
  )
}

/** Inline version for comparison tables and smaller contexts */
export function PromoPriceInline({
  originalPriceCents,
  discountedPriceCents,
  discountPercent,
  variant = 'dark',
}: {
  originalPriceCents: number
  discountedPriceCents: number
  discountPercent: number
  variant?: 'light' | 'dark' | 'gold'
}) {
  const hasDiscount = discountPercent > 0 && discountedPriceCents < originalPriceCents
  const colors = {
    light: { original: 'text-[#f5f2eb]/40', discounted: 'text-[#f5f2eb]' },
    dark: { original: 'text-[#420c14]/40', discounted: 'text-[#420c14]' },
    gold: { original: 'text-[#420c14]/40', discounted: 'text-[#DDA46F]' },
  }
  const c = colors[variant]

  if (!hasDiscount) {
    return <span className={`text-xs sm:text-sm ${c.discounted}`}>{formatPrice(originalPriceCents)}</span>
  }

  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className={`text-xs sm:text-sm font-medium ${c.discounted}`}>{formatPrice(discountedPriceCents)}</span>
      <span className={`text-[10px] sm:text-xs line-through ${c.original}`}>{formatPrice(originalPriceCents)}</span>
    </span>
  )
}
