'use client'

import { Sparkles, Crown, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { CardFeature } from '@/lib/pricing-card-content'

export interface PlanCardData {
  name: string
  tagline: string
  description: string
  priceDisplayMXN: string
  period: string
  features: readonly CardFeature[]
  cta: string
}

interface PlanCardProps {
  card: PlanCardData
  isFeatured?: boolean
  isTop?: boolean
  badgeLabel?: string
  badgeIcon?: ReactNode
  loading?: boolean
  onCheckout: () => void
  index?: number
  // 'split' puts the benefits list to the right of the price/CTA at the lg
  // breakpoint instead of stacking underneath — used for the single hero cards,
  // not the 3-up compare grid (which stays 'stacked' at any width).
  layout?: 'stacked' | 'split'
}

export function PlanCard({ card, isFeatured, isTop, badgeLabel, badgeIcon, loading, onCheckout, index = 0, layout = 'stacked' }: PlanCardProps) {
  const isSplit = layout === 'split'

  const priceBlock = (
    <div className="mb-8 sm:mb-10 lg:mb-0">
      <span className={`text-4xl sm:text-6xl font-serif ${isFeatured ? 'text-[#f5f2eb]' : 'text-[#420c14]'}`}>
        {card.priceDisplayMXN}
      </span>
      <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${
        isFeatured ? 'text-[#f5f2eb]/60' : isTop ? 'text-[#420c14]/70' : 'text-[#420c14]/60'
      }`}>{card.period}</span>
    </div>
  )

  const ctaBlock = (
    <div className={isSplit ? 'space-y-3 lg:mt-6' : 'space-y-3'}>
      <Button
        onClick={onCheckout}
        disabled={loading}
        className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
          isFeatured ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]' : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
        }`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {card.cta}
      </Button>
    </div>
  )

  const featuresBlock = (
    <div className={isSplit ? 'mt-8 sm:mt-10 lg:mt-0 space-y-4 sm:space-y-5' : 'mt-8 sm:mt-10 space-y-4 sm:space-y-5'}>
      {card.features.map((feature, featureIndex) => (
        <div key={featureIndex} className="flex items-center gap-3 sm:gap-4">
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isFeatured ? 'bg-[#DDA46F]/30 text-[#DDA46F]' : isTop ? 'bg-[#420c14]/20 text-[#420c14]' : 'bg-[#420c14]/10 text-[#420c14]'
          }`}>
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className={`text-sm sm:text-base ${feature.highlight ? 'font-semibold' : 'font-normal'} ${
            isFeatured
              ? (feature.highlight ? 'text-[#f5f2eb]' : 'text-[#f5f2eb]/55')
              : isTop
                ? (feature.highlight ? 'text-[#420c14]' : 'text-[#420c14]/65')
                : (feature.highlight ? 'text-[#420c14]' : 'text-[#420c14]/55')
          }`}>
            {feature.text}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, delay: index * 0.15 }}
      className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 ${isSplit ? 'lg:p-10' : ''} ${
        isFeatured
          ? 'bg-[#420c14] border-2 border-[#420c14] md:-mt-4 md:mb-4'
          : isTop
            ? 'bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]'
            : 'bg-white border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5'
      }`}
    >
      {isFeatured && (
        <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#f5f2eb] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider">
            {badgeIcon ?? <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />}
            {badgeLabel ?? 'Most Popular'}
          </span>
        </div>
      )}
      {isTop && !isFeatured && (
        <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#420c14] text-[#f5f2eb] text-xs sm:text-sm font-medium tracking-wider">
            {badgeIcon ?? <Crown className="w-3 h-3 sm:w-4 sm:h-4" />}
            {badgeLabel ?? 'Luxury'}
          </span>
        </div>
      )}

      <div className={`${isFeatured || isTop ? 'pt-2 sm:pt-4' : ''} ${isSplit ? 'lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-x-12 lg:items-start' : ''}`}>
        <div>
          <h4 className={`text-2xl sm:text-3xl font-serif mb-1 ${isFeatured ? 'text-[#f5f2eb]' : 'text-[#420c14]'}`}>
            {card.name}
          </h4>
          <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isFeatured ? 'text-[#DDA46F]' : isTop ? 'text-[#420c14]/70' : 'text-[#DDA46F]'}`}>
            {card.tagline}
          </p>
          <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${
            isFeatured ? 'text-[#f5f2eb]/60' : isTop ? 'text-[#420c14]/80' : 'text-[#420c14]/60'
          }`}>{card.description}</p>

          {priceBlock}
          {ctaBlock}
        </div>

        {featuresBlock}
      </div>
    </motion.div>
  )
}
