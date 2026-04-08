"use client"

import React, { useState, useEffect } from 'react'
import { AnimatedCountdownUnit } from './animated-countdown-unit'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { CharroStar, FloralDivider, HaciendaTilePattern, CandleGlow, DetailedBorderDivider } from '../hacienda-ornaments'

function calculateTimeLeft(targetDate: string): TimeLeft {
  const target = new Date(targetDate + 'T00:00:00')
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  const totalSeconds = Math.floor(diff / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)
  return {
    years: Math.floor(totalDays / 365), months: Math.floor((totalDays % 365) / 30),
    days: totalDays % 30, hours: totalHours % 24, minutes: totalMinutes % 60, seconds: totalSeconds % 60,
  }
}

export function CountdownHaciendaVariant({
  weddingDate, theme, alignment,
  showDays = true, showHours = true, showMinutes = true, showSeconds = true,
  sectionTitle, sectionSubtitle,
  useColorBackground = true, backgroundColorChoice = 'primary',
}: BaseCountdownProps) {
  const { t } = useI18n()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(weddingDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calculateTimeLeft(weddingDate)), 1000)
    return () => clearInterval(id)
  }, [weddingDate])

  const { bgColor, sectionTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'
  // When bg is accent (gold), numbers must contrast — use primary (dark green)
  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const numberColor = isAccentBg ? primary : accent
  const labelColor = isColored ? (isAccentBg ? primary : `${secondary}CC`) : sectionTextColor || primary

  const showMonthsUnit = timeLeft.months > 0 || timeLeft.years > 0
  const units = [
    showMonthsUnit && { value: timeLeft.months, label: t('countdown.months') },
    showDays && { value: timeLeft.days, label: t('countdown.days') },
    showHours && { value: timeLeft.hours, label: t('countdown.hours') },
    showMinutes && { value: timeLeft.minutes, label: t('countdown.minutes') },
    showSeconds && { value: timeLeft.seconds, label: t('countdown.seconds') },
  ].filter(Boolean) as { value: number; label: string }[]

  return (
    <section
      id="countdown"
      className="w-full py-12 sm:py-14 md:py-16 relative overflow-hidden"
      style={{ backgroundColor: isColored ? bgColor : (theme?.colors?.secondary || '#FAF6EF') }}
    >
        <HaciendaTilePattern color={isAccentBg ? primary : accent} opacity={0.10} />
        <CandleGlow position="center" intensity="subtle" />
        <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-10 relative z-10">
          {sectionTitle && (
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-sm sm:text-base uppercase tracking-[0.35em] font-light"
                style={{ color: labelColor, fontFamily: 'var(--font-heading, serif)' }}>
                {sectionTitle}
              </h3>
              <div className="mt-3">
                <FloralDivider color={isAccentBg ? primary : accent} />
              </div>
            </div>
          )}

          {/* Asset 5 decorative banner above units */}
          <DetailedBorderDivider color={isAccentBg ? primary : accent} className="mb-6 opacity-75" />
          {/* Countdown units with charro star separators */}
          <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-8">
            {units.map((unit, i) => (
              <React.Fragment key={unit.label}>
                <AnimatedCountdownUnit index={i} className="text-center flex-1 sm:flex-none sm:min-w-[68px] md:min-w-[80px]">
                  <div className="relative">
                    {/* Ornate number frame */}
                    <div className="relative px-1 sm:px-2 py-1">
                      <div className="text-2xl sm:text-4xl md:text-5xl font-light tabular-nums leading-none"
                        style={{
                          color: numberColor, fontFamily: 'var(--font-heading, serif)',
                          textShadow: `0 0 25px ${numberColor}35, 0 2px 12px ${numberColor}25`,
                        }}>
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      {/* Warm underglow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full opacity-25 blur-sm"
                        style={{ backgroundColor: accent }} />
                    </div>
                  </div>
                  <div className="mt-2.5 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.3em] font-light"
                    style={{ color: labelColor }}>{unit.label}</div>
                </AnimatedCountdownUnit>

                {i < units.length - 1 && (
                  <div className="opacity-50 mt-[-8px] hidden sm:block">
                    <CharroStar color={isAccentBg ? primary : accent} size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {sectionSubtitle && (
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm font-light italic tracking-wide"
                style={{ color: labelColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                {sectionSubtitle}
              </p>
            </div>
          )}
        </div>
    </section>
  )
}
