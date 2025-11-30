"use client"

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft, getColorScheme } from './types'

export function CountdownElegantVariant({
  weddingDate,
  theme,
  alignment,
  showYears = true,
  showMonths = true,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  message = "Until we say \"I do\"",
  useColorBackground = false,
  backgroundColorChoice
}: BaseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isClient, setIsClient] = useState(false)

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
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 sm:mb-6"></div>
            <div className="flex justify-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-16 w-16 bg-gray-200 rounded-full mb-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  const allUnits = [
    { value: timeLeft.years, label: 'Years', enabled: showYears, hasValue: timeLeft.years > 0 },
    { value: timeLeft.months, label: 'Months', enabled: showMonths, hasValue: timeLeft.years > 0 || timeLeft.months > 0 },
    { value: timeLeft.days, label: 'Days', enabled: showDays, hasValue: true },
    { value: timeLeft.hours, label: 'Hours', enabled: showHours, hasValue: true },
    { value: timeLeft.minutes, label: 'Minutes', enabled: showMinutes, hasValue: true },
    { value: timeLeft.seconds, label: 'Seconds', enabled: showSeconds, hasValue: true },
  ]

  const enabledUnits = allUnits.filter(u => u.enabled && u.hasValue)
  const units = enabledUnits.slice(0, 4)

  // Color scheme: use high contrast colors for numbers, low contrast for decorative elements
  const flourishColor = isColored ? sectionTextColorAlt : theme?.colors?.accent
  const numberColor = isColored ? sectionTextColor : theme?.colors?.foreground  // Use section text color for numbers
  const messageColor = isColored ? '' : 'text-gray-600'
  const separatorColor = isColored ? '' : 'text-gray-300'
  const labelColor = isColored ? sectionTextColorAlt : theme?.colors?.accent

  return (
    <SectionWrapper 
      id="countdown"
      theme={isColored ? undefined : theme} 
      alignment={alignment}
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
        <div className="text-center py-20">
          {/* Decorative top flourish */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-px" style={{ backgroundColor: flourishColor }} />
            <Heart className="w-4 h-4 mx-3 fill-current" style={{ color: flourishColor }} />
            <div className="w-12 h-px" style={{ backgroundColor: flourishColor }} />
          </div>

          <h2 
            className={`text-3xl md:text-4xl mb-10 ${messageColor}`}
            style={{ 
              fontFamily: 'var(--font-display, var(--font-heading, cursive))',
              color: isColored ? sectionTextColorAlt : undefined
            }}
          >
            {message}
          </h2>

          <div className="flex justify-center items-start flex-wrap gap-6 md:gap-10">
            {units.map((unit, index) => (
              <React.Fragment key={unit.label}>
                {index > 0 && (
                  <div 
                    className={`hidden sm:flex items-center self-center ${separatorColor}`}
                    style={isColored ? { color: sectionTextColorAlt, opacity: 0.6 } : undefined}
                  >
                    <span className="text-2xl md:text-3xl font-light">&</span>
                  </div>
                )}
                <div className="text-center">
                  <div 
                    className="text-5xl sm:text-6xl md:text-7xl font-light mb-2"
                    style={{ 
                      fontFamily: 'var(--font-display, var(--font-heading, serif))',
                      color: numberColor || theme?.colors?.foreground
                    }}
                  >
                    {unit.value}
                  </div>
                  <div 
                    className="text-sm md:text-base uppercase tracking-[0.2em] font-light"
                    style={{ color: labelColor }}
                  >
                    {unit.label}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Decorative bottom flourish */}
          <div className="flex items-center justify-center mt-10">
            <div className="w-8 h-px" style={{ backgroundColor: flourishColor }} />
            <div 
              className="w-2 h-2 mx-2 rounded-full"
              style={{ backgroundColor: isColored ? sectionTextColor : 'white' }}
            />
            <div className="w-8 h-px" style={{ backgroundColor: flourishColor }} />
          </div>
        </div>
    </SectionWrapper>
  )
}
