"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Heart, Clock } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function CountdownClassicVariant({
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
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg: cardBgColor, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)

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
        // Get days in previous month
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
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 sm:mb-6"></div>
            <div className="flex justify-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-20 w-20 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  // Build all available units based on config
  // Use plural forms by default, singular when value is 1
  const getLabel = (value: number, singular: string, plural: string) => value === 1 ? t(singular) : t(plural)
  
  const allUnits = [
    { value: timeLeft.years, label: getLabel(timeLeft.years, 'countdown.year', 'countdown.years'), enabled: showYears, hasValue: timeLeft.years > 0 },
    { value: timeLeft.months, label: getLabel(timeLeft.months, 'countdown.month', 'countdown.months'), enabled: showMonths, hasValue: timeLeft.years > 0 || timeLeft.months > 0 },
    { value: timeLeft.days, label: getLabel(timeLeft.days, 'countdown.day', 'countdown.days'), enabled: showDays, hasValue: true },
    { value: timeLeft.hours, label: getLabel(timeLeft.hours, 'countdown.hour', 'countdown.hours'), enabled: showHours, hasValue: true },
    { value: timeLeft.minutes, label: getLabel(timeLeft.minutes, 'countdown.minute', 'countdown.minutes'), enabled: showMinutes, hasValue: true },
    { value: timeLeft.seconds, label: getLabel(timeLeft.seconds, 'countdown.second', 'countdown.seconds'), enabled: showSeconds, hasValue: true },
  ]

  // Smart display: show 4 most relevant units that are enabled
  const enabledUnits = allUnits.filter(u => u.enabled && u.hasValue)
  const units = enabledUnits.slice(0, 4)

  // Color scheme - use titleColor for high contrast numbers, bodyTextColor for labels
  const numberColor = isColored ? titleColor : theme?.colors?.primary  // Use darkest color for numbers (high contrast)
  const labelColor = isColored ? bodyTextColor : theme?.colors?.muted  // Use body text color for labels
  const messageColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const cardBorderColor = isColored ? subtitleColor : theme?.colors?.accent
  const iconColor = isColored ? sectionTextColor : theme?.colors?.accent

  return (
    <SectionWrapper 
      id="countdown"
      theme={isColored ? undefined : theme} 
      alignment={alignment}
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
        <div className="text-center py-4 sm:py-6 md:py-8 px-4">
          {sectionTitle && (
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ 
                color: messageColor,
                fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 
                           theme?.fonts?.heading === 'script' ? 'cursive' : 'sans-serif'
              }}
            >
              {sectionTitle}
            </h2>
          )}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 fill-current flex-shrink-0" style={{ color: iconColor }} />
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold italic"
              style={{ 
                color: messageColor,
                fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 
                           theme?.fonts?.heading === 'script' ? 'cursive' : 'sans-serif'
              }}
            >
              {displayMessage}
            </h2>
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 fill-current flex-shrink-0" style={{ color: iconColor }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-xl sm:max-w-2xl md:max-w-4xl mx-auto px-4">
            {units.map((unit, index) => {
              return (
                <div key={unit.label} className="text-center">
                  <div 
                    className={`relative rounded-lg shadow-lg border-2 p-3 sm:p-4 md:p-6 lg:p-8 ${isColored ? '' : 'bg-white'}`}
                    style={{ 
                      backgroundColor: isColored ? cardBgColor : undefined,
                      borderColor: cardBorderColor,
                      boxShadow: isColored ? `0 8px 32px rgba(0,0,0,0.15)` : `0 4px 20px ${theme?.colors?.accent}20`
                    }}
                  >
                    <div 
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2"
                      style={{ 
                        color: numberColor,
                        fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {unit.value.toString().padStart(2, '0')}
                    </div>
                    <div 
                      className="text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide"
                      style={{ color: labelColor }}
                    >
                      {unit.label}
                    </div>
                    
                    {/* Decorative corner elements - hidden on smallest screens */}
                    <div className="hidden sm:block absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg" 
                         style={{ borderColor: cardBorderColor }} />
                    <div className="hidden sm:block absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg" 
                         style={{ borderColor: cardBorderColor }} />
                    <div className="hidden sm:block absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg" 
                         style={{ borderColor: cardBorderColor }} />
                    <div className="hidden sm:block absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 rounded-br-lg" 
                         style={{ borderColor: cardBorderColor }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Decorative elements */}
          <div className="mt-8 sm:mt-10 md:mt-12 flex items-center justify-center space-x-4">
            <div className="w-12 sm:w-16 h-px" style={{ backgroundColor: isColored ? 'rgba(255,255,255,0.6)' : theme?.colors?.accent }} />
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: iconColor }} />
            <div className="w-12 sm:w-16 h-px" style={{ backgroundColor: isColored ? 'rgba(255,255,255,0.6)' : theme?.colors?.accent }} />
          </div>
        </div>
    </SectionWrapper>
  )
}
