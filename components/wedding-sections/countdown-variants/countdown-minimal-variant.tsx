"use client"

import React, { useState, useEffect } from 'react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { AnimatedCountdownUnit } from './animated-countdown-unit'

export function CountdownMinimalVariant({
  weddingDate,
  theme,
  alignment,
  showYears = true,
  showMonths = true,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  sectionTitle,
  sectionSubtitle,
  message,
  useColorBackground = false,
  backgroundColorChoice
}: BaseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isClient, setIsClient] = useState(false)
  const { t } = useI18n()

  // Use translated defaults if not provided
  // sectionTitle is optional - only show if provided
  // For message: prefer sectionSubtitle, then message, then default
  const displayMessage = sectionSubtitle || message || t('countdown.untilWeSayIDo')

  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)

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

      // Calculate years and months difference
      let years = wedding.getFullYear() - now.getFullYear()
      let months = wedding.getMonth() - now.getMonth()
      let days = wedding.getDate() - now.getDate()
      let hours = wedding.getHours() - now.getHours()
      let minutes = wedding.getMinutes() - now.getMinutes()
      let seconds = wedding.getSeconds() - now.getSeconds()

      // Handle negative values by borrowing from larger units
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
            <div className="h-16 bg-gray-200 rounded w-80 mx-auto"></div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  // Build all available units based on config
  const allUnits = [
    { value: timeLeft.years, label: 'y', enabled: showYears, hasValue: timeLeft.years > 0 },
    { value: timeLeft.months, label: 'mo', enabled: showMonths, hasValue: timeLeft.years > 0 || timeLeft.months > 0 },
    { value: timeLeft.days, label: 'd', enabled: showDays, hasValue: true },
    { value: timeLeft.hours, label: 'h', enabled: showHours, hasValue: true },
    { value: timeLeft.minutes, label: 'm', enabled: showMinutes, hasValue: true },
    { value: timeLeft.seconds, label: 's', enabled: showSeconds, hasValue: true },
  ]

  // Smart display: show 4 most relevant units that are enabled
  const enabledUnits = allUnits.filter(u => u.enabled && u.hasValue)
  const units = enabledUnits.slice(0, 4)

  // Color scheme - use sectionTextColor for text elements
  const separatorClass = isColored ? '' : 'text-gray-300'
  const separatorColor = isColored ? sectionTextColorAlt : undefined

  return (
    <SectionWrapper 
      id="countdown"
      theme={isColored ? undefined : theme} 
      alignment={alignment}
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div 
        className="text-center py-20"
      >
          {sectionTitle && (
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
              style={{ 
                fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
                color: isColored ? sectionTextColor : theme?.colors?.foreground
              }}
            >
              {sectionTitle}
            </h2>
          )}
          <p 
            className={`text-lg md:text-xl mb-8 font-light ${isColored ? '' : 'text-gray-500'}`}
            style={{ 
              fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif',
              color: isColored ? sectionTextColorAlt : undefined
            }}
          >
            {displayMessage}
          </p>

          <div 
            className="flex justify-center items-baseline flex-wrap space-x-2 sm:space-x-3 md:space-x-4 gap-2"
          >
            {units.map((unit, index) => (
              <React.Fragment key={unit.label}>
                {index > 0 && (
                  <AnimatedCountdownUnit
                    index={index}
                    className={`text-xl sm:text-2xl md:text-4xl font-thin ${separatorClass}`}
                    style={{ color: separatorColor }}
                  >
                    :
                  </AnimatedCountdownUnit>
                )}
                <AnimatedCountdownUnit
                  index={index}
                  className="text-center"
                >
                  <span 
                    className="text-3xl sm:text-4xl md:text-7xl font-thin tabular-nums"
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      color: isColored ? sectionTextColor : '#111827'
                    }}
                  >
                    {unit.value.toString().padStart(2, '0')}
                  </span>
                  <span 
                    className="text-xs sm:text-sm md:text-base font-light ml-1"
                    style={{ color: isColored ? sectionTextColorAlt : theme?.colors?.accent }}
                  >
                    {unit.label}
                  </span>
                </AnimatedCountdownUnit>
              </React.Fragment>
            ))}
          </div>

          {/* Subtle accent line */}
          <div className="mt-12 flex justify-center items-center gap-2">
            {isColored ? (
              <>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sectionTextColorAlt, opacity: 0.6 }} />
                <div className="w-16 h-0.5 rounded-full" style={{ backgroundColor: sectionTextColor, opacity: 0.5 }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sectionTextColorAlt, opacity: 0.6 }} />
              </>
            ) : (
              <div className="w-24 h-px" style={{ backgroundColor: theme?.colors?.accent }} />
            )}
          </div>
        </div>
    </SectionWrapper>
  )
}
