"use client"

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function CountdownCircularVariant({
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
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 sm:mb-6"></div>
            <div className="flex justify-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-24 h-24 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  const CircularProgress = ({ value, max, label, unit }: { value: number, max: number, label: string, unit: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    // Color scheme: use high contrast colors for values, low contrast for decorative elements
    const bgStroke = isColored ? (isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)') : (theme?.colors?.muted ? theme.colors.muted + '30' : '#e5e7eb')
    const progressStroke = isColored ? subtitleColor : (theme?.colors?.primary || '#d4a574')
    const valueColor = isColored ? titleColor : theme?.colors?.foreground  // Darkest color for high contrast
    const unitColor = isColored ? bodyTextColor : theme?.colors?.muted
    const labelColor = isColored ? sectionTextColor : ''

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={bgStroke}
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={progressStroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className="text-xl md:text-3xl font-bold"
              style={{ 
                color: valueColor || theme?.colors?.foreground,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {value}
            </span>
            <span 
              className="text-xs md:text-sm font-medium"
              style={{ color: unitColor }}
            >
              {unit}
            </span>
          </div>
        </div>
        
        <p 
          className="mt-3 text-sm md:text-base font-medium"
          style={{ color: labelColor || theme?.colors?.foreground }}
        >
          {label}
        </p>
      </div>
    )
  }

  // Build all available units based on config with translated labels
  const getLabel = (value: number, singular: string, plural: string) => value === 1 ? t(singular) : t(plural)

  const allUnits = [
    { value: timeLeft.years, max: 10, label: getLabel(timeLeft.years, 'countdown.year', 'countdown.years'), unit: 'Y', enabled: showYears, hasValue: timeLeft.years > 0 },
    { value: timeLeft.months, max: 12, label: getLabel(timeLeft.months, 'countdown.month', 'countdown.months'), unit: 'Mo', enabled: showMonths, hasValue: timeLeft.years > 0 || timeLeft.months > 0 },
    { value: timeLeft.days, max: 31, label: getLabel(timeLeft.days, 'countdown.day', 'countdown.days'), unit: 'D', enabled: showDays, hasValue: true },
    { value: timeLeft.hours, max: 24, label: getLabel(timeLeft.hours, 'countdown.hour', 'countdown.hours'), unit: 'H', enabled: showHours, hasValue: true },
    { value: timeLeft.minutes, max: 60, label: getLabel(timeLeft.minutes, 'countdown.minute', 'countdown.minutes'), unit: 'M', enabled: showMinutes, hasValue: true },
    { value: timeLeft.seconds, max: 60, label: getLabel(timeLeft.seconds, 'countdown.second', 'countdown.seconds'), unit: 'S', enabled: showSeconds, hasValue: true },
  ]

  // Smart display: show 4 most relevant units that are enabled
  const enabledUnits = allUnits.filter(u => u.enabled && u.hasValue)
  const units = enabledUnits.slice(0, 4)

  // Color scheme: use white/opacity for decorative highlights
  const decorColor = isColored ? 'rgba(255,255,255,0.6)' : theme?.colors?.accent
  const messageColor = isColored ? 'text-white' : ''

  return (
    <SectionWrapper 
      id="countdown"
      theme={isColored ? undefined : theme} 
      alignment={alignment}
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
        <div className="text-center py-6 sm:py-8">
          {sectionTitle && (
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
              style={{ 
                color: isColored ? titleColor : theme?.colors?.foreground,
                fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 
                           theme?.fonts?.heading === 'script' ? 'cursive' : 'sans-serif'
              }}
            >
              {sectionTitle}
            </h2>
          )}
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Heart className="w-5 h-5 mr-2 fill-current" style={{ color: decorColor }} />
            <p 
              className={`text-xl md:text-2xl ${messageColor}`}
              style={{ 
                color: isColored ? undefined : theme?.colors?.foreground,
                fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 
                           theme?.fonts?.heading === 'script' ? 'cursive' : 'sans-serif'
              }}
            >
              {displayMessage}
            </p>
            <Heart className="w-5 h-5 ml-2 fill-current" style={{ color: decorColor }} />
          </div>

          <div className="flex justify-center items-center space-x-6 md:space-x-12 flex-wrap gap-6">
            {units.map((unit) => (
              <CircularProgress
                key={unit.label}
                value={unit.value}
                max={unit.max}
                label={unit.label}
                unit={unit.unit}
              />
            ))}
          </div>

          {/* Decorative bottom element */}
          <div className="mt-16 flex items-center justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i === 2 ? colorLight : decorColor }}
                />
              ))}
            </div>
          </div>
        </div>
    </SectionWrapper>
  )
}
