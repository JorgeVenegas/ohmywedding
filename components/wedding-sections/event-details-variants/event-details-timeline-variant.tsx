"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, ExternalLink, Church, PartyPopper, Calendar } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseEventDetailsProps, EventItem, buildEventsList, getMapUrl, getColorScheme } from './types'

export function EventDetailsTimelineVariant({
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
  customEvents = [],
  useColorBackground = false,
  backgroundColorChoice
}: BaseEventDetailsProps) {
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const events = buildEventsList(wedding, showCeremony, showReception, customEvents, ceremonyImageUrl, receptionImageUrl, ceremonyDescription, receptionDescription)

  const renderEventIcon = (iconType: EventItem['iconType']) => {
    const iconProps = { className: "w-6 h-6", style: { color: 'white' } }
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
  const timelineColor = isColored ? subtitleColor : theme?.colors?.primary
  const dotBgColor = isColored ? titleColor : theme?.colors?.primary

  // Get the first event with an address for the map
  const mapEvent = events.find(e => e.address)
  const mapAddress = mapEvent?.address

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background={isColored ? "default" : "muted"}
      id="event-details"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <p 
            className="text-sm uppercase tracking-[0.3em] mb-3"
            style={{ color: isColored ? sectionTextColorAlt : theme?.colors?.accent }}
          >
            Schedule
          </p>
          <h2 
            className="text-4xl md:text-5xl font-bold"
            style={{ 
              fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                          theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
              color: sectionTitleColor
            }}
          >
            Order of Events
          </h2>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto relative mb-6 sm:mb-8">
          {/* Vertical line */}
          <div 
            className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
            style={{ backgroundColor: timelineColor, opacity: 0.3 }}
          />

          {events.map((event, index) => (
            <div 
              key={index}
              className={`relative flex items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Timeline dot */}
              <div 
                className="absolute left-8 md:left-1/2 w-12 h-12 rounded-full flex items-center justify-center -translate-x-1/2 z-10 shadow-lg"
                style={{ backgroundColor: dotBgColor }}
              >
                {renderEventIcon(event.iconType)}
              </div>

              {/* Spacer for mobile */}
              <div className="w-16 md:hidden" />

              {/* Content */}
              <div className={`flex-1 md:w-[calc(50%-3rem)] ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                <div 
                  className={`rounded-xl overflow-hidden ${isColored ? '' : 'bg-white shadow-lg'}`}
                  style={isColored ? { 
                    backgroundColor: cardBg,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  } : undefined}
                >
                  {/* Event Image */}
                  {showPhotos && event.imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={`${event.title} venue`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Time badge */}
                    <div 
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-3"
                      style={{ 
                        backgroundColor: isColored ? `${titleColor}15` : `${theme?.colors?.primary}10`,
                        color: cardTitleColor
                      }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {event.time}
                    </div>

                    {/* Event Title */}
                    <h3 
                      className="text-2xl font-bold mb-2"
                      style={{ 
                        color: cardTitleColor,
                        fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {event.title}
                    </h3>

                    {/* Venue */}
                    <p 
                      className="font-medium mb-1"
                      style={{ color: cardTextColor }}
                    >
                      {event.venue}
                    </p>

                    {event.address && (
                      <p 
                        className="text-sm flex items-center gap-1 mb-3"
                        style={{ 
                          color: cardMutedColor,
                          justifyContent: 'flex-start'
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{event.address}</span>
                      </p>
                    )}

                  {/* Description */}
                  {event.description && (
                    <p 
                      className="text-sm mb-4"
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
                    <Button 
                      asChild
                      variant="ghost" 
                      size="sm"
                      className="p-0 h-auto"
                      style={{ color: cardTitleColor }}
                    >
                      <a 
                        href={getMapUrl(event.address)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                  </div>
                </div>
              </div>

              {/* Hidden spacer for desktop alternating layout */}
              <div className="hidden md:block md:w-[calc(50%-3rem)]" />
            </div>
          ))}

          {/* End dot */}
          <div 
            className="absolute left-8 md:left-1/2 bottom-0 w-4 h-4 rounded-full -translate-x-1/2"
            style={{ backgroundColor: timelineColor }}
          />
        </div>

        {/* Embedded Map */}
        {showMap && mapAddress && (
          <div className="max-w-4xl mx-auto">
            <Card 
              className="overflow-hidden rounded-xl"
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
      </div>
    </SectionWrapper>
  )
}
