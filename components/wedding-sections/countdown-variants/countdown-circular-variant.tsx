"use client"

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseCountdownProps, TimeLeft } from './types'

export function CountdownCircularVariant({
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
              stroke={theme?.colors?.muted + '30' || '#e5e7eb'}
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={theme?.colors?.accent || '#d97706'}
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
                color: theme?.colors?.foreground,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {value}
            </span>
            <span 
              className="text-xs md:text-sm font-medium"
              style={{ color: theme?.colors?.muted }}
            >
              {unit}
            </span>
          </div>
        </div>
        
        <p 
          className="mt-3 text-sm md:text-base font-medium"
          style={{ color: theme?.colors?.foreground }}
        >
          {label}
        </p>
      </div>
    )
  }

  const units = [
    { value: timeLeft.days, max: 365, label: 'Days', unit: 'D', show: showDays },
    { value: timeLeft.hours, max: 24, label: 'Hours', unit: 'H', show: showHours },
    { value: timeLeft.minutes, max: 60, label: 'Minutes', unit: 'M', show: showMinutes },
    { value: timeLeft.seconds, max: 60, label: 'Seconds', unit: 'S', show: showSeconds },
  ].filter(unit => unit.show)

  return (
    <SectionWrapper theme={theme} alignment={alignment}>
      <div className="text-center py-20">
        <div className="flex items-center justify-center mb-12">
          <Heart className="w-5 h-5 mr-2 fill-current" style={{ color: theme?.colors?.accent }} />
          <h2 
            className="text-3xl md:text-4xl font-bold"
            style={{ 
              color: theme?.colors?.foreground,
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 
                         theme?.fonts?.heading === 'script' ? 'cursive' : 'sans-serif'
            }}
          >
            {message}
          </h2>
          <Heart className="w-5 h-5 ml-2 fill-current" style={{ color: theme?.colors?.accent }} />
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
                style={{ backgroundColor: theme?.colors?.accent }}
              />
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
