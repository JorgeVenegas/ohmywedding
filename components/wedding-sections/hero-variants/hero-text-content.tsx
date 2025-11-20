import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Calendar } from 'lucide-react'
import { formatWeddingDate, formatWeddingTime, calculateDaysUntilWedding } from '@/lib/wedding-utils-client'
import { HeroContentProps } from './types'

export function HeroTextContent({
  wedding,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline = "Join us as we tie the knot!",
  showCountdown = true,
  showRSVPButton = true,
  isOverlay = false
}: HeroContentProps) {
  const daysUntil = calculateDaysUntilWedding(wedding.wedding_date)
  const formattedDate = formatWeddingDate(wedding.wedding_date)
  const formattedTime = formatWeddingTime(wedding.wedding_time)
  const textAlign = alignment?.text || 'center'

  const getCountdownMessage = () => {
    if (daysUntil > 0) return `${daysUntil} days until the big day`
    if (daysUntil === 0) return "Today is the day!"
    return "Just married!"
  }

  return (
    <div className={`${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}>
      {/* Countdown Badge */}
      {showCountdown && wedding.wedding_date && (
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium mb-6 shadow-lg ${
          isOverlay 
            ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30' 
            : 'bg-white/80 backdrop-blur-sm text-orange-700'
        }`}>
          <Heart className="w-4 h-4 fill-current" />
          {getCountdownMessage()}
        </div>
      )}

      {/* Couple Names */}
      <h1 
        className={`font-serif mb-6 leading-tight ${
          isOverlay 
            ? 'text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg' 
            : 'text-4xl md:text-5xl lg:text-6xl text-slate-800'
        }`}
        style={{ 
          fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                      theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
          color: isOverlay ? 'white' : (theme?.colors?.foreground || '#1f2937')
        }}
      >
        {wedding.partner1_first_name} & {wedding.partner2_first_name}
      </h1>

      {/* Tagline */}
      {showTagline && tagline && (
        <p 
          className={`mb-6 font-light ${
            isOverlay 
              ? 'text-xl md:text-2xl text-white/90 drop-shadow-md' 
              : 'text-lg md:text-xl'
          }`}
          style={{ 
            color: isOverlay ? 'rgba(255,255,255,0.9)' : (theme?.colors?.muted || '#6b7280'),
            fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
          }}
        >
          {tagline}
        </p>
      )}

      {/* Date & Location */}
      <div className={`flex flex-col sm:flex-row items-center gap-4 mb-8 text-base md:text-lg ${
        textAlign === 'center' ? 'justify-center' : 
        textAlign === 'right' ? 'justify-end' : 'justify-start'
      }`}>
        <div className="flex items-center gap-2">
          <Calendar className={`w-5 h-5 ${isOverlay ? 'text-white/80' : ''}`} 
            style={{ color: isOverlay ? 'rgba(255,255,255,0.8)' : theme?.colors?.accent }} />
          <span className={isOverlay ? 'text-white/90 drop-shadow-sm' : ''} 
            style={{ color: isOverlay ? 'rgba(255,255,255,0.9)' : theme?.colors?.foreground }}>
            {formattedDate}
          </span>
        </div>
        <span className={`hidden sm:inline ${isOverlay ? 'text-white/60' : 'text-gray-400'}`}>•</span>
        <span className={isOverlay ? 'text-white/90 drop-shadow-sm' : ''} 
          style={{ color: isOverlay ? 'rgba(255,255,255,0.9)' : theme?.colors?.foreground }}>
          {formattedTime}
        </span>
        {(wedding.ceremony_venue_name || wedding.reception_venue_name) && (
          <>
            <span className={`hidden sm:inline ${isOverlay ? 'text-white/60' : 'text-gray-400'}`}>•</span>
            <span className={isOverlay ? 'text-white/90 drop-shadow-sm' : ''} 
              style={{ color: isOverlay ? 'rgba(255,255,255,0.9)' : theme?.colors?.foreground }}>
              {wedding.ceremony_venue_name || wedding.reception_venue_name}
            </span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`flex flex-col gap-4 ${
        textAlign === 'center' ? 'items-center' : 
        textAlign === 'right' ? 'items-end' : 'items-start'
      }`}>
        {showRSVPButton && (
          <Button 
            asChild 
            size="lg" 
            className="px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundColor: theme?.colors?.primary || '#a86b8f',
              borderColor: theme?.colors?.primary || '#a86b8f'
            }}
          >
            <Link href={`/${weddingNameId}/rsvp`}>
              RSVP Now
            </Link>
          </Button>
        )}
        
        <Button 
          asChild 
          variant="outline"
          size="lg" 
          className="px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            borderColor: theme?.colors?.secondary || '#8b9d6f',
            color: theme?.colors?.secondary || '#8b9d6f'
          }}
        >
          <Link href={`/${weddingNameId}/schedule`}>
            View Schedule
          </Link>
        </Button>
      </div>
    </div>
  )
}