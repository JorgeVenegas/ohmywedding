"use client"

import React, { useState } from 'react'
import { Crown, Sparkles, Star } from 'lucide-react'
import { useSubscriptionContext } from '@/components/contexts/subscription-context'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { usePathname } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function PlanIndicator() {
  const { planType, loading } = useSubscriptionContext()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const pathname = usePathname()

  // Hide on pages with full-screen canvas editors
  if (pathname?.includes('/seating')) return null

  if (loading) {
    return null
  }

  const config = {
    free: {
      label: 'Free',
      icon: Star,
      bgGradient: 'from-slate-500 via-slate-600 to-slate-700',
      textColor: 'text-white',
      description: 'Up to 50 guests, 15 groups. Upgrade for more features!',
      clickable: true,
    },
    premium: {
      label: 'Premium',
      icon: Sparkles,
      bgGradient: 'from-[#DDA46F] via-[#c99560] to-[#DDA46F]',
      textColor: 'text-white',
      description: 'Up to 250 guests, unlimited groups, full RSVP system',
      clickable: false,
    },
    deluxe: {
      label: 'Deluxe',
      icon: Crown,
      bgGradient: 'from-[#8B0000] via-[#A52A2A] to-[#800020]',
      textColor: 'text-white',
      description: 'Unlimited guests, daily reports, priority support',
      clickable: false,
    },
  }

  const plan = config[planType as keyof typeof config]
  if (!plan) return null

  const Icon = plan.icon

  const handleClick = () => {
    if (plan.clickable) {
      setShowUpgradeModal(true)
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className="fixed bottom-6 right-6 z-50 group"
              aria-label={`${plan.label} plan${plan.clickable ? ' - click to upgrade' : ''}`}
            >
              <div className={`
                relative overflow-hidden rounded-full px-4 py-2.5 shadow-lg
                bg-gradient-to-r ${plan.bgGradient}
                transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-xl
                flex items-center gap-2
                ${plan.clickable ? 'cursor-pointer' : ''}
              `}>
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
                </div>

                {/* Content */}
                <Icon className={`w-4 h-4 ${plan.textColor} relative z-10`} />
                <span className={`text-sm font-semibold ${plan.textColor} relative z-10`}>
                  {plan.label}
                </span>

                {/* Upgrade arrow for free plan */}
                {plan.clickable && (
                  <svg className={`w-3 h-3 ${plan.textColor} relative z-10 transition-transform group-hover:translate-x-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                {plan.label} Plan
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.description}
              </p>
              {plan.clickable && (
                <p className="text-xs font-medium text-primary">
                  Click to compare plans & upgrade →
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Upgrade modal for free plan */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="plan_indicator"
      />
    </>
  )
}
