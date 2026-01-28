"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Calendar } from 'lucide-react'
import { formatWeddingDate, formatWeddingTime, calculateDaysUntilWedding } from '@/lib/wedding-utils-client'
import { HeroContentProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function HeroTextContent({
  wedding,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline,
  showCountdown = true,
  showRSVPButton = true,
  isOverlay = false
}: HeroContentProps) {
  const { t, locale } = useI18n()
  
  // Helper to check if tagline is an old hardcoded English default
  const isOldTaglineDefault = (text: string | undefined) => {
    if (!text) return true
    const oldDefaults = [
      'Join us as we tie the knot',
      'We\'re getting married'
    ]
    return oldDefaults.some(d => text.startsWith(d))
  }
  
  // Use translated default tagline if not provided or if it's an old English default
  const displayTagline = isOldTaglineDefault(tagline) ? t('hero.joinUs') : tagline
  
  const daysUntil = calculateDaysUntilWedding(wedding.wedding_date)
  const formattedDate = formatWeddingDate(wedding.wedding_date, locale)
  const formattedTime = formatWeddingTime(wedding.wedding_time, locale)
  const textAlign = alignment?.text || 'center'

  const getCountdownMessage = () => {
    if (daysUntil > 0) {
      // Use singular or plural based on count
      const daysLabel = daysUntil === 1 ? t('countdown.day') : t('countdown.days')
      return `${daysUntil} ${daysLabel.toLowerCase()} ${t('hero.untilBigDay')}`
    }
    if (daysUntil === 0) return t('hero.todayIsTheDay')
    return t('hero.justMarried')
  }

  return (
    <div className={`${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}>
      {/* Countdown Badge */}
      {showCountdown && wedding.wedding_date && (
        <div 
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base md:text-lg font-medium mb-4 sm:mb-6 md:mb-8 shadow-lg animate-fade-in-up delay-300 ${
            isOverlay 
              ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30' 
              : 'bg-white/80 backdrop-blur-sm border'
          }`}
          style={!isOverlay ? {
            color: theme?.colors?.primary || 'var(--theme-primary, #d4a574)',
            borderColor: `${theme?.colors?.primary || 'var(--theme-primary, #d4a574)'}40`
          } : undefined}
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current flex-shrink-0" />
          <span className="whitespace-nowrap">{getCountdownMessage()}</span>
        </div>
      )}

      {/* Couple Names */}
      <h1 
        className={`font-serif mb-4 sm:mb-6 md:mb-8 leading-tight animate-fade-in-up delay-500 ${
          isOverlay 
            ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-white drop-shadow-lg' 
            : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-slate-800'
        }`}
        style={{ 
          ...(theme?.fonts?.heading === 'script' ? { fontFamily: 'cursive' } : 
              theme?.fonts?.heading === 'sans-serif' ? { fontFamily: 'sans-serif' } : {}),
          color: isOverlay ? 'white' : (theme?.colors?.foreground || '#1f2937')
        }}
      >
        {wedding.partner1_first_name} & {wedding.partner2_first_name}
      </h1>

      {/* Tagline */}
      {showTagline && displayTagline && (
        <p 
          className={`mb-4 sm:mb-6 md:mb-8 font-light animate-fade-in-up delay-700 ${
            isOverlay 
              ? 'text-base sm:text-xl md:text-2xl lg:text-3xl text-white/90 drop-shadow-md' 
              : 'text-base sm:text-lg md:text-xl lg:text-2xl'
          }`}
          style={{ 
            color: isOverlay ? 'rgba(255,255,255,0.9)' : (theme?.colors?.muted || '#6b7280'),
            fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
          }}
        >
          {displayTagline}
        </p>
      )}

      {/* Wedding Date */}
      <div 
        className={`font-serif mb-5 sm:mb-6 md:mb-8 leading-tight animate-fade-in-up delay-1000 ${
          isOverlay 
            ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white drop-shadow-lg' 
            : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-800'
        } ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}
        style={{ 
          ...(theme?.fonts?.heading === 'script' ? { fontFamily: 'cursive' } : 
              theme?.fonts?.heading === 'sans-serif' ? { fontFamily: 'sans-serif' } : {}),
          color: isOverlay ? 'white' : (theme?.colors?.foreground || '#1f2937')
        }}
      >
        {formattedDate}
      </div>

      {/* Time & Location */}
      <div className={`flex flex-col gap-2 sm:gap-3 sm:flex-row sm:gap-4 mb-6 sm:mb-8 md:mb-10 text-base sm:text-lg md:text-xl animate-fade-in-up delay-1100 ${
        textAlign === 'center' ? 'items-center sm:justify-center' : 
        textAlign === 'right' ? 'items-end sm:justify-end' : 'items-start sm:justify-start'
      }`}>
        <div className={isOverlay ? 'text-white/90 drop-shadow-sm' : 'text-gray-700'} 
          style={{ color: isOverlay ? 'rgba(255,255,255,0.9)' : theme?.colors?.muted }}>
          {formattedTime}
        </div>
        {(wedding.ceremony_venue_name || wedding.reception_venue_name) && (
          <>
            <span className={`hidden sm:inline ${isOverlay ? 'text-white/60' : 'text-gray-400'}`}>•</span>
            <div className={isOverlay ? 'text-white/90 drop-shadow-sm' : 'text-gray-700'} 
              style={{ color: isOverlay ? 'rgba(255,255,255,0.9)' : theme?.colors?.muted }}>
              {wedding.ceremony_venue_name || wedding.reception_venue_name}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`flex flex-col gap-4 animate-fade-in-up delay-1300 ${
        textAlign === 'center' ? 'items-center' : 
        textAlign === 'right' ? 'items-end' : 'items-start'
      }`}>
        {showRSVPButton && (
          <Button 
            asChild 
            size="lg" 
            className="px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundColor: theme?.colors?.primary || '#a86b8f',
              borderColor: theme?.colors?.primary || '#a86b8f'
            }}
          >
            <a
              href="#rsvp"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#rsvp')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {t('hero.rsvpNow')}
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}