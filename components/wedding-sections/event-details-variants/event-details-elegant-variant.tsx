"use client"

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, ExternalLink, Church, PartyPopper, Calendar, Heart } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseEventDetailsProps, buildEventList, getMapUrl, getColorScheme, getEventIconType, formatWeddingTime } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function EventDetailsElegantVariant(props: BaseEventDetailsProps) {
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
  const subtitle = sectionSubtitle || t('eventDetails.joinUsForOurCelebration')
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const events = buildEventList(props)

  const renderEventIcon = (type: string) => {
    const iconType = getEventIconType(type as any)
    const color = isColored ? titleColor : theme?.colors?.primary
    const iconProps = { className: "w-6 h-6", style: { color } }
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
  const ornamentColor = isColored ? subtitleColor : theme?.colors?.accent

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
      <div>
        {/* Elegant Header with Ornaments */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-px" style={{ backgroundColor: ornamentColor }} />
            <Heart className="w-4 h-4" style={{ color: ornamentColor }} />
            <div className="w-16 h-px" style={{ backgroundColor: ornamentColor }} />
          </div>
          <h2 
            className="text-3xl md:text-4xl mb-3"
            style={{ 
              fontFamily: 'cursive',
              color: sectionTitleColor
            }}
          >
            {title}
          </h2>
          <p 
            className="text-base max-w-lg mx-auto"
            style={{ 
              color: isColored ? sectionTextColorAlt : theme?.colors?.muted,
              fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Events in elegant layout */}
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          {events.map((event, index) => (
            <div 
              key={event.id}
              className="relative"
            >
              {/* Decorative connector line */}
              {index < events.length - 1 && (
                <div 
                  className="absolute left-1/2 top-full w-px h-8 -translate-x-1/2"
                  style={{ backgroundColor: ornamentColor, opacity: 0.3 }}
                />
              )}
              
              <div 
                className={`relative rounded-xl text-center overflow-hidden ${isColored ? '' : 'bg-white shadow-lg'}`}
                style={isColored ? { 
                  backgroundColor: cardBg,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
                } : undefined}
              >
                {/* Event Image - show if imageUrl exists */}
                {event.imageUrl && (
                  <div className="aspect-[3/1] overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={`${event.venue} venue`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="relative p-4 sm:p-5 md:p-6">
                  {/* Corner decorations */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t border-l rounded-tl-md" style={{ borderColor: ornamentColor, opacity: 0.4 }} />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t border-r rounded-tr-md" style={{ borderColor: ornamentColor, opacity: 0.4 }} />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l rounded-bl-md" style={{ borderColor: ornamentColor, opacity: 0.4 }} />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r rounded-br-md" style={{ borderColor: ornamentColor, opacity: 0.4 }} />

                  {/* Icon */}
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: isColored ? `${titleColor}15` : `${theme?.colors?.primary}10`
                      }}
                    >
                      {renderEventIcon(event.type)}
                    </div>
                  </div>

                {/* Event Title - use custom title if provided */}
                <h3 
                  className="text-2xl mb-1"
                  style={{ 
                    fontFamily: 'cursive',
                    color: cardTitleColor
                  }}
                >
                  {event.title || t(`eventDetails.eventTypes.${event.type}`) || event.venue}
                </h3>

                {/* Time */}
                {event.time && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="w-4 h-4" style={{ color: ornamentColor }} />
                    <span 
                      className="text-base font-medium"
                      style={{ color: cardTextColor }}
                    >
                      {formatWeddingTime(event.time)}
                    </span>
                  </div>
                )}

                {/* Venue Info - Show if different from title */}
                {event.venue && event.venue !== event.title && (
                  <div className="space-y-1 mb-3">
                    <p 
                      className="text-base sm:text-lg font-semibold flex items-center justify-center gap-2"
                      style={{ color: cardTextColor }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: ornamentColor }} />
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
                  <div className="mb-3">
                    <p 
                      className="text-sm flex items-center justify-center gap-2"
                      style={{ color: cardMutedColor }}
                    >
                      <MapPin className="w-4 h-4" />
                      {event.address}
                    </p>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <p 
                    className="italic text-sm mb-2 sm:mb-3 max-w-sm mx-auto"
                    style={{ 
                      color: cardMutedColor,
                      fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    "{event.description}"
                  </p>
                )}

                {/* Map Link */}
                {showMapLinks && event.address && (
                  <Button 
                    asChild
                    variant="outline" 
                    size="sm"
                    className="rounded-full px-5 h-8 text-sm"
                    style={{ 
                      borderColor: ornamentColor,
                      color: cardTitleColor
                    }}
                  >
                    <a 
                      href={getMapUrl(event.address)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t('eventDetails.viewOnMap')}
                    </a>
                  </Button>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Embedded Map */}
        {showMap && mapAddress && (
          <div className="max-w-3xl mx-auto">
            <Card 
              className="overflow-hidden rounded-xl"
              style={isColored ? { 
                backgroundColor: cardBg,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
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
      </div>
    </SectionWrapper>
  )
}
