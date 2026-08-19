"use client"

import { motion } from "framer-motion"
import { Crown, Check, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PricingTierCardProps {
  name: string
  tagline: string
  description: string
  priceDisplay: string
  period: string
  features: string[]
  isFeatured?: boolean
  isTop?: boolean
  mostPopularLabel: string
  luxuryLabel: string
  ctaLabel: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  delay?: number
}

export function PricingTierCard({
  name,
  tagline,
  description,
  priceDisplay,
  period,
  features,
  isFeatured,
  isTop,
  mostPopularLabel,
  luxuryLabel,
  ctaLabel,
  loading,
  disabled,
  onClick,
  delay = 0,
}: PricingTierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 ${
        isFeatured
          ? 'bg-[#420c14] border-2 border-[#420c14]'
          : isTop
          ? 'bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]'
          : 'bg-white border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5'
      }`}
    >
      {isFeatured && (
        <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#f5f2eb] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider whitespace-nowrap">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            {mostPopularLabel}
          </span>
        </div>
      )}
      {isTop && (
        <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#420c14] text-[#f5f2eb] text-xs sm:text-sm font-medium tracking-wider whitespace-nowrap">
            <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
            {luxuryLabel}
          </span>
        </div>
      )}

      <div className={isFeatured || isTop ? 'pt-2 sm:pt-4' : ''}>
        <h3 className={`text-2xl sm:text-3xl font-serif mb-1 ${isFeatured ? 'text-[#f5f2eb]' : 'text-[#420c14]'}`}>
          {name}
        </h3>
        <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isFeatured ? 'text-[#DDA46F]' : isTop ? 'text-[#420c14]/70' : 'text-[#DDA46F]'}`}>
          {tagline}
        </p>
        <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${isFeatured ? 'text-[#f5f2eb]/60' : 'text-[#420c14]/80'}`}>
          {description}
        </p>

        <div className="mb-8 sm:mb-10">
          <span className={`text-4xl sm:text-6xl font-serif ${isFeatured ? 'text-[#f5f2eb]' : 'text-[#420c14]'}`}>
            {priceDisplay}
          </span>
          <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${isFeatured ? 'text-[#f5f2eb]/60' : 'text-[#420c14]/70'}`}>
            {period}
          </span>
        </div>

        <Button
          onClick={onClick}
          disabled={disabled || loading}
          className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
            isFeatured
              ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]'
              : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
          }`}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {ctaLabel}
        </Button>

        <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isFeatured ? 'bg-[#DDA46F]/30 text-[#DDA46F]' : 'bg-[#420c14]/20 text-[#420c14]'
              }`}>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className={`text-sm sm:text-base ${isFeatured ? 'text-[#f5f2eb]/80' : 'text-[#420c14]/90'}`}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
