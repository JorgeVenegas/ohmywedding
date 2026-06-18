"use client"

import React, { useState, useEffect } from 'react'
import { AnimatedCountdownUnit } from './animated-countdown-unit'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { AnimatedSection } from '../animated-section'

// Editorial defaults — only used when no color is chosen via config
const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.13)'

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
    years: Math.floor(totalDays / 365),
    months: Math.floor((totalDays % 365) / 30),
    days: totalDays % 30,
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  }
}

interface CountdownOldMoneyVariantProps extends BaseCountdownProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function CountdownOldMoneyVariant({
  weddingDate,
  theme,
  alignment,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  sectionTitle,
  sectionSubtitle,
  useColorBackground,
  backgroundColorChoice,
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
}: CountdownOldMoneyVariantProps) {
  const { t } = useI18n()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(weddingDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calculateTimeLeft(weddingDate)), 1000)
    return () => clearInterval(id)
  }, [weddingDate])

  // Resolve colors — use theme when a color is chosen, otherwise editorial palette
  const { bgColor, sectionTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const sectionBg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.foreground || EDITORIAL_INK)
  const primary = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.primary || EDITORIAL_INK)
  const muted = isColored ? (theme?.colors?.secondary || sectionTextColor || EDITORIAL_MUTED) : (theme?.colors?.muted || EDITORIAL_MUTED)
  const hairline = isColored
    ? (theme?.colors?.secondary || `${sectionTextColor}CC` || EDITORIAL_HAIRLINE)
    : (theme?.colors?.primary ? `${theme.colors.primary}20` : EDITORIAL_HAIRLINE)

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
      className="w-full relative overflow-hidden"
      style={{ backgroundColor: sectionBg, paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
    >
      <div className="max-w-5xl mx-auto px-8 sm:px-14 md:px-20">

        {/* Section heading — div avoids global h2 !important font-size override */}
        {sectionTitle && (
          <AnimatedSection className="mb-14 sm:mb-20">
            <div>
              {sectionSubtitle && (
                <p
                  data-custom-font
                  className="text-[10px] uppercase tracking-[0.5em] mb-5"
                  style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '10px' }}
                >
                  {sectionSubtitle}
                </p>
              )}
              <div
                role="heading"
                aria-level={2}
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                  color: primary,
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                }}
              >
                {sectionTitle}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Top hairline */}
        <div style={{ height: '1px', background: hairline, marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }} />

        {/* Numbers — monumental typographic display */}
        <div className="flex items-start justify-center gap-0 flex-wrap sm:flex-nowrap">
          {units.map((unit, i) => (
            <AnimatedCountdownUnit
              key={unit.label}
              index={i}
              className="flex-1 text-center min-w-[4rem]"
            >
              <div
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontWeight: 300,
                  fontSize: 'clamp(4rem, 11vw, 9.5rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: ink,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(unit.value).padStart(2, '0')}
              </div>
              <p
                data-custom-font
                className="mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.45em]"
                style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '10px' }}
              >
                {unit.label}
              </p>
            </AnimatedCountdownUnit>
          ))}
        </div>

        {/* Bottom hairline */}
        <div style={{ height: '1px', background: hairline, marginTop: 'clamp(2.5rem, 5vw, 4rem)' }} />
      </div>
    </section>
  )
}
