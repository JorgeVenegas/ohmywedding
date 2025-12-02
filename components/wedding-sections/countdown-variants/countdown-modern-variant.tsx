"use client"

import React, { useState, useEffect } from 'react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function CountdownModernVariant({
  weddingDate,
  theme,
  alignment,
  showYears = true,
  showMonths = true,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  message,
  useColorBackground = false,
  backgroundColorChoice
}: BaseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isClient, setIsClient] = useState(false)
  const { t } = useI18n()

  // Use translated default if not provided
  const displayMessage = message || t('countdown.untilWeSayIDo')

  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor, sectionTextColor, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const calculateTimeLeft = () => {
      const wedding = new Date(weddingDate)
      const now = new Date()
      
      if (wedding.getTime() <= now.getTime()) {
        setTimeLeft({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      let years = wedding.getFullYear() - now.getFullYear()
      let months = wedding.getMonth() - now.getMonth()
      let days = wedding.getDate() - now.getDate()
      let hours = wedding.getHours() - now.getHours()
      let minutes = wedding.getMinutes() - now.getMinutes()
      let seconds = wedding.getSeconds() - now.getSeconds()

      if (seconds < 0) { seconds += 60; minutes-- }
      if (minutes < 0) { minutes += 60; hours-- }
      if (hours < 0) { hours += 24; days-- }
      if (days < 0) {
        const prevMonth = new Date(wedding.getFullYear(), wedding.getMonth(), 0)
        days += prevMonth.getDate()
        months--
      }
      if (months < 0) { months += 12; years-- }

      setTimeLeft({ years, months, days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [weddingDate, isClient])

  if (!isClient) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="countdown">
        <div className="text-center py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4 sm:mb-6"></div>
            <div className="flex justify-center space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 w-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  const allUnits = [
    { value: timeLeft.years, label: 'YRS', enabled: showYears, hasValue: timeLeft.years > 0 },
    { value: timeLeft.months, label: 'MOS', enabled: showMonths, hasValue: timeLeft.years > 0 || timeLeft.months > 0 },
    { value: timeLeft.days, label: 'DAYS', enabled: showDays, hasValue: true },
    { value: timeLeft.hours, label: 'HRS', enabled: showHours, hasValue: true },
    { value: timeLeft.minutes, label: 'MIN', enabled: showMinutes, hasValue: true },
    { value: timeLeft.seconds, label: 'SEC', enabled: showSeconds, hasValue: true },
  ]

  const enabledUnits = allUnits.filter(u => u.enabled && u.hasValue)
  const units = enabledUnits.slice(0, 4)

  // Color scheme - use titleColor for high contrast numbers
  const numberColor = isColored ? titleColor : theme?.colors?.primary  // Use darkest color for numbers (high contrast)
  const labelColor = isColored ? bodyTextColor : theme?.colors?.accent
  const barColor = isColored ? subtitleColor : theme?.colors?.accent

  return (
    <SectionWrapper 
      id="countdown"
      theme={isColored ? undefined : theme} 
      alignment={alignment}
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
        <div className="text-center py-6 sm:py-8">
          <p 
            className={`text-xs sm:text-sm md:text-base uppercase tracking-[0.3em] mb-4 sm:mb-6 font-medium ${isColored ? '' : 'text-gray-500'}`}
            style={isColored ? { color: colorLight } : undefined}
          >
            {displayMessage}
          </p>

          <div className="flex justify-center items-stretch flex-wrap gap-3 md:gap-4">
            {units.map((unit) => (
              <div 
                key={unit.label}
                className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6 min-w-[70px] sm:min-w-[85px] md:min-w-[100px] ${
                  isColored 
                    ? 'shadow-lg' 
                    : 'bg-gray-50 border border-gray-100'
                }`}
                style={isColored ? { 
                  backgroundColor: cardBg,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                } : undefined}
              >
                <div className="relative z-10">
                  <div 
                    className={`text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums`}
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      color: numberColor
                    }}
                  >
                    {unit.value.toString().padStart(2, '0')}
                  </div>
                  <div 
                    className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider mt-1"
                    style={{ color: labelColor }}
                  >
                    {unit.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Accent bar */}
          <div className="mt-10 flex justify-center">
            <div 
              className="w-16 h-1 rounded-full"
              style={{ backgroundColor: barColor }}
            />
          </div>
        </div>
    </SectionWrapper>
  )
}
