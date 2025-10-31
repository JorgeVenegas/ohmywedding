"use client"

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { SectionWrapper } from './section-wrapper'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

interface CountdownSectionProps {
  weddingDate: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  message?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownSection({
  weddingDate,
  theme,
  alignment,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = false,
  message = "Until we say \"I do\""
}: CountdownSectionProps) {
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
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
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
    return null // Avoid hydration mismatch
  }

  const isWeddingPassed = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  const timeUnits = [
    { value: timeLeft.days, label: 'Days', show: showDays },
    { value: timeLeft.hours, label: 'Hours', show: showHours },
    { value: timeLeft.minutes, label: 'Minutes', show: showMinutes },
    { value: timeLeft.seconds, label: 'Seconds', show: showSeconds }
  ].filter(unit => unit.show)

  return (
    <SectionWrapper 
      theme={theme} 
      alignment={alignment} 
      background="primary"
      id="countdown"
    >
      <div className="text-center">
        {/* Heart Icon */}
        <div className="mb-8">
          <Heart 
            className="w-16 h-16 mx-auto fill-current" 
            style={{ color: theme?.colors?.accent || '#e8a76a' }}
          />
        </div>

        {/* Countdown Display */}
        {!isWeddingPassed ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-8 max-w-2xl mx-auto">
              {timeUnits.map((unit, index) => (
                <div key={unit.label} className="text-center">
                  <div 
                    className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg"
                    style={{ borderColor: theme?.colors?.primary || '#a86b8f' }}
                  >
                    <div 
                      className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2"
                      style={{ 
                        color: theme?.colors?.primary || '#a86b8f',
                        fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {unit.value.toString().padStart(2, '0')}
                    </div>
                    <div 
                      className="text-sm md:text-base font-medium"
                      style={{ 
                        color: theme?.colors?.foreground || '#1f2937',
                        fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {unit.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 
              className="text-2xl md:text-3xl lg:text-4xl font-semibold"
              style={{ 
                fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 'serif',
                color: theme?.colors?.foreground || '#1f2937'
              }}
            >
              {message}
            </h2>
          </>
        ) : (
          <>
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-8 md:p-12 shadow-lg mb-8 max-w-md mx-auto">
              <div 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                style={{ 
                  color: theme?.colors?.primary || '#a86b8f',
                  fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                }}
              >
                💍
              </div>
              <div 
                className="text-xl md:text-2xl font-semibold"
                style={{ 
                  color: theme?.colors?.foreground || '#1f2937',
                  fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                }}
              >
                We're Married!
              </div>
            </div>
            
            <h2 
              className="text-2xl md:text-3xl lg:text-4xl font-semibold"
              style={{ 
                fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 'serif',
                color: theme?.colors?.foreground || '#1f2937'
              }}
            >
              Thank you for celebrating with us!
            </h2>
          </>
        )}
      </div>
    </SectionWrapper>
  )
}