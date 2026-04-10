"use client"

import React from 'react'
import { MapPin, Clock, ExternalLink } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseEventDetailsProps, buildEventList, getMapUrl, getColorScheme, formatWeddingTime } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { HaciendaTilePattern, CandleGlow, HaciendaSectionTitle, FloralDivider, VineAccent, OrnateCorner } from '../hacienda-ornaments'

// Icon assets to display above each event
const EVENT_ICONS = [
  '/assets/Icons/Asset%206.svg', // Desfile
  '/assets/Icons/Asset%201.svg', // Ceremonia Civil
  '/assets/Icons/Asset%202.svg', // Coctel
  '/assets/Icons/Asset%203.svg', // Recepcion
  '/assets/Icons/Asset%204.svg', // Cena
  '/assets/Icons/Asset%205.svg', // Fiesta
] as const

/** Centered event block with large medallion ornament. */
function EventBlock({
  event, index, total, accent,
  textColor, titleColor, mutedColor, showMapLinks, formatTime,
}: {
  event: any; index: number; total: number
  accent: string
  textColor: string; titleColor: string; mutedColor: string
  showMapLinks: boolean; formatTime: (t: string | null) => string
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15, triggerOnce: false })
  const isLast = index === total - 1

  return (
    <div ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: isVisible ? `${index * 180}ms` : '0ms' }}>

      {/* Event icon */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 sm:w-28 sm:h-28"
          style={{
            maskImage: `url('${EVENT_ICONS[index % EVENT_ICONS.length]}')`,
            WebkitMaskImage: `url('${EVENT_ICONS[index % EVENT_ICONS.length]}')`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            backgroundColor: accent,
          }}
        />
      </div>

      {/* Event content — centered */}
      <div className="text-center max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
          <VineAccent color={`${accent}CC`} flip />
          <h3 className="text-2xl sm:text-3xl"
            style={{ fontFamily: 'var(--font-display, cursive)', color: titleColor, fontWeight: 400 }}>
            {event.title}
          </h3>
          <VineAccent color={`${accent}CC`} />
        </div>

        {event.time && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Clock className="w-5 h-5" style={{ color: accent }} />
            <span className="text-sm sm:text-base font-light tracking-wide uppercase"
              style={{ color: accent, fontFamily: 'var(--font-heading, serif)' }}>
              {formatTime(event.time)}
            </span>
          </div>
        )}

        {/* Event image */}
        {event.imageUrl && (
          <div className="my-5 overflow-hidden rounded-lg shadow-md relative mx-auto max-w-md"
            style={{ border: `2px solid ${accent}30`, boxShadow: `0 4px 20px ${accent}15` }}>
            <img
              src={event.imageUrl}
              alt={event.venue ? `${event.venue}` : event.title}
              className="w-full h-auto object-contain sepia-[.08] brightness-[1.02]"
              loading="lazy"
            />
          </div>
        )}

        {event.venue && <p className="text-sm sm:text-base font-medium mb-1.5" style={{ color: textColor }}>{event.venue}</p>}

        {event.address && (
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: mutedColor }} />
            <span className="text-xs sm:text-sm font-light" style={{ color: mutedColor }}>{event.address}</span>
          </div>
        )}

        {event.description && (
          <p className="text-xs sm:text-sm font-light italic mt-3 leading-relaxed max-w-sm mx-auto"
            style={{ color: mutedColor, fontFamily: 'var(--font-body, sans-serif)' }}>
            {event.description}
          </p>
        )}

        {showMapLinks && event.address && (
          <a href={getMapUrl(event.address)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-light tracking-wide uppercase transition-all duration-300 hover:opacity-70 group"
            style={{ color: accent }}>
            <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            <span>Ver mapa</span>
          </a>
        )}
      </div>

      {!isLast && (
        <div className="my-14 sm:my-16 flex justify-center">
          <div
            className="w-32 h-10 sm:w-40 sm:h-12 opacity-70"
            style={{
              maskImage: `url('/assets/Ornaments/Asset%204.svg')`,
              WebkitMaskImage: `url('/assets/Ornaments/Asset%204.svg')`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              backgroundColor: accent,
            }}
          />
        </div>
      )}
    </div>
  )
}

