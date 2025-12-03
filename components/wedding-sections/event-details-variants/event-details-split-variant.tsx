"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, ExternalLink, Church, PartyPopper, Calendar, Navigation, Heart } from 'lucide-react'
import { BaseEventDetailsProps, EventItem, buildEventsList, getMapUrl, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function EventDetailsSplitVariant({
  wedding,
  weddingNameId,
  theme,
  alignment,
  showCeremony = true,
  showReception = true,
  showMapLinks = true,
  showMap = true,
  showPhotos = false,
  ceremonyImageUrl,
  receptionImageUrl,
  ceremonyDescription,
  receptionDescription,
  sectionTitle,
  sectionSubtitle,
  customEvents = [],
  useColorBackground = false,
  backgroundColorChoice,
  ceremonyTextAlignment = 'center',
  receptionTextAlignment = 'center'
}: BaseEventDetailsProps) {
  const { t } = useI18n()
  
  // Use translated defaults if not provided
  const title = sectionTitle || t('eventDetails.title')
  const preTitle = t('eventDetails.subtitle')
  const subtitle = sectionSubtitle || t('eventDetails.joinUsForOurCelebration')
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const events = buildEventsList(wedding, showCeremony, showReception, customEvents, ceremonyImageUrl, receptionImageUrl, ceremonyDescription, receptionDescription, t)

  // Helper to get text alignment for an event
  const getEventAlignment = (iconType: EventItem['iconType']): 'left' | 'center' | 'right' => {
    if (iconType === 'ceremony') return ceremonyTextAlignment
    if (iconType === 'reception') return receptionTextAlignment
    return 'center' // default for custom events
  }

  // Helper to get alignment classes - center on mobile, configured alignment on desktop
  const getAlignmentClasses = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'left':
        return {
          text: 'text-center sm:text-left',
          flex: 'justify-center sm:justify-start',
          items: 'items-center sm:items-start'
        }
      case 'right':
        return {
          text: 'text-center sm:text-right',
          flex: 'justify-center sm:justify-end',
          items: 'items-center sm:items-end'
        }
      case 'center':
      default:
        return {
          text: 'text-center',
          flex: 'justify-center',
          items: 'items-center'
        }
    }
  }

  const renderEventIcon = (iconType: EventItem['iconType'], large: boolean = false) => {
    const color = isColored ? titleColor : theme?.colors?.primary
    const iconProps = { className: large ? "w-10 h-10" : "w-5 h-5", style: { color } }
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
  const accentLineColor = isColored ? subtitleColor : theme?.colors?.accent
  const sectionBg = isColored ? bgColor : (theme?.colors?.background || '#ffffff')

  // Get the first event with an address for the map
  const mapEvent = events.find(e => e.address)
  const mapAddress = mapEvent?.address

  return (
    <section 
      id="event-details"
      className="w-full"
      style={{ backgroundColor: sectionBg }}
    >
      {/* Elegant Header */}
      <div className="text-center py-8 sm:py-10 px-4">
        <div className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
          <div className="w-16 h-px" style={{ backgroundColor: accentLineColor, opacity: 0.5 }} />
          <Heart className="w-4 h-4" style={{ color: accentLineColor }} />
          <div className="w-16 h-px" style={{ backgroundColor: accentLineColor, opacity: 0.5 }} />
        </div>
        <p 
          className="text-xs uppercase tracking-[0.3em] mb-2 sm:mb-3 font-light"
          style={{ color: isColored ? sectionTextColorAlt : theme?.colors?.accent }}
        >
          {preTitle}
        </p>
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3"
          style={{ 
            fontFamily: 'cursive',
            color: sectionTitleColor,
            fontWeight: 400
          }}
        >
          {title}
        </h2>
        <p 
          className="text-base max-w-md mx-auto font-light"
          style={{ 
            color: cardMutedColor,
            fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Check if any photos are visible */}
      {(() => {
        const hasVisiblePhotos = showPhotos && events.some(e => e.imageUrl)
        
        if (!hasVisiblePhotos) {
          // Side-by-side text layout when no photos
          return (
            <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-8 sm:pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                {events.map((event, index) => {
                  const eventAlignment = getEventAlignment(event.iconType)
                  const alignClasses = getAlignmentClasses(eventAlignment)
                  
                  return (
                  <div 
                    key={index}
                    className={alignClasses.text}
                  >
                    {/* Event Icon */}
                    <div className={`flex ${alignClasses.flex} gap-3 mb-3 sm:mb-4`}>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center border"
                        style={{ 
                          borderColor: isColored ? `${titleColor}25` : `${theme?.colors?.primary}20`,
                          backgroundColor: isColored ? `${titleColor}08` : `${theme?.colors?.primary}05`
                        }}
                      >
                        {renderEventIcon(event.iconType)}
                      </div>
                    </div>

                    {/* Event Title */}
                    <h3 
                      className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4"
                      style={{ 
                        color: cardTitleColor,
                        fontFamily: 'cursive',
                        fontWeight: 400
                      }}
                    >
                      {event.title}
                    </h3>

                    {/* Time */}
                    <div className={`flex ${alignClasses.flex} gap-3 mb-2 sm:mb-3`}>
                      <Clock className="w-4 h-4" style={{ color: accentLineColor }} />
                      <span 
                        className="text-lg font-medium"
                        style={{ color: cardTextColor }}
                      >
                        {event.time}
                      </span>
                    </div>

                    {/* Venue */}
                    <div className="mb-2 sm:mb-3">
                      <p 
                        className="text-lg font-medium mb-1"
                        style={{ color: cardTextColor }}
                      >
                        {event.venue}
                      </p>
                      {event.address && (
                        <p 
                          className="text-sm font-light"
                          style={{ color: cardMutedColor }}
                        >
                          {event.address}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p 
                        className="text-sm sm:text-base mb-3 sm:mb-4 font-light italic"
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
                      <a 
                        href={getMapUrl(event.address)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-light transition-all hover:gap-3"
                        style={{ color: cardTitleColor }}
                      >
                        <Navigation className="w-4 h-4" />
                        {t('eventDetails.getDirections')}
                        <span className="ml-1">→</span>
                      </a>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          )
        }

        // Original full-width side-by-side layout with photos
        return events.map((event, index) => {
          const isImageRight = index % 2 === 1
          const eventAlignment = getEventAlignment(event.iconType)
          const alignClasses = getAlignmentClasses(eventAlignment)

          return (
            <div 
              key={index}
              className="w-full"
              style={{ 
                backgroundColor: isColored ? bgColor : (index % 2 === 0 ? '#ffffff' : (theme?.colors?.muted ? `${theme.colors.muted}08` : '#fafafa'))
              }}
            >
              <div className={`flex flex-col lg:flex-row ${isImageRight ? 'lg:flex-row-reverse' : ''}`}>
                {/* Image Side */}
                <div className="w-full lg:w-1/2 min-h-[350px] lg:min-h-[550px] relative overflow-hidden">
                  <img 
                    src={event.imageUrl} 
                    alt={`${event.title} venue`}
                    className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 hover:scale-105"
                  />
                  {/* Subtle gradient overlay for elegance */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: isImageRight 
                        ? 'linear-gradient(to left, rgba(0,0,0,0.02), transparent 30%)'
                        : 'linear-gradient(to right, rgba(0,0,0,0.02), transparent 30%)'
                    }}
                  />
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-1/2 flex items-center">
                  <div className={`w-full max-w-lg mx-auto px-4 sm:px-8 py-8 sm:py-10 lg:px-12 lg:py-12 ${alignClasses.text}`}>
                    {/* Event Type Label */}
                    <div className={`flex ${alignClasses.flex} gap-3 mb-3 sm:mb-4`}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center border"
                        style={{ 
                          borderColor: isColored ? `${titleColor}25` : `${theme?.colors?.primary}20`,
                          backgroundColor: 'transparent'
                        }}
                      >
                        {renderEventIcon(event.iconType)}
                      </div>
                    </div>

                    {/* Event Title */}
                    <h3 
                      className="text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-5"
                      style={{ 
                        color: cardTitleColor,
                        fontFamily: 'cursive',
                        fontWeight: 400
                      }}
                    >
                      {event.title}
                    </h3>

                    {/* Time */}
                    <div className={`flex ${alignClasses.flex} gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b`} style={{ borderColor: `${accentLineColor}20` }}>
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: isColored ? `${titleColor}08` : `${theme?.colors?.primary}05` }}
                      >
                        <Clock className="w-4 h-4" style={{ color: accentLineColor }} />
                      </div>
                      <div className={alignClasses.text}>
                        <p className="text-xs uppercase tracking-widest mb-1 font-light" style={{ color: cardMutedColor }}>
                          {t('eventDetails.time')}
                        </p>
                        <span 
                          className="text-lg font-medium"
                          style={{ color: cardTextColor }}
                        >
                          {event.time}
                        </span>
                      </div>
                    </div>

                    {/* Venue Info */}
                    <div className={`flex ${alignClasses.flex} gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b`} style={{ borderColor: `${accentLineColor}20` }}>
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ backgroundColor: isColored ? `${titleColor}08` : `${theme?.colors?.primary}05` }}
                      >
                        <MapPin className="w-4 h-4" style={{ color: accentLineColor }} />
                      </div>
                      <div className={alignClasses.text}>
                        <p className="text-xs uppercase tracking-widest mb-1 font-light" style={{ color: cardMutedColor }}>
                          {t('schedule.location')}
                        </p>
                        <p 
                          className="text-lg font-medium mb-1"
                          style={{ color: cardTextColor }}
                        >
                          {event.venue}
                        </p>
                        {event.address && (
                          <p 
                            className="text-sm font-light"
                            style={{ color: cardMutedColor }}
                          >
                            {event.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p 
                        className="text-sm sm:text-base mb-4 sm:mb-5 font-light italic"
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
                      <a 
                        href={getMapUrl(event.address)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-light transition-all hover:gap-3"
                        style={{ color: cardTitleColor }}
                      >
                        <Navigation className="w-4 h-4" />
                        {t('eventDetails.getDirections')}
                        <span className="ml-1">→</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      })()}

      {/* Embedded Map - Full Width */}
      {showMap && mapAddress && (
        <div className="w-full">
          <div className="aspect-[16/9] md:aspect-[21/7]">
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
        </div>
      )}
    </section>
  )
}
