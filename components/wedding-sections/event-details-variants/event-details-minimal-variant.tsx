"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, ExternalLink, Church, PartyPopper, Calendar, ArrowRight } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseEventDetailsProps, EventItem, buildEventsList, getMapUrl, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function EventDetailsMinimalVariant({
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
  const { t } = useI18n()
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, colorLight, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const events = buildEventsList(wedding, showCeremony, showReception, customEvents, ceremonyImageUrl, receptionImageUrl, ceremonyDescription, receptionDescription, t)

  const renderEventIcon = (iconType: EventItem['iconType']) => {
    const color = isColored ? sectionTextColor : theme?.colors?.foreground
    const iconProps = { className: "w-5 h-5", style: { color } }
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
  const textColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const mutedColor = isColored ? sectionTextColorAlt : theme?.colors?.muted
  const accentLineColor = isColored ? subtitleColor : theme?.colors?.accent
  const linkColor = isColored ? titleColor : theme?.colors?.primary

  // Get the first event with an address for the map
  const mapEvent = events.find(e => e.address)
  const mapAddress = mapEvent?.address

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background="default"
      id="event-details"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-4 sm:py-6">
        {/* Minimal Header */}
        <div className="text-center mb-20">
          <h2 
            className="text-3xl md:text-4xl font-light tracking-wide"
            style={{ 
              color: sectionTitleColor,
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {t('eventDetails.title')}
          </h2>
        </div>

        {/* Events Grid */}
        <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
          <div className={`grid gap-6 sm:gap-8 ${events.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2'}`}>
            {events.map((event, index) => (
              <div key={index} className="relative">
                {/* Event Image */}
                {showPhotos && event.imageUrl && (
                  <div className="aspect-[4/3] mb-6 overflow-hidden rounded-lg">
                    <img 
                      src={event.imageUrl} 
                      alt={`${event.title} venue`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Event content */}
                <div className="space-y-4">
                  {/* Icon and title row */}
                  <div className="flex items-center gap-3">
                    {renderEventIcon(event.iconType)}
                    <h3 
                      className="text-xl font-medium"
                      style={{ color: textColor }}
                    >
                      {event.title}
                    </h3>
                  </div>

                  {/* Divider line */}
                  <div 
                    className="w-12 h-0.5"
                    style={{ backgroundColor: accentLineColor }}
                  />

                  {/* Time */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: mutedColor }} />
                    <span style={{ color: textColor }}>{event.time}</span>
                  </div>

                  {/* Venue */}
                  <div>
                    <p 
                      className="font-medium mb-1"
                      style={{ color: textColor }}
                    >
                      {event.venue}
                    </p>
                    {event.address && (
                      <p 
                        className="text-sm flex items-start gap-2"
                        style={{ color: mutedColor }}
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{event.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Map Link */}
                  {showMapLinks && event.address && (
                    <a 
                      href={getMapUrl(event.address)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm hover:underline"
                      style={{ color: linkColor }}
                    >
                      {t('eventDetails.viewOnMap')}
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Embedded Map */}
        {showMap && mapAddress && (
          <div className="max-w-4xl mx-auto">
            <Card 
              className="overflow-hidden"
              style={isColored ? { 
                backgroundColor: cardBg,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
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
