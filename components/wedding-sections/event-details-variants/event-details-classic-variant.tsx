"use client"

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, ExternalLink, Church, PartyPopper, Calendar } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseEventDetailsProps, buildEventList, getMapUrl, getColorScheme, getEventIconType, formatWeddingTime } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function EventDetailsClassicVariant(props: BaseEventDetailsProps) {
  const { 
    wedding,
    theme,
    alignment,
    showMapLinks = true,
    showMap = true,
    showPhotos = false,
    sectionTitle,
    sectionSubtitle,
    useColorBackground = false,
    backgroundColorChoice
  } = props
  
  const { t } = useI18n()
  
  // Use translated defaults if not provided
  const title = sectionTitle || t('eventDetails.title')
  const subtitle = sectionSubtitle || t('eventDetails.subtitle')
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  // Build unified event list from both new and legacy props
  const events = buildEventList(props)

  const renderEventIcon = (type: string) => {
    const iconType = getEventIconType(type as any)
    const color = isColored ? titleColor : theme?.colors?.primary
    const iconProps = { className: "w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10", style: { color } }
    switch (iconType) {
      case "ceremony":
        return <Church {...iconProps} />
      case "reception":
        return <PartyPopper {...iconProps} />
      default:
        return <Calendar {...iconProps} />
    }
  }

  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const cardTitleColor = isColored ? titleColor : theme?.colors?.primary
  const cardTextColor = isColored ? bodyTextColor : theme?.colors?.foreground
  const cardMutedColor = isColored ? sectionTextColorAlt : theme?.colors?.muted
  const iconAccentColor = isColored ? subtitleColor : theme?.colors?.accent
  const dividerColor = isColored ? sectionTextColorAlt : theme?.colors?.accent

  // Get the first event with an address for the map
  const mapEvent = events.find(e => e.address)
  const mapAddress = mapEvent?.address

  if (events.length === 0) {
    return null
  }

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background={isColored ? "default" : "muted"}
      id="event-details"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      {/* Section Header */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ 
            fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                        theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
            color: sectionTitleColor
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-base max-w-lg mx-auto mb-4" style={{ color: cardMutedColor }}>
            {subtitle}
          </p>
        )}
        <div 
          className="w-24 h-1 mx-auto rounded"
          style={{ backgroundColor: dividerColor }}
        />
      </div>

      {/* Events Grid - Center aligned cards */}
      <div className={`grid gap-4 sm:gap-6 mb-6 sm:mb-8 justify-items-center ${
        events.length === 1 
          ? 'max-w-md mx-auto' 
          : events.length === 2 
          ? 'md:grid-cols-2 max-w-4xl mx-auto' 
          : 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto'
      }`}>
        {events.map((event) => (
          <Card 
            key={event.id} 
            className="overflow-hidden hover:shadow-xl transition-all duration-300 text-center w-full"
            style={isColored ? { 
              backgroundColor: cardBg,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            } : undefined}
          >
            {/* Event Image - show if imageUrl exists */}
            {event.imageUrl && (
              <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                <Image
                  src={event.imageUrl}
                  alt={`${event.venue} venue`}
                  width={800}
                  height={500}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
                />
              </div>
            )}

            <div className="p-4 sm:p-5 md:p-6">
              {/* Event Icon */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: isColored ? `${titleColor}10` : `${theme?.colors?.primary}10`
                  }}
                >
                  {renderEventIcon(event.type)}
                </div>
              </div>

              {/* Event Title - use custom title if provided, fallback to type label */}
              <h3 
                className="text-xl sm:text-2xl mb-2"
                style={{ 
                  color: cardTitleColor,
                  fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                }}
              >
                {event.title || t(`eventDetails.eventTypes.${event.type}`) || event.venue}
              </h3>

              {/* Time */}
              {event.time && (
                <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                  <Clock className="w-5 h-5" style={{ color: iconAccentColor }} />
                  <span 
                    className="text-base sm:text-lg font-medium"
                    style={{ color: cardTextColor }}
                  >
                    {formatWeddingTime(event.time)}
                  </span>
                </div>
              )}

            {/* Venue - Show if different from title */}
            {event.venue && event.venue !== event.title && (
              <div className="mb-3 sm:mb-4">
                <p 
                  className="text-base sm:text-lg font-semibold mb-1 flex items-center justify-center gap-2"
                  style={{ color: cardTextColor }}
                >
                  <MapPin className="w-5 h-5" style={{ color: iconAccentColor }} />
                  {event.venue}
                </p>
                {event.address && (
                  <p 
                    className="text-sm"
                    style={{ color: cardMutedColor }}
                  >
                    {event.address}
                  </p>
                )}
              </div>
            )}

            {/* Address only (if no venue) */}
            {!event.venue && event.address && (
              <div className="mb-3 sm:mb-4">
                <p 
                  className="text-sm flex items-center justify-center gap-2"
                  style={{ color: cardMutedColor }}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{event.address}</span>
                </p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <p 
                className="text-sm mb-3 sm:mb-4 italic"
                style={{ 
                  color: cardMutedColor,
                  fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                }}
              >
                {event.description}
              </p>
            )}

            {/* Map Link */}
            {showMapLinks && event.address && (
              <a 
                href={getMapUrl(event.address)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-colors"
                style={{ color: cardTitleColor }}
              >
                <ExternalLink className="w-4 h-4" />
                {t('eventDetails.getDirections')}
              </a>
            )}
            </div>
          </Card>
        ))}
      </div>

      {/* Embedded Map */}
      {showMap && mapAddress && (
        <div className="max-w-4xl mx-auto">
          <Card 
            className="overflow-hidden"
            style={isColored ? { 
              backgroundColor: cardBg,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            } : undefined}
          >
            <div className="aspect-[16/9] md:aspect-[21/9]">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Event Location Map"
              />
            </div>
          </Card>
        </div>
      )}
    </SectionWrapper>
  )
}
