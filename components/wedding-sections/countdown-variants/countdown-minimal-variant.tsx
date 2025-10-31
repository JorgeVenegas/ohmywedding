"use client"

import React, { useState, useEffect } from 'react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft } from './types'

export function CountdownMinimalVariant({
  weddingDate,
  theme,
  alignment,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = false,
  message = "Until we say \"I do\""
}: BaseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const calculateTimeLeft = () => {
      const wedding = new Date(weddingDate).getTime()
      const now = new Date().getTime()
      const difference = wedding - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [weddingDate, isClient])

  if (!isClient) {
    return (
      <SectionWrapper theme={theme} alignment={alignment}>
        <div className="text-center py-20">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-8"></div>
            <div className="h-16 bg-gray-200 rounded w-80 mx-auto"></div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  const units = [
    { value: timeLeft.days, label: 'd', show: showDays },
    { value: timeLeft.hours, label: 'h', show: showHours },
    { value: timeLeft.minutes, label: 'm', show: showMinutes },
    { value: timeLeft.seconds, label: 's', show: showSeconds },
  ].filter(unit => unit.show)

  return (
    <SectionWrapper theme={theme} alignment={alignment}>
      <div className="text-center py-20">
        <p 
          className="text-lg md:text-xl mb-8 font-light"
          style={{ 
            color: theme?.colors?.muted,
            fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
          }}
        >
          {message}
        </p>

        <div className="flex justify-center items-baseline space-x-2 md:space-x-4">
          {units.map((unit, index) => (
            <React.Fragment key={unit.label}>
              {index > 0 && (
                <span 
                  className="text-2xl md:text-4xl font-thin"
                  style={{ color: theme?.colors?.muted }}
                >
                  :
                </span>
              )}
              <div className="text-center">
                <span 
                  className="text-4xl md:text-7xl font-thin tabular-nums"
                  style={{ 
                    color: theme?.colors?.foreground,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {unit.value.toString().padStart(2, '0')}
                </span>
                <span 
                  className="text-sm md:text-base font-light ml-1"
                  style={{ color: theme?.colors?.muted }}
                >
                  {unit.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Subtle accent line */}
        <div className="mt-12 flex justify-center">
          <div 
            className="w-24 h-px opacity-30"
            style={{ backgroundColor: theme?.colors?.accent }}
          />
        </div>
      </div>
    </SectionWrapper>
  )
}