/** Animated venue photo block. */
function VenuePhoto({ url, accent }: { url: string; accent: string }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: false })
  return (
    <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'}`}>
      <div className="flex justify-center mb-6 sm:mb-8">
        <div
          className="w-full h-8 sm:h-10"
          style={{
            maskImage: `url('/assets/Ornaments/Asset%205.svg')`,
            WebkitMaskImage: `url('/assets/Ornaments/Asset%205.svg')`,
            maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
            backgroundColor: `${accent}CC`,
          }}
        />
      </div>
      <div
        className="relative p-1.5 sm:p-2 w-full overflow-hidden group"
        style={{ border: `2px solid ${accent}70`, boxShadow: `0 0 0 1px ${accent}30, 0 12px 40px rgba(0,0,0,0.15)` }}>
        <OrnateCorner position="top-left" color={accent} size="sm" />
        <OrnateCorner position="top-right" color={accent} size="sm" />
        <OrnateCorner position="bottom-left" color={`${accent}CC`} size="sm" />
        <OrnateCorner position="bottom-right" color={`${accent}CC`} size="sm" />
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, ${accent}, ${accent}80, transparent)` }} />
        <div className="overflow-hidden">
          <img
            src={url} alt="Venue"
            className="w-full h-auto object-contain sepia-[.06] brightness-[1.02] transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}70, ${accent}, ${accent}70, transparent)` }} />
      </div>
    </div>
  )
}

export function EventDetailsHaciendaVariant(props: BaseEventDetailsProps) {
  const {
    wedding, theme, alignment, showMapLinks = true, showMap = true,
    venueImageUrl, mapAddress: mapAddressOverride, sectionTitle, sectionSubtitle, useColorBackground, backgroundColorChoice,
  } = props

  const { t } = useI18n()
  const { bgColor, sectionTextColor, sectionTextColorAlt, subtitleColor, isColored } = getColorScheme(
    theme, backgroundColorChoice, useColorBackground
  )

  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'

  const title = sectionTitle || t('eventDetails.title')
  const subtitle = sectionSubtitle || t('eventDetails.joinUsForOurCelebration')

  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const needsDarkText = isColored && (isAccentBg || isSecondaryBg)

  const renderTitleColor = needsDarkText ? primary : (sectionTextColor || primary)
  const renderTextColor = needsDarkText ? primary : (sectionTextColor || primary)
  const renderMutedColor = needsDarkText ? `${primary}99` : (sectionTextColorAlt || `${primary}99`)

  const events = buildEventList(props)
  if (events.length === 0) return null

  // Map address: use explicit override, else first event with an address
  const autoMapAddress = events.find(e => e.address)?.address
  const mapAddress = mapAddressOverride || autoMapAddress

  return (
    <SectionWrapper
      theme={isColored ? undefined : theme} alignment={alignment}
      background={isColored ? 'default' : 'default'} id="event-details"
      style={{ backgroundColor: isColored ? bgColor : secondary }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <HaciendaTilePattern color={isColored ? secondary : accent} opacity={0.08} />
        <CandleGlow position="top" intensity="subtle" />
        <CandleGlow position="bottom" intensity="subtle" />
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-10 relative z-10 flex flex-col items-center justify-center">
        <AnimatedSection className="mb-10 sm:mb-14 w-full">
          <HaciendaSectionTitle
            title={title} subtitle={subtitle}
            titleColor={renderTitleColor}
            subtitleColor={needsDarkText ? `${primary}99` : (isColored ? (subtitleColor || accent) : accent)}
            accentColor={needsDarkText ? primary : accent}
          />
        </AnimatedSection>

        <div className="w-full">
          {events.map((event, index) => (
            <EventBlock
              key={event.id}
              event={event} index={index} total={events.length}
              accent={accent}
              textColor={renderTextColor} titleColor={renderTitleColor} mutedColor={renderMutedColor}
              showMapLinks={showMapLinks} formatTime={formatWeddingTime}
            />
          ))}
        </div>

        {/* Venue photo — independent of map */}
        {venueImageUrl && (
          <div className="w-full mt-10 sm:mt-14">
            <VenuePhoto url={venueImageUrl} accent={accent} />
          </div>
        )}

        {/* Embedded Map — independent of venue photo */}
        {showMap && mapAddress && (
          <div className="w-full mt-10 sm:mt-14">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div
                className="w-full h-8 sm:h-10"
                style={{
                  maskImage: `url('/assets/Ornaments/Asset%205.svg')`,
                  WebkitMaskImage: `url('/assets/Ornaments/Asset%205.svg')`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  backgroundColor: `${accent}CC`,
                }}
              />
            </div>
            <div
              className="relative p-1.5 sm:p-2 w-full"
              style={{ border: `2px solid ${accent}70`, boxShadow: `0 0 0 1px ${accent}30, 0 8px 30px rgba(0,0,0,0.1)` }}>
              <OrnateCorner position="top-left" color={accent} size="sm" />
              <OrnateCorner position="top-right" color={accent} size="sm" />
              <OrnateCorner position="bottom-left" color={`${accent}CC`} size="sm" />
              <OrnateCorner position="bottom-right" color={`${accent}CC`} size="sm" />
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, ${accent}, ${accent}80, transparent)` }} />
              <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden">
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}70, ${accent}, ${accent}70, transparent)` }} />
            </div>
          </div>
        )}

        {/* Bottom closing ornament */}
        <div className="mt-10 sm:mt-14 w-full">
          <FloralDivider color={`${accent}55`} />
        </div>
      </div>
    </SectionWrapper>
  )
}
