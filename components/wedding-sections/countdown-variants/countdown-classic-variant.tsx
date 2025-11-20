"use client"

import React, { useState, useEffect } from 'react'
import { Heart, Clock } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps } from './types'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownClassicVariant({
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
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
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

  const units = [
    { value: timeLeft.days, label: 'Days', show: showDays },
    { value: timeLeft.hours, label: 'Hours', show: showHours },
    { value: timeLeft.minutes, label: 'Minutes', show: showMinutes },
    { value: timeLeft.seconds, label: 'Seconds', show: showSeconds },
  ].filter(unit => unit.show)

  return (
    <SectionWrapper theme={theme} alignment={alignment}>
      <div className="text-center py-20">
        <div className="flex items-center justify-center mb-8">
          <Heart className="w-6 h-6 mr-3 fill-current" style={{ color: theme?.colors?.accent }} />
          <h2 
            className="text-4xl md:text-5xl font-bold"
            style={{ 
              color: theme?.colors?.foreground,
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 
                         theme?.fonts?.heading === 'script' ? 'cursive' : 'sans-serif'
            }}
          >
            {message}
          </h2>
          <Heart className="w-6 h-6 ml-3 fill-current" style={{ color: theme?.colors?.accent }} />
        </div>

        <div className="flex justify-center items-center space-x-4 sm:space-x-6 md:space-x-12 flex-wrap gap-4">
          {units.map((unit, index) => (
            <div key={unit.label} className="text-center">
              <div 
                className="relative bg-white rounded-lg shadow-lg border-2 p-4 sm:p-6 md:p-8 min-w-[70px] sm:min-w-[80px] md:min-w-[100px]"
                style={{ 
                  borderColor: theme?.colors?.accent,
                  boxShadow: `0 4px 20px ${theme?.colors?.accent}20`
                }}
              >
                <div 
                  className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2"
                  style={{ 
                    color: theme?.colors?.primary,
                    fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                  }}
                >
                  {unit.value.toString().padStart(2, '0')}
                </div>
                <div 
                  className="text-sm md:text-base font-semibold uppercase tracking-wide"
                  style={{ color: theme?.colors?.muted }}
                >
                  {unit.label}
                </div>
                
                {/* Decorative corner elements */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg" 
                     style={{ borderColor: theme?.colors?.accent }} />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg" 
                     style={{ borderColor: theme?.colors?.accent }} />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg" 
                     style={{ borderColor: theme?.colors?.accent }} />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 rounded-br-lg" 
                     style={{ borderColor: theme?.colors?.accent }} />
              </div>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex items-center justify-center space-x-4">
          <div className="w-16 h-px" style={{ backgroundColor: theme?.colors?.accent }} />
          <Clock className="w-5 h-5" style={{ color: theme?.colors?.accent }} />
          <div className="w-16 h-px" style={{ backgroundColor: theme?.colors?.accent }} />
        </div>
      </div>
    </SectionWrapper>
  )
}
