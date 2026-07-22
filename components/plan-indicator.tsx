"use client"

import React, { useState } from 'react'
import { Clock, Crown, Sparkles } from 'lucide-react'
import { useSubscriptionContext } from '@/components/contexts/subscription-context'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { usePathname } from 'next/navigation'
import { planLabel } from '@/lib/subscription-shared'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function PlanIndicator() {
  const { invitationTier, managementTier, hasPaidPlan, loading, weddingId } = useSubscriptionContext()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const pathname = usePathname()

  if (pathname?.includes('/seating')) return null
  if (loading) return null

  const label = hasPaidPlan
    ? planLabel(invitationTier, managementTier)
    : 'Trial'

  const Icon = hasPaidPlan
    ? (invitationTier === 'bespoke' || managementTier === 'agency' ? Crown : Sparkles)
    : Clock

  const isOutline = !hasPaidPlan
  const bgGradient = !hasPaidPlan
    ? ''
    : invitationTier === 'bespoke' || managementTier === 'agency'
    ? 'from-[#8B0000] via-[#A52A2A] to-[#800020]'
    : 'from-[#DDA46F] via-[#c99560] to-[#DDA46F]'
  const textColor = !hasPaidPlan ? 'text-[#420c14]/40' : 'text-white'
  const description = hasPaidPlan
    ? `${planLabel(invitationTier, managementTier)} plan active`
    : 'Free trial — upgrade to unlock all features'

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={() => { if (!hasPaidPlan) setShowUpgradeModal(true) }}
              className="fixed bottom-6 right-6 z-50 group"
              aria-label={`${label} plan${!hasPaidPlan ? ' - click to upgrade' : ''}`}
            >
              <div className={`
                relative overflow-hidden rounded-full px-4 py-2.5
                ${isOutline
                  ? 'bg-background/90 backdrop-blur-sm border-2 border-[#420c14]/20 shadow-sm'
                  : `bg-gradient-to-r ${bgGradient} shadow-lg`}
                transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-xl
                flex items-center gap-2
                ${!hasPaidPlan ? 'cursor-pointer' : ''}
              `}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
                </div>

                <Icon className={`w-4 h-4 ${textColor} relative z-10`} />
                <span className={`text-sm font-semibold ${textColor} relative z-10`}>
                  {label}
                </span>

                {!hasPaidPlan && (
                  <svg className={`w-3 h-3 ${textColor} relative z-10 transition-transform group-hover:translate-x-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                )}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="max-w-xs bg-background/95 backdrop-blur-sm border-2"
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {label}
              </p>
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
              {!hasPaidPlan && (
                <p className="text-xs font-medium text-primary">
                  Click to compare plans & upgrade →
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="plan_indicator"
        weddingId={weddingId ?? undefined}
      />
    </>
  )
}
