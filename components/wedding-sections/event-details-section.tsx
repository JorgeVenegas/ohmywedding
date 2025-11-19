import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Shirt, ExternalLink } from 'lucide-react'
import { SectionWrapper } from './section-wrapper'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { formatWeddingTime } from '@/lib/wedding-utils-client'
import { type Wedding } from '@/lib/wedding-data'

interface EventDetailsSectionProps {
  wedding: Wedding
  dateId: string
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showCeremony?: boolean
  showReception?: boolean
  showDressCode?: boolean
  showMapLinks?: boolean
  dressCode?: string
  customEvents?: Array<{
    title: string
    time: string
    venue: string
    address?: string
    description?: string
  }>
}

export function EventDetailsSection({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showCeremony = true,
  showReception = true,
  showDressCode = true,
  showMapLinks = true,
  dressCode = "Black tie optional",
  customEvents = []
}: EventDetailsSectionProps) {
  const formattedTime = formatWeddingTime(wedding.wedding_time)

  const events = [
    ...(showCeremony && wedding.ceremony_venue_name ? [{
      title: "Ceremony",
      time: formattedTime,
      venue: wedding.ceremony_venue_name,
      address: wedding.ceremony_venue_address,
      description: "Join us as we exchange vows",
      icon: "💒"
    }] : []),
    ...(showReception && wedding.reception_venue_name ? [{
      title: "Reception",
      time: "Following ceremony", // You might want to add a separate reception time field
      venue: wedding.reception_venue_name,
      address: wedding.reception_venue_address,
      description: "Dinner, dancing, and celebration",
      icon: "🎉"
    }] : []),
    ...customEvents.map(event => ({
      ...event,
      icon: "📅"
    }))
  ]

  const getMapUrl = (address: string) => {
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`
  }

  return (
    <SectionWrapper 
      theme={theme} 
      alignment={alignment} 
      background="muted"
      id="event-details"
    >
      {/* Section Header */}
      <div className="mb-16">
        <h2 
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ 
            fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                        theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
            color: theme?.colors?.foreground || '#1f2937'
          }}
        >
          Event Details
        </h2>
        <div 
          className="w-24 h-1 mx-auto rounded"
          style={{ backgroundColor: theme?.colors?.accent || '#e8a76a' }}
        />
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {events.map((event, index) => (
          <Card key={index} className="p-8 hover:shadow-lg transition-shadow duration-300">
            {/* Event Icon */}
            <div className="text-4xl mb-4 text-center">
              {event.icon}
            </div>

            {/* Event Title */}
            <h3 
              className="text-2xl font-bold mb-4 text-center"
              style={{ 
                color: theme?.colors?.primary || '#a86b8f',
                fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {event.title}
            </h3>

            {/* Time */}
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 flex-shrink-0" style={{ color: theme?.colors?.accent }} />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">TIME</p>
                <p 
                  className="font-medium"
                  style={{ color: theme?.colors?.foreground }}
                >
                  {event.time}
                </p>
              </div>
            </div>

            {/* Venue */}
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme?.colors?.accent }} />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">VENUE</p>
                <p 
                  className="font-medium mb-1"
                  style={{ color: theme?.colors?.foreground }}
                >
                  {event.venue}
                </p>
                {event.address && (
                  <p 
                    className="text-sm"
                    style={{ color: theme?.colors?.muted }}
                  >
                    {event.address}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p 
                className="text-sm mb-4"
                style={{ 
                  color: theme?.colors?.muted,
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
                variant="outline" 
                size="sm" 
                className="w-full"
                style={{ borderColor: theme?.colors?.secondary }}
              >
                <a 
                  href={getMapUrl(event.address)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Directions
                </a>
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Dress Code */}
        {showDressCode && dressCode && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shirt className="w-6 h-6" style={{ color: theme?.colors?.primary }} />
              <h3 
                className="text-xl font-semibold"
                style={{ color: theme?.colors?.foreground }}
              >
                Dress Code
              </h3>
            </div>
            <p 
              className="text-lg"
              style={{ 
                color: theme?.colors?.muted,
                fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {dressCode}
            </p>
          </Card>
        )}

        {/* Quick RSVP */}
        <Card className="p-8 text-center">
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ color: theme?.colors?.foreground }}
          >
            Can't Wait to Celebrate?
          </h3>
          <p 
            className="text-sm mb-6"
            style={{ color: theme?.colors?.muted }}
          >
            Let us know you'll be there!
          </p>
          <Button 
            asChild 
            className="w-full"
            style={{ backgroundColor: theme?.colors?.primary }}
          >
            <Link href={`/${weddingNameId}/rsvp`}>
              RSVP Now
            </Link>
          </Button>
        </Card>
      </div>
    </SectionWrapper>
  )
}