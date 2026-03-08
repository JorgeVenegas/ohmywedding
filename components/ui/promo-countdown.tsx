'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import type { GlobalDiscount } from '@/hooks/use-global-discount'

interface PromoCountdownProps {
  discount: GlobalDiscount | null
  /** 'light' for dark backgrounds, 'dark' for light backgrounds */
  variant?: 'light' | 'dark'
  className?: string
}

function getTimeRemaining(endsAt: string): number {
  return new Date(endsAt).getTime() - Date.now()
}

function formatCountdown(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, ms)
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / 1000 / 60 / 60) % 24)
  const days = Math.floor(total / 1000 / 60 / 60 / 24)
  return { days, hours, minutes, seconds }
}

function formatEndDate(endsAt: string): string {
  return new Date(endsAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const THREE_DAYS_MS = 3 * ONE_DAY_MS

export function PromoCountdown({ discount, variant = 'dark', className = '' }: PromoCountdownProps) {
  const { t } = useTranslation()
  const [msLeft, setMsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!discount?.ends_at) return

    const remaining = getTimeRemaining(discount.ends_at)
    if (remaining <= 0) return

    setMsLeft(remaining)

    const interval = setInterval(() => {
      const r = getTimeRemaining(discount.ends_at!)
      if (r <= 0) {
        setMsLeft(0)
        clearInterval(interval)
      } else {
        setMsLeft(r)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [discount?.ends_at])

  if (!discount?.ends_at || msLeft === null || msLeft <= 0) return null

  const isUrgent = msLeft < ONE_DAY_MS
  const isWarning = msLeft < THREE_DAYS_MS
  const showLiveCountdown = msLeft < THREE_DAYS_MS

  const lightStyles = {
    wrapper: isUrgent
      ? 'border-red-400/40 bg-red-500/10'
      : isWarning
        ? 'border-amber-400/40 bg-amber-500/10'
        : 'border-[#DDA46F]/40 bg-[#DDA46F]/10',
    icon: isUrgent ? 'text-red-300' : isWarning ? 'text-amber-300' : 'text-[#DDA46F]',
    label: isUrgent ? 'text-red-200' : isWarning ? 'text-amber-200' : 'text-[#f5f2eb]/80',
    value: isUrgent ? 'text-red-100' : isWarning ? 'text-amber-100' : 'text-[#f5f2eb]',
    dot: isUrgent ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-[#DDA46F]',
  }

  const darkStyles = {
    wrapper: isUrgent
      ? 'border-red-300/40 bg-red-50'
      : isWarning
        ? 'border-amber-300/40 bg-amber-50'
        : 'border-[#DDA46F]/30 bg-[#DDA46F]/8',
    icon: isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#DDA46F]',
    label: isUrgent ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-[#420c14]/70',
    value: isUrgent ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-[#420c14]',
    dot: isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#DDA46F]',
  }

  const s = variant === 'light' ? lightStyles : darkStyles
  const c = formatCountdown(msLeft)

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${s.wrapper} ${className}`}
    >
      <span className={`relative flex h-2 w-2 flex-shrink-0`}>
        {isUrgent && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
      </span>
      <Clock className={`w-3 h-3 flex-shrink-0 ${s.icon}`} />
      {showLiveCountdown ? (
        <span className={s.label}>
          {isUrgent && <span className={`${s.value} font-semibold mr-1`}>{t('landing.pricing.promoCountdown.hurry')}</span>}
          {t('landing.pricing.promoCountdown.endsIn')}{' '}
          <span className={`font-semibold ${s.value}`}>
            {c.days > 0 && `${c.days}${t('landing.pricing.promoCountdown.days')} `}
            {`${c.hours}${t('landing.pricing.promoCountdown.hours')} ${String(c.minutes).padStart(2, '0')}${t('landing.pricing.promoCountdown.minutes')} ${String(c.seconds).padStart(2, '0')}${t('landing.pricing.promoCountdown.seconds')}`}
          </span>
        </span>
      ) : (
        <span className={s.label}>
          {t('landing.pricing.promoCountdown.endsOn')}{' '}
          <span className={`font-semibold ${s.value}`}>{formatEndDate(discount.ends_at)}</span>
        </span>
      )}
    </motion.div>
  )
}
